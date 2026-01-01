import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, User, MenuItem, OrderItem } from '../types';
import { MENUS, SUB_LOCATIONS, SubLocation, DISEASE_DETAILS, DiseaseInfo } from '../constants';
import { MenuView } from './MenuView';
import { HospitalConsultations } from './HospitalConsultations';
import { JobApplicationModal } from './JobApplicationModal';
import { ManagerDashboard } from './ManagerDashboard';
import { WorkerView } from './WorkerView';
import { JYPBanditSystem } from './JYPBanditSystem';
import { VIPReservationModal } from './VIPReservationModal';
import { PharmacyView } from './PharmacyView';
import { FridgeModal } from './FridgeModal';
import { RecipesModal } from './RecipesModal';
import { supabaseService } from '../services/supabaseService';

// Import wallpapers
import hospitalEntrance from '../src/assets/wallpapers/hospital-entrance.jpg';
import crecheEntrance from '../src/assets/wallpapers/creche-entrance.jpg';
import restauranteMain from '../src/assets/wallpapers/restaurante-main.jpg';
import padariaMain from '../src/assets/wallpapers/padaria-main.jpg';
import pousadaEntrance from '../src/assets/wallpapers/pousada-entrance.jpg';
import farmaciaMain from '../src/assets/wallpapers/farmacia-main.jpg';
import supermercadoMain from '../src/assets/wallpapers/supermercado-main.jpg';

interface ChatInterfaceProps {
  locationContext?: string;
  onClose?: () => void;
  currentUser: User;
  onMemberClick?: (user: User) => void;
  onUpdateStatus?: (changes: { hp?: number; hunger?: number; thirst?: number; alcohol?: number; money?: number }) => void;
  onConsumeItems?: (items: MenuItem[]) => void;
  onClearDisease?: (hpRestore: number) => void;
  onNavigate?: (locationId: string) => void;
  onMarkAsRead?: (location: string, subLocation?: string | null) => void;
}

const LOCATIONS_LIST = [
  { id: 'hospital', name: 'Hospital', icon: 'medical_services' },
  { id: 'creche', name: 'Creche', icon: 'child_care' },
  { id: 'restaurante', name: 'Restaurante', icon: 'restaurant' },
  { id: 'padaria', name: 'Padaria', icon: 'bakery_dining' },
  { id: 'pousada', name: 'Pousada', icon: 'hotel' },
  { id: 'farmacia', name: 'Farmácia', icon: 'local_pharmacy' },
];

const RACE_THEMES: Record<string, { color: string, icon: string, bg: string }> = {
  'draeven': { color: 'text-rose-500', icon: 'local_fire_department', bg: 'bg-rose-500/10' },
  'sylven': { color: 'text-emerald-500', icon: 'eco', bg: 'bg-emerald-500/10' },
  'lunari': { color: 'text-cyan-400', icon: 'dark_mode', bg: 'bg-cyan-400/10' },
  'ai': { color: 'text-primary', icon: 'auto_awesome', bg: 'bg-primary/10' }
};

const getRaceTheme = (race?: string, isAI?: boolean) => {
  if (isAI) return RACE_THEMES['ai'];
  const key = (race || 'draeven').toLowerCase();
  return RACE_THEMES[key] || RACE_THEMES['draeven'];
};

const WALLPAPERS: Record<string, string> = {
  hospital: hospitalEntrance,
  creche: crecheEntrance,
  restaurante: restauranteMain,
  padaria: padariaMain,
  pousada: pousadaEntrance,
  farmacia: farmaciaMain,
  supermercado: supermercadoMain,
  default: hospitalEntrance
};

const ICONS: Record<string, string> = {
  hospital: 'medical_services',
  creche: 'child_care',
  restaurante: 'restaurant',
  padaria: 'bakery_dining',
  pousada: 'hotel',
  farmacia: 'local_pharmacy',
  default: 'chat'
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  locationContext, 
  onClose, 
  currentUser, 
  onMemberClick, 
  onUpdateStatus, 
  onConsumeItems, 
  onClearDisease,
  onNavigate,
  onMarkAsRead
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [offMessages, setOffMessages] = useState<ChatMessage[]>([]);
  const [roomMessages, setRoomMessages] = useState<Record<string, ChatMessage[]>>({});
  const [currentSubLoc, setCurrentSubLoc] = useState<SubLocation | null>(null);
  const [workerRole, setWorkerRole] = useState<string | null>(null);
  const [authorizedRooms, setAuthorizedRooms] = useState<string[]>([]);
  const [isOffChatMode, setIsOffChatMode] = useState(false);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showConsultations, setShowConsultations] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showManagerDash, setShowManagerDash] = useState(false);
  const [showWorkerPanel, setShowWorkerPanel] = useState(false);
  const [showGrantAccess, setShowGrantAccess] = useState(false);
  const [showVIPModal, setShowVIPModal] = useState(false);
  const [showFridge, setShowFridge] = useState(false);
  const [showRecipes, setShowRecipes] = useState(false);
  const [hasVIPAccess, setHasVIPAccess] = useState(false);
  const [activeVIPReservation, setActiveVIPReservation] = useState<any>(null);
  
  const [onlineMembers, setOnlineMembers] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionTab, setSuggestionTab] = useState<'locais' | 'acoes'>('locais');
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedTargetUser, setSelectedTargetUser] = useState<User | null>(null);
  const [itemActionMode, setItemActionMode] = useState<'use' | 'send' | 'share' | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  const contextKey = locationContext?.toLowerCase() || 'default';
  const isChatOff = contextKey === 'chat_off';
  const isHospital = contextKey === 'hospital';
  const isPharmacy = contextKey === 'farmacia';
  const isPousadaKitchen = contextKey === 'pousada' && currentSubLoc?.name === 'Cozinha';
  const activeWallpaper = currentSubLoc ? currentSubLoc.wallpaper : (WALLPAPERS[contextKey] || WALLPAPERS.default);
  
  const icon = isChatOff ? 'forum' : (ICONS[contextKey] || ICONS.default);
  const hasMenu = MENUS[contextKey] !== undefined;
  const [showPharmacy, setShowPharmacy] = useState(false);

  // Força modo OFF para chat_off location, reseta para RP em outros locais
  useEffect(() => {
    if (isChatOff) {
      setIsOffChatMode(true);
    } else {
      setIsOffChatMode(false);
    }
  }, [isChatOff, locationContext]);
  
  const internalLocs = (SUB_LOCATIONS[contextKey] || []).filter(loc => {
    if (!loc.restricted) return true;
    if (workerRole) return true;
    if (authorizedRooms.includes(loc.name)) return true;
    return false;
  });

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose || (() => {}), 350);
  };

  const loadMessages = useCallback(async () => {
    const loc = locationContext || 'global';
    
    try {
      // Load RP messages
      const dbMessages = await supabaseService.getChatMessages(loc, currentSubLoc?.name);
      
      console.log(`[Chat] Carregando mensagens para ${loc}/${currentSubLoc?.name || 'main'}:`, dbMessages?.length || 0);
      
      // Se a busca retornar null (erro de rede), não atualiza o estado
      if (dbMessages === null) {
        console.warn("[Chat] Erro ao buscar - mantendo estado atual");
        return;
      }
      
      const formattedMessages: ChatMessage[] = dbMessages.map(msg => ({
        id: msg.id,
        role: msg.user_id === 'jyp-bandit' ? 'model' : 'user',
        text: msg.content,
        author: msg.user_id === 'jyp-bandit' ? {
          id: 'jyp-bandit',
          name: 'JYP',
          username: 'jyp',
          avatar: '/jyp-avatar.jpg',
          race: 'draeven' as any
        } : {
          id: msg.user_id,
          name: msg.character_name || msg.profiles?.full_name || 'Viajante',
          username: msg.profiles?.username || 'user',
          avatar: msg.character_avatar || msg.profiles?.avatar_url || '',
          race: 'draeven' as any
        }
      }));
      
      if (currentSubLoc) {
        setRoomMessages(prev => ({
          ...prev,
          [currentSubLoc.name]: formattedMessages
        }));
      } else {
        setMessages(formattedMessages);
      }

      // Load OFF messages (stored with sub_location = 'OFF')
      const offDbMessages = await supabaseService.getChatMessages(loc, 'OFF');
      if (offDbMessages !== null) {
        const formattedOffMessages: ChatMessage[] = offDbMessages.map(msg => ({
          id: msg.id,
          role: 'user',
          text: msg.content,
          author: {
            id: msg.user_id,
            name: msg.profiles?.full_name || 'Viajante',
            username: msg.profiles?.username || 'user',
            avatar: msg.profiles?.avatar_url || '',
            race: 'draeven' as any
          }
        }));
        setOffMessages(formattedOffMessages);
      }
    } catch (error) {
      // Em caso de erro, NÃO limpa as mensagens - mantém o estado atual
      console.error("[Chat] Erro ao carregar mensagens:", error);
    }
  }, [locationContext, currentSubLoc]);

  useEffect(() => {
    loadMessages();
    
    if (locationContext && currentUser?.id) {
      supabaseService.checkWorkerStatus(currentUser.id, locationContext).then(setWorkerRole);
      supabaseService.checkRoomAccess(currentUser.id, locationContext).then(setAuthorizedRooms);
      supabaseService.getAllProfiles().then(setOnlineMembers);
      
      if (locationContext === 'restaurante' || locationContext === 'padaria') {
        supabaseService.checkVIPAccess(currentUser.id, locationContext).then(setHasVIPAccess);
        supabaseService.getActiveVIPReservation(locationContext).then(setActiveVIPReservation);
      }
    }
  }, [locationContext, currentUser?.id, loadMessages, currentSubLoc?.name]);

  // Separate effect to mark chat as read (only runs once per location change)
  useEffect(() => {
    if (locationContext && onMarkAsRead) {
      onMarkAsRead(locationContext, currentSubLoc?.name);
    }
  }, [locationContext, currentSubLoc?.name]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, roomMessages, offMessages, currentSubLoc, isLoading, isOffChatMode]);

  useEffect(() => {
    if (input === '/' || input === '*') {
      setShowSuggestions(true);
      setSuggestionTab('locais');
      setSelectedItem(null);
      setItemActionMode(null);
      supabaseService.getInventory(currentUser.id).then(setInventoryItems);
    } else if (!input.startsWith('/') && !input.startsWith('*')) {
      setShowSuggestions(false);
    }
  }, [input, currentUser.id]);

  const handleUseItem = async (item: any) => {
    try {
      await supabaseService.consumeFromInventory(item.id, item.quantity);
      const attrs = item.attributes || {};
      if (onUpdateStatus) {
        onUpdateStatus({
          hunger: attrs.hunger || 0,
          thirst: attrs.thirst || 0,
          alcohol: attrs.alcohol || 0
        });
      }
      handleSend(`*Usou ${item.item_name}*`);
      setShowSuggestions(false);
      setSelectedItem(null);
      setInput('');
    } catch (error: any) {
      alert("Erro ao usar item: " + error.message);
    }
  };

  const handleSendItem = async (item: any, targetUser: User) => {
    try {
      await supabaseService.consumeFromInventory(item.id, 1);
      await supabaseService.addToInventory(targetUser.id, {
        id: item.item_id,
        name: item.item_name,
        description: item.attributes?.description || '',
        price: 0,
        image: item.item_image,
        category: item.category || 'Item',
        hungerRestore: item.attributes?.hunger,
        thirstRestore: item.attributes?.thirst,
        alcoholLevel: item.attributes?.alcohol
      });
      handleSend(`*Enviou ${item.item_name} para ${targetUser.name}*`);
      setShowSuggestions(false);
      setSelectedItem(null);
      setSelectedTargetUser(null);
      setItemActionMode(null);
      setInput('');
    } catch (error: any) {
      alert("Erro ao enviar item: " + error.message);
    }
  };

  const handleShareItem = async (item: any, targetUser: User) => {
    try {
      await supabaseService.consumeFromInventory(item.id, item.quantity);
      const attrs = item.attributes || {};
      const halfHunger = Math.floor((attrs.hunger || 0) / 2);
      const halfThirst = Math.floor((attrs.thirst || 0) / 2);
      const halfAlcohol = Math.floor((attrs.alcohol || 0) / 2);
      
      if (onUpdateStatus) {
        onUpdateStatus({
          hunger: halfHunger,
          thirst: halfThirst,
          alcohol: halfAlcohol
        });
      }
      
      await supabaseService.updateVitalStatus(targetUser.id, {
        hunger: Math.min(100, (targetUser.hunger || 0) + halfHunger),
        energy: Math.min(100, (targetUser.thirst || 0) + halfThirst),
        alcoholism: Math.min(100, (targetUser.alcohol || 0) + halfAlcohol)
      });
      
      handleSend(`*Dividiu ${item.item_name} com ${targetUser.name}*`);
      setShowSuggestions(false);
      setSelectedItem(null);
      setSelectedTargetUser(null);
      setItemActionMode(null);
      setInput('');
    } catch (error: any) {
      alert("Erro ao dividir item: " + error.message);
    }
  };

  const handleOrderConfirmed = async (items: MenuItem[], orderItems: OrderItem[], preparationTime: number) => {
    const total = items.reduce((acc, item) => acc + item.price, 0);
    if ((currentUser.money || 0) < total) {
      alert("Saldo insuficiente para este pedido!");
      return;
    }

    try {
      await supabaseService.createFoodOrder(
        currentUser.id,
        currentUser.name,
        locationContext || 'restaurante',
        orderItems,
        total,
        preparationTime
      );
      
      handleSend(`*Fez um pedido no valor de ${total.toFixed(2)} MKC. Aguardando preparo (~${preparationTime}min)...*`);
      setShowMenu(false);
    } catch (error: any) {
      alert("Erro ao criar pedido: " + error.message);
    }
  };

  const handleTreat = async (disease: DiseaseInfo) => {
    if ((currentUser.money || 0) < disease.treatmentCost) {
      alert("Saldo insuficiente para o tratamento!");
      return;
    }

    try {
      const newBalance = (currentUser.money || 0) - disease.treatmentCost;
      await supabaseService.updateMoney(currentUser.id, newBalance);
      
      if (onUpdateStatus) onUpdateStatus({ money: -disease.treatmentCost });
      if (onClearDisease) onClearDisease(Math.abs(disease.hpImpact));
      
      handleSend(`*Pagou ${disease.treatmentCost} MKC pelo antídoto e está se sentindo muito melhor!*`);
      setShowConsultations(false);
    } catch (error: any) {
      alert("Erro ao processar pagamento: " + error.message);
    }
  };

  const handleJYPRobbery = useCallback(async (victimId: string, amount: number) => {
    if (victimId === currentUser.id) {
      const newBalance = Math.max(0, (currentUser.money || 0) - amount);
      await supabaseService.updateMoney(currentUser.id, newBalance);
      if (onUpdateStatus) {
        onUpdateStatus({ money: -amount });
      }
    }
  }, [currentUser, onUpdateStatus]);

  const handleJYPMessage = useCallback((msg: ChatMessage) => {
    if (currentSubLoc) {
      setRoomMessages(prev => ({
        ...prev,
        [currentSubLoc.name]: [...(prev[currentSubLoc.name] || []), msg]
      }));
    } else {
      setMessages(prev => [...prev, msg]);
    }
  }, [currentSubLoc]);

  const activeMessages = isOffChatMode 
    ? offMessages 
    : currentSubLoc 
      ? (roomMessages[currentSubLoc.name] || []) 
      : messages;

  const handleSend = async (customMsg?: string) => {
    const textToSend = (customMsg || input).trim();
    if (!textToSend || isLoading) return;

    // Don't process navigation commands in OFF chat
    if (!isOffChatMode && (textToSend.startsWith('/') || textToSend.startsWith('*'))) {
      const target = textToSend.slice(1).toLowerCase();
      const loc = LOCATIONS_LIST.find(l => l.id === target || l.name.toLowerCase() === target);
      if (loc && onNavigate) {
        onNavigate(loc.id);
        setInput('');
        setShowSuggestions(false);
        return;
      }
    }

    const userMessage: ChatMessage = { 
      id: Date.now().toString(), 
      role: 'user', 
      text: textToSend,
      author: currentUser
    };
    
    if (isOffChatMode) {
      setOffMessages(prev => [...prev, userMessage]);
    } else if (currentSubLoc) {
      setRoomMessages(prev => ({
        ...prev,
        [currentSubLoc.name]: [...(prev[currentSubLoc.name] || []), userMessage]
      }));
    } else {
      setMessages(prev => [...prev, userMessage]);
    }
    
    if (!customMsg) setInput('');

    try {
      await supabaseService.sendChatMessage(
        currentUser.id,
        locationContext || 'global',
        textToSend,
        isOffChatMode ? undefined : currentUser.name,
        isOffChatMode ? undefined : currentUser.avatar,
        isOffChatMode ? 'OFF' : currentSubLoc?.name
      );
      // Não recarrega mensagens após enviar - a mensagem já foi adicionada localmente
      // Isso evita que erros de rede limpem as mensagens exibidas
    } catch (error) {
      console.error("Erro ao salvar mensagem:", error);
    }
  };

  const handleGrantAccess = async (targetUser: User, roomName: string) => {
    try {
      if (!locationContext) return;
      await supabaseService.grantRoomAccess(targetUser.id, locationContext, roomName, currentUser.id);
      alert(`Acesso à ${roomName} liberado para ${targetUser.name}! ✨`);
      setShowGrantAccess(false);
      setShowSuggestions(false);
      setInput('');
    } catch (error: any) {
      alert("Erro ao liberar sala: " + error.message);
    }
  };

  const handleSuggestionClick = (locId: string) => {
    if (onNavigate) {
      onNavigate(locId);
      setInput('');
      setShowSuggestions(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-[100] bg-black flex flex-col h-[100dvh] overflow-hidden ${isClosing ? 'animate-out slide-out-bottom' : 'animate-in slide-in-bottom'}`}>
      <div className="absolute inset-0 z-0">
        <div className="relative w-full h-full">
          <img key={activeWallpaper} src={activeWallpaper} className="w-full h-full object-cover brightness-50" alt="interior" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black"></div>
        </div>
      </div>

      <div className={`relative z-10 px-6 pt-12 pb-6 flex items-center justify-between backdrop-blur-3xl border-b ${isChatOff ? 'bg-cyan-900/40 border-cyan-500/30' : 'bg-black/40 border-white/10'}`}>
        <div className="flex items-center space-x-4">
          {currentSubLoc ? (
            <button onClick={() => setCurrentSubLoc(null)} className="w-12 h-12 rounded-[20px] bg-white/10 flex items-center justify-center text-white border border-white/20"><span className="material-symbols-rounded">arrow_back</span></button>
          ) : (
            <div className={`w-12 h-12 rounded-[20px] border border-white/30 flex items-center justify-center text-white ${isChatOff ? 'bg-gradient-to-br from-cyan-500 to-purple-600 shadow-[0_0_25px_rgba(6,182,212,0.6)]' : isHospital ? 'bg-blue-500 shadow-blue-500/50' : 'bg-primary/90 shadow-[0_0_25px_rgba(139,92,246,0.6)]'}`}>
              <span className="material-symbols-rounded text-2xl">{icon}</span>
            </div>
          )}
          
          <div>
            <h3 className="text-xl font-black text-white leading-none capitalize tracking-tighter">{isChatOff ? 'Chat OFF' : currentSubLoc ? currentSubLoc.name : (locationContext || 'Magic Chat')}</h3>
            <div className="flex items-center mt-1.5 space-x-2">
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isChatOff ? 'bg-cyan-400' : 'bg-green-500'}`}></div>
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isChatOff ? 'text-cyan-300/70' : 'text-white/50'}`}>{isChatOff ? 'Fora do Roleplay' : currentSubLoc ? `Cenário: ${locationContext}` : 'Canal Ativo'}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {!isChatOff && isPousadaKitchen && (
            <>
              <button onClick={() => setShowFridge(true)} className="w-11 h-11 rounded-2xl bg-cyan-500 text-white flex items-center justify-center shadow-lg border border-white/20 active:scale-90 transition-all">
                <span className="material-symbols-rounded">kitchen</span>
              </button>
              <button onClick={() => setShowRecipes(true)} className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg border border-white/20 active:scale-90 transition-all">
                <span className="material-symbols-rounded">menu_book</span>
              </button>
            </>
          )}

          {!isChatOff && locationContext && !currentSubLoc && (
            <>
              {workerRole ? (
                <button onClick={() => setShowWorkerPanel(true)} className="w-11 h-11 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg border border-white/20 active:scale-90 transition-all">
                  <span className="material-symbols-rounded">assignment</span>
                </button>
              ) : (
                <button onClick={() => setShowJobModal(true)} className="w-11 h-11 rounded-2xl bg-white/5 text-white flex items-center justify-center border border-white/10 active:scale-90 transition-all">
                  <span className="material-symbols-rounded">work</span>
                </button>
              )}
            </>
          )}

          {!isChatOff && isHospital && !currentSubLoc && (
            <button onClick={() => setShowConsultations(true)} className="w-11 h-11 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg border border-white/20 active:scale-90"><span className="material-symbols-rounded">stethoscope</span></button>
          )}
          {!isChatOff && isPharmacy && !currentSubLoc && (
            <button onClick={() => setShowPharmacy(true)} className="px-5 py-3 rounded-2xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-xl border border-white/20 active:scale-95 transition-all">Balcão</button>
          )}
          {!isChatOff && hasMenu && !currentSubLoc && !isHospital && !isPharmacy && (
            <button onClick={() => setShowMenu(true)} className="px-5 py-3 rounded-2xl bg-secondary text-white text-[10px] font-black uppercase tracking-widest shadow-xl border border-white/20 active:scale-95 transition-all">Menu</button>
          )}
          <button onClick={handleClose} className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-2xl flex items-center justify-center border border-white/10 text-white shadow-lg active:scale-90"><span className="material-symbols-rounded">close</span></button>
        </div>
      </div>

      {/* Toggle RP/OFF Chat removed - roleplay chats are only roleplay, OFF is separate location */}

      {/* OFF Chat Banner when active */}
      {isOffChatMode && (
        <div className={`relative z-10 px-6 py-2 border-b flex items-center justify-center gap-2 ${isChatOff ? 'bg-cyan-500/20 border-cyan-500/30' : 'bg-amber-500/20 border-amber-500/30'}`}>
          <span className={`material-symbols-rounded text-sm ${isChatOff ? 'text-cyan-400' : 'text-amber-500'}`}>info</span>
          <span className={`text-[9px] font-black uppercase tracking-widest ${isChatOff ? 'text-cyan-400' : 'text-amber-500'}`}>{isChatOff ? 'Chat livre - Sem personagem, sem roleplay!' : 'Chat fora do roleplay - Converse livremente!'}</span>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 relative z-10 scrollbar-hide pb-32">
        {activeMessages.map(msg => {
          const isJYP = msg.author?.id === 'jyp-bandit';
          const theme = getRaceTheme(msg.author?.race, isJYP);
          const isOwnMessage = msg.author?.id === currentUser.id;
          
          // OFF Chat mode - simplified display
          if (isOffChatMode) {
            return (
              <div key={msg.id} className={`flex items-start space-x-3 ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : 'justify-start'}`}>
                <button onClick={() => msg.author && onMemberClick?.(msg.author)} className="w-10 h-10 rounded-[16px] flex-shrink-0 border-2 border-amber-500/30 overflow-hidden shadow-xl">
                  <img src={msg.author?.avatar} className="w-full h-full object-cover" alt="avatar" />
                </button>
                <div className={`flex flex-col space-y-1.5 max-w-[80%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                  <span className="text-[11px] font-bold text-amber-500/70">{msg.author?.name || 'Viajante'}</span>
                  <div className={`px-5 py-3.5 rounded-[24px] text-[13.5px] font-bold leading-relaxed shadow-2xl border ${isOwnMessage ? 'bg-amber-600 text-white border-amber-500/30 rounded-tr-none' : 'bg-zinc-800 text-white border-amber-500/20 rounded-tl-none'}`}>
                    <p>{msg.text}</p>
                  </div>
                </div>
              </div>
            );
          }
          
          // RP Chat mode - full display with race tags
          return (
            <div key={msg.id} className={`flex items-start space-x-3 ${isOwnMessage && !isJYP ? 'flex-row-reverse space-x-reverse' : 'justify-start'}`}>
              <button onClick={() => msg.author && onMemberClick?.(msg.author)} className={`w-10 h-10 rounded-[16px] flex-shrink-0 border-2 border-white/20 overflow-hidden shadow-xl flex items-center justify-center ${isJYP ? 'bg-pink-500' : 'bg-surface-purple'}`}>
                {isJYP ? <img src="/jyp-avatar.jpg" className="w-full h-full object-cover" alt="JYP" /> : <img src={msg.author?.avatar} className="w-full h-full object-cover" alt="avatar" />}
              </button>
              <div className={`flex flex-col space-y-1.5 max-w-[80%] ${isOwnMessage && !isJYP ? 'items-end' : 'items-start'}`}>
                <div className={`flex items-center space-x-2 ${isOwnMessage && !isJYP ? 'flex-row-reverse space-x-reverse' : ''}`}>
                   <span className="text-[13px] font-black text-white tracking-tight">{isJYP ? 'JYP' : (msg.author?.name || 'Viajante')}</span>
                   <div className={`flex items-center space-x-1 px-1.5 py-0.5 rounded-md ${isJYP ? 'bg-pink-500 text-white' : `${theme.bg.replace('/10', '')} ${theme.color.replace('text-', 'text-white')}`} border border-white/10`}><span className="material-symbols-rounded text-[10px]">{isJYP ? 'theater_comedy' : theme.icon}</span><span className="text-[8px] font-black uppercase tracking-widest">{isJYP ? 'Bandido' : (msg.author?.race || 'Humano')}</span></div>
                </div>
                <div className={`px-5 py-3.5 rounded-[24px] text-[13.5px] font-bold leading-relaxed shadow-2xl border border-white/5 ${isJYP ? 'bg-pink-700 text-white rounded-tl-none' : isOwnMessage ? 'bg-primary text-white rounded-tr-none' : 'bg-zinc-800 text-white rounded-tl-none'}`}>
                  {msg.text.split('\n').map((line, i) => {
                    const parts = line.split(/(\*[^*]+\*)/g);
                    return (
                      <p key={i} className="mb-1">
                        {parts.map((part, j) => {
                          if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
                            return <span key={j} className="text-white/50 font-medium">{part.slice(1, -1)}</span>;
                          }
                          return <span key={j}>{part}</span>;
                        })}
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-6 pb-12 pt-4 relative z-10">
        {showSuggestions && !isOffChatMode && (
          <div className="absolute bottom-[calc(100%+12px)] left-6 right-6 bg-background-dark rounded-[32px] border border-white/10 p-5 shadow-[0_-20px_60px_rgba(0,0,0,0.5)] animate-in slide-in-bottom duration-300 max-h-[60vh] overflow-hidden flex flex-col">
             <div className="flex items-center space-x-2 mb-4">
               <button 
                 onClick={() => { setSuggestionTab('locais'); setSelectedItem(null); setItemActionMode(null); }}
                 className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${suggestionTab === 'locais' ? 'bg-primary text-white' : 'bg-white/5 text-white/40'}`}
               >
                 <span className="material-symbols-rounded text-sm mr-2">location_on</span>
                 Locais
               </button>
               <button 
                 onClick={() => { setSuggestionTab('acoes'); setSelectedItem(null); setItemActionMode(null); }}
                 className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${suggestionTab === 'acoes' ? 'bg-emerald-500 text-white' : 'bg-white/5 text-white/40'}`}
               >
                 <span className="material-symbols-rounded text-sm mr-2">restaurant</span>
                 Ações
               </button>
             </div>
             
             <div className="flex-1 overflow-y-auto scrollbar-hide">
               {suggestionTab === 'locais' ? (
                 !showGrantAccess ? (
                   <div className="grid grid-cols-2 gap-3">
                     {LOCATIONS_LIST.map(loc => (
                       <button 
                         key={loc.id}
                         onClick={() => handleSuggestionClick(loc.id)}
                         className="flex items-center space-x-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-primary hover:border-primary transition-all active:scale-95 group"
                       >
                         <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white group-hover:bg-white group-hover:text-primary transition-all">
                           <span className="material-symbols-rounded">{loc.icon}</span>
                         </div>
                         <span className="text-[10px] font-black uppercase tracking-widest text-white">{loc.name}</span>
                       </button>
                     ))}
                   </div>
                 ) : (
                   <div className="space-y-4 animate-in zoom-in">
                     <div className="px-2 mb-2">
                       <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Selecione o Usuário</p>
                     </div>
                     <div className="flex space-x-3 overflow-x-auto scrollbar-hide pb-2">
                       {onlineMembers.filter(m => m.id !== currentUser.id).map(member => (
                         <button 
                           key={member.id} 
                           onClick={() => {
                             const room = prompt(`Qual sala deseja liberar para ${member.name}?`);
                             if (room) handleGrantAccess(member, room);
                           }}
                           className="flex flex-col items-center space-y-2 group flex-shrink-0"
                         >
                           <img src={member.avatar} className="w-12 h-12 rounded-2xl border border-white/10 group-hover:border-primary" alt={member.name} />
                           <span className="text-[7px] font-black text-white/40 uppercase truncate w-12">{member.name}</span>
                         </button>
                       ))}
                     </div>
                     <button onClick={() => setShowGrantAccess(false)} className="w-full py-3 rounded-xl bg-white/5 text-white/20 text-[8px] font-black uppercase tracking-widest">Voltar</button>
                   </div>
                 )
               ) : (
                 <div className="space-y-4">
                   {!selectedItem ? (
                     inventoryItems.length === 0 ? (
                       <div className="py-8 text-center opacity-40">
                         <span className="material-symbols-rounded text-4xl mb-2 block">inventory_2</span>
                         <p className="text-[10px] font-black uppercase tracking-widest">Inventário vazio</p>
                       </div>
                     ) : (
                       <div className="space-y-2">
                         {inventoryItems.map(item => (
                           <button
                             key={item.id}
                             onClick={() => setSelectedItem(item)}
                             className="w-full flex items-center space-x-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-emerald-500 hover:border-emerald-500 transition-all active:scale-98 group"
                           >
                             <img src={item.item_image} className="w-12 h-12 rounded-xl object-cover border border-white/10" alt={item.item_name} />
                             <div className="flex-1 text-left">
                               <p className="text-[11px] font-black text-white">{item.item_name}</p>
                               <p className="text-[8px] text-white/30 uppercase tracking-widest">{item.category} • x{item.quantity}</p>
                             </div>
                             <div className="flex items-center space-x-2 text-[8px] text-white/40">
                               {item.attributes?.hunger && <span className="flex items-center"><span className="material-symbols-rounded text-xs text-amber-400 mr-1">restaurant</span>{item.attributes.hunger}</span>}
                               {item.attributes?.thirst && <span className="flex items-center"><span className="material-symbols-rounded text-xs text-cyan-400 mr-1">water_drop</span>{item.attributes.thirst}</span>}
                             </div>
                           </button>
                         ))}
                       </div>
                     )
                   ) : !itemActionMode ? (
                     <div className="space-y-4 animate-in zoom-in">
                       <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                         <img src={selectedItem.item_image} className="w-16 h-16 rounded-xl object-cover" alt={selectedItem.item_name} />
                         <div>
                           <p className="text-sm font-black text-white">{selectedItem.item_name}</p>
                           <p className="text-[9px] text-white/40">{selectedItem.category}</p>
                         </div>
                       </div>
                       
                       <div className="grid grid-cols-3 gap-3">
                         <button
                           onClick={() => handleUseItem(selectedItem)}
                           className="flex flex-col items-center p-4 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all active:scale-95"
                         >
                           <span className="material-symbols-rounded text-2xl mb-2">restaurant</span>
                           <span className="text-[8px] font-black uppercase tracking-widest">Usar</span>
                         </button>
                         <button
                           onClick={() => setItemActionMode('send')}
                           className="flex flex-col items-center p-4 rounded-2xl bg-blue-500 text-white hover:bg-blue-600 transition-all active:scale-95"
                         >
                           <span className="material-symbols-rounded text-2xl mb-2">send</span>
                           <span className="text-[8px] font-black uppercase tracking-widest">Enviar</span>
                         </button>
                         <button
                           onClick={() => setItemActionMode('share')}
                           className="flex flex-col items-center p-4 rounded-2xl bg-pink-500 text-white hover:bg-pink-600 transition-all active:scale-95"
                         >
                           <span className="material-symbols-rounded text-2xl mb-2">group</span>
                           <span className="text-[8px] font-black uppercase tracking-widest">Dividir</span>
                         </button>
                       </div>
                       
                       <button onClick={() => setSelectedItem(null)} className="w-full py-3 rounded-xl bg-white/5 text-white/20 text-[8px] font-black uppercase tracking-widest">Voltar</button>
                     </div>
                   ) : (
                     <div className="space-y-4 animate-in zoom-in">
                       <div className="px-2">
                         <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">
                           {itemActionMode === 'send' ? 'Enviar para quem?' : 'Dividir com quem?'}
                         </p>
                       </div>
                       
                       <div className="grid grid-cols-3 gap-3">
                         {onlineMembers.filter(m => m.id !== currentUser.id).map(member => (
                           <button
                             key={member.id}
                             onClick={() => {
                               if (itemActionMode === 'send') {
                                 handleSendItem(selectedItem, member);
                               } else {
                                 handleShareItem(selectedItem, member);
                               }
                             }}
                             className="flex flex-col items-center p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all active:scale-95"
                           >
                             <img src={member.avatar} className="w-12 h-12 rounded-2xl border border-white/10 mb-2" alt={member.name} />
                             <span className="text-[8px] font-black text-white/60 uppercase truncate w-full text-center">{member.name}</span>
                           </button>
                         ))}
                       </div>
                       
                       <button onClick={() => setItemActionMode(null)} className="w-full py-3 rounded-xl bg-white/5 text-white/20 text-[8px] font-black uppercase tracking-widest">Voltar</button>
                     </div>
                   )}
                 </div>
               )}
             </div>
             
             {workerRole && suggestionTab === 'locais' && !showGrantAccess && (
               <button 
                 onClick={() => setShowGrantAccess(true)}
                 className="mt-4 flex items-center justify-center space-x-2 bg-primary text-white px-4 py-3 rounded-xl w-full"
               >
                 <span className="material-symbols-rounded text-sm">key</span>
                 <span className="text-[8px] font-black uppercase tracking-widest">Liberar Sala</span>
               </button>
             )}
          </div>
        )}

        <div className={`flex items-center space-x-3 rounded-[40px] p-2.5 pl-5 border shadow-2xl ${isOffChatMode ? 'bg-amber-900/50 border-amber-500/30' : 'bg-zinc-900 border-white/10'}`}>
          {!isOffChatMode && (
            <button onClick={() => setShowActionModal(true)} className="w-13 h-13 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all hover:bg-white/15"><span className="material-symbols-rounded text-3xl">add</span></button>
          )}
          <input 
            type="text" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyPress={(e) => e.key === 'Enter' && handleSend()} 
            placeholder={isOffChatMode ? "Mensagem fora do roleplay..." : currentSubLoc ? `Roleplay em ${currentSubLoc.name}...` : "O que você faz agora?"} 
            className="flex-1 bg-transparent border-none text-[15px] focus:ring-0 placeholder:text-white/20 text-white font-bold py-4 px-2" 
          />
          <button onClick={() => handleSend()} disabled={isLoading || !input.trim()} className={`w-13 h-13 rounded-full flex items-center justify-center transition-all ${isLoading || !input.trim() ? 'bg-white/5 text-white/10' : isOffChatMode ? 'bg-amber-500 text-white active:scale-90' : 'bg-primary text-white active:scale-90'}`}><span className="material-symbols-rounded text-3xl">send</span></button>
        </div>
      </div>

      {showActionModal && (
        <div className="fixed inset-0 z-[160] bg-black/95 flex items-end animate-in fade-in duration-400">
          <div className="w-full bg-background-dark rounded-t-[60px] border-t border-white/10 p-10 pb-16 animate-in slide-in-from-bottom duration-500 shadow-[0_-30px_120px_rgba(0,0,0,1)]">
            <div className="w-16 h-1.5 bg-white/5 rounded-full mx-auto mb-6"></div>
            
            <div className="mb-8 bg-zinc-900 border border-white/10 rounded-[32px] p-6 flex items-center justify-between">
               <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white border border-white/10">
                    <span className="material-symbols-rounded text-2xl">payments</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Minha Carteira</p>
                    <p className="text-xl font-black text-white tracking-tighter">{(currentUser?.money || 0).toFixed(2)} MKC</p>
                  </div>
               </div>
               <div className="bg-primary px-4 py-2 rounded-xl">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Premium</span>
               </div>
            </div>

            <div className="space-y-8">
              <div className="flex items-center justify-between px-4">
                 <div className="flex items-center space-x-3">
                   <div className="w-2 h-6 bg-primary rounded-full"></div>
                   <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40">Ações de Local</h3>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5 max-h-[40vh] overflow-y-auto scrollbar-hide pb-8">
                {internalLocs.map((loc, idx) => {
                  const isVIPRoom = loc.name === 'Reserva VIP';
                  const canAccessVIP = isVIPRoom && (hasVIPAccess || workerRole);
                  const showVIPLock = isVIPRoom && !canAccessVIP && !workerRole;
                  
                  return (
                    <button 
                      key={idx} 
                      onClick={() => {
                        if (isVIPRoom && !canAccessVIP) {
                          setShowActionModal(false);
                          setShowVIPModal(true);
                        } else {
                          setCurrentSubLoc(loc);
                          setShowActionModal(false);
                        }
                      }} 
                      className={`relative flex flex-col items-center justify-center p-8 rounded-[40px] border active:scale-95 transition-all shadow-2xl group overflow-hidden ${
                        isVIPRoom 
                          ? 'bg-amber-600 border-amber-500' 
                          : 'bg-zinc-900 border-white/5'
                      }`}
                    >
                      <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-5 border transition-all duration-500 ${
                        isVIPRoom
                          ? 'bg-white/20 text-white border-white/30'
                          : 'bg-white/5 text-white border-white/10 group-hover:bg-primary'
                      }`}>
                        <span className="material-symbols-rounded text-3xl">{loc.icon}</span>
                      </div>
                      <span className={`text-[11px] font-black uppercase tracking-[0.25em] text-center text-white`}>
                        {loc.name}
                      </span>
                      
                      {isVIPRoom && (
                        <div className="absolute top-4 right-4">
                          {canAccessVIP ? (
                            <span className="material-symbols-rounded text-white text-xs">verified</span>
                          ) : (
                            <span className="material-symbols-rounded text-white text-xs">lock</span>
                          )}
                        </div>
                      )}
                      
                      {loc.restricted && !isVIPRoom && (
                        <div className="absolute top-4 right-4"><span className="material-symbols-rounded text-primary text-xs">lock</span></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <button onClick={() => setShowActionModal(false)} className="w-full bg-white text-black py-7 rounded-[36px] text-[11px] font-black uppercase tracking-[0.5em] shadow-3xl active:scale-[0.97] transition-all">Voltar</button>
          </div>
        </div>
      )}

      {showJobModal && locationContext && <JobApplicationModal location={locationContext} userId={currentUser.id} onClose={() => setShowJobModal(false)} onSuccess={() => setShowJobModal(false)} onManagerAccess={() => { setShowJobModal(false); setShowManagerDash(true); }} />}
      {showManagerDash && locationContext && <ManagerDashboard location={locationContext} onClose={() => setShowManagerDash(false)} />}
      {showWorkerPanel && locationContext && workerRole && <WorkerView location={locationContext} role={workerRole} onClose={() => setShowWorkerPanel(false)} onManageTeam={() => { setShowWorkerPanel(false); setShowManagerDash(true); }} currentUserId={currentUser?.id} />}
      {showMenu && hasMenu && !currentSubLoc && <MenuView locationName={locationContext || ''} items={MENUS[contextKey]} onClose={() => setShowMenu(false)} onOrderConfirmed={handleOrderConfirmed} />}
      {showConsultations && isHospital && <HospitalConsultations onClose={() => setShowConsultations(false)} onTreat={handleTreat} currentUserId={currentUser?.id} />}
      {showVIPModal && locationContext && <VIPReservationModal location={locationContext} currentUser={currentUser} onClose={() => setShowVIPModal(false)} onSuccess={() => { setShowVIPModal(false); supabaseService.checkVIPAccess(currentUser.id, locationContext).then(setHasVIPAccess); }} onMoneyChange={(amount) => onUpdateStatus?.({ money: amount })} />}
      {contextKey === 'pousada' && <JYPBanditSystem location={contextKey} subLocation={currentSubLoc?.name} currentUser={currentUser} onlineUsers={[currentUser, ...onlineMembers.filter(m => m.id !== currentUser.id)]} onRobbery={handleJYPRobbery} onJYPMessage={handleJYPMessage} />}
      {showPharmacy && <PharmacyView onClose={() => setShowPharmacy(false)} currentUser={currentUser} onUpdateMoney={(amount) => onUpdateStatus?.({ money: amount })} />}
      {showFridge && <FridgeModal userId={currentUser.id} userName={currentUser.name} onClose={() => setShowFridge(false)} />}
      {showRecipes && <RecipesModal userId={currentUser.id} userName={currentUser.name} onClose={() => setShowRecipes(false)} />}
    </div>
  );
};