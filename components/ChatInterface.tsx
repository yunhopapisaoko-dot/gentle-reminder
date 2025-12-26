import React, { useState, useEffect, useRef } from 'react';
import { getCommunityChat } from '../services/geminiService';
import { ChatMessage, User } from '../types';
import { MENUS, SUB_LOCATIONS, SubLocation } from '../constants';
import { MenuView } from './MenuView';

interface ChatInterfaceProps {
  locationContext?: string;
  onClose?: () => void;
  currentUser: User;
  onMemberClick?: (user: User) => void;
}

const RACE_THEMES: Record<string, string> = {
  'Draeven': 'text-rose-400 bg-rose-500/10 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)]',
  'Sylven': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
  'Lunari': 'text-cyan-300 bg-cyan-400/10 border-cyan-400/30 shadow-[0_0_10px_rgba(34,211,238,0.2)]',
};

const WALLPAPERS: Record<string, string> = {
  hospital: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=1000&auto=format&fit=crop',
  creche: 'https://images.unsplash.com/photo-1560523160-754a9e25c68f?q=80&w=1000&auto=format&fit=crop',
  restaurante: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1000&auto=format&fit=crop',
  padaria: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1000&auto=format&fit=crop',
  default: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1000&auto=format&fit=crop'
};

const ICONS: Record<string, string> = {
  hospital: 'medical_services',
  creche: 'child_care',
  restaurante: 'restaurant',
  padaria: 'bakery_dining',
  default: 'chat'
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ locationContext, onClose, currentUser, onMemberClick }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [roomMessages, setRoomMessages] = useState<Record<string, ChatMessage[]>>({});
  const [currentSubLoc, setCurrentSubLoc] = useState<SubLocation | null>(null);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  
  const chatRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const contextKey = locationContext?.toLowerCase() || 'default';
  const mainWallpaper = WALLPAPERS[contextKey] || WALLPAPERS.default;
  const activeWallpaper = currentSubLoc ? currentSubLoc.wallpaper : mainWallpaper;
  
  const icon = ICONS[contextKey] || ICONS.default;
  const hasMenu = MENUS[contextKey] !== undefined;
  const internalLocs = SUB_LOCATIONS[contextKey] || [];

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose || (() => {}), 350);
  };

  useEffect(() => {
    try {
      chatRef.current = getCommunityChat();
    } catch (e) {
      chatRef.current = null;
    }
    
    const welcomeText = locationContext 
      ? `[Cenário: ${locationContext}] O mundo está pronto para sua história. Como deseja começar seu roleplay? ^_^`
      : "Bem-vindo ao MagicTalk! Este é o seu espaço de roleplay.";
    
    setMessages([{ id: 'main-welcome', role: 'model', text: welcomeText }]);
  }, [locationContext]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, roomMessages, currentSubLoc, isLoading]);

  const activeMessages = currentSubLoc 
    ? (roomMessages[currentSubLoc.name] || []) 
    : messages;

  const handleSend = async (customMsg?: string) => {
    const textToSend = customMsg || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: ChatMessage = { 
      id: Date.now().toString(), 
      role: 'user', 
      text: textToSend,
      author: currentUser
    };
    
    if (currentSubLoc) {
      setRoomMessages(prev => ({
        ...prev,
        [currentSubLoc.name]: [...(prev[currentSubLoc.name] || []), userMessage]
      }));
    } else {
      setMessages(prev => [...prev, userMessage]);
    }
    
    if (!customMsg) setInput('');

    if (chatRef.current && !currentSubLoc) {
      setIsLoading(true);
      try {
        const response = await chatRef.current.sendMessage(textToSend);
        const modelMessage: ChatMessage = { 
          id: (Date.now() + 1).toString(), 
          role: 'model', 
          text: response.response.text() 
        };
        setMessages(prev => [...prev, modelMessage]);
      } catch (error) {
        console.error("Erro na IA:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSelectSubLoc = (loc: SubLocation) => {
    setCurrentSubLoc(loc);
    setShowActionModal(false);
    
    if (!roomMessages[loc.name]) {
      const welcome: ChatMessage = {
        id: `welcome-${loc.name}`,
        role: 'model',
        text: `*Você entrou no(a) ${loc.name}*\nEste lugar está tranquilo. O que pretende fazer por aqui?`
      };
      setRoomMessages(prev => ({ ...prev, [loc.name]: [welcome] }));
    }
  };

  const handleExitSubLoc = () => {
    setCurrentSubLoc(null);
  };

  return (
    <div className={`fixed inset-0 z-[100] bg-black flex flex-col h-[100dvh] overflow-hidden ${isClosing ? 'animate-out slide-out-bottom' : 'animate-in slide-in-bottom'}`}>
      
      <div className="absolute inset-0 z-0">
        <div className="relative w-full h-full">
          <img 
            key={activeWallpaper}
            src={activeWallpaper} 
            className="w-full h-full object-cover animate-in fade-in duration-1000 brightness-50" 
            alt="interior" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black"></div>
          <div className="absolute inset-0 backdrop-blur-[2px]"></div>
        </div>
      </div>

      <div className="relative z-10 px-6 pt-12 pb-6 flex items-center justify-between backdrop-blur-3xl bg-black/40 border-b border-white/10">
        <div className="flex items-center space-x-4">
          {currentSubLoc ? (
            <button 
              onClick={handleExitSubLoc}
              className="w-12 h-12 rounded-[20px] bg-white/10 flex items-center justify-center text-white active:scale-90 transition-all border border-white/20 hover:bg-white/20"
            >
              <span className="material-symbols-rounded text-2xl">arrow_back</span>
            </button>
          ) : (
            <div className="w-12 h-12 rounded-[20px] bg-primary/90 shadow-[0_0_25px_rgba(139,92,246,0.6)] border border-white/30 flex items-center justify-center text-white">
              <span className="material-symbols-rounded text-2xl">{icon}</span>
            </div>
          )}
          
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-black text-white leading-none capitalize tracking-tighter">
                {currentSubLoc ? currentSubLoc.name : (locationContext || 'Magic Chat')}
              </h3>
              {currentSubLoc && <span className="bg-secondary/20 text-secondary text-[8px] font-black px-2.5 py-1 rounded-full border border-secondary/30 uppercase tracking-widest">Sala Privada</span>}
            </div>
            <div className="flex items-center mt-1.5 space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]"></div>
              <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">
                {currentSubLoc ? `Região: ${locationContext}` : 'Cenário Ativo'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {hasMenu && !currentSubLoc && (
            <button 
              onClick={() => setShowMenu(true)}
              className="px-6 py-3 rounded-2xl bg-secondary text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-secondary/30 active:scale-95 transition-all border border-white/20 hover:brightness-110"
            >
              Menu
            </button>
          )}
          <button 
            onClick={handleClose}
            className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-2xl flex items-center justify-center border border-white/10 text-white shadow-lg active:scale-90 hover:bg-white/10"
          >
            <span className="material-symbols-rounded text-2xl">close</span>
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-10 relative z-10 scrollbar-hide pb-32">
        {activeMessages.map(msg => (
          <div key={msg.id} className={`flex items-start space-x-3 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'justify-start'}`}>
            <button 
              onClick={() => msg.author && onMemberClick?.(msg.author)}
              className={`w-11 h-11 rounded-2xl mt-1 flex-shrink-0 border-2 border-white/40 overflow-hidden shadow-2xl flex items-center justify-center transition-transform active:scale-90 ${msg.role === 'model' ? 'bg-primary cursor-default' : 'bg-surface-purple cursor-pointer'}`}
            >
              {msg.role === 'model' ? (
                <span className="material-symbols-rounded text-white text-2xl">auto_awesome</span>
              ) : (
                <img src={msg.author?.avatar} className="w-full h-full object-cover" alt="avatar" />
              )}
            </button>
            <div className={`flex flex-col space-y-1.5 max-w-[82%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              {msg.author && (
                <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} px-2 space-y-0.5`}>
                  {msg.author.race && (
                    <span className={`text-[7px] font-black px-2 py-0.5 rounded-full border uppercase tracking-[0.2em] ${RACE_THEMES[msg.author.race] || 'text-white/40 bg-white/5 border-white/10'}`}>
                      {msg.author.race}
                    </span>
                  )}
                  <span className="text-[11px] font-black text-white italic opacity-90">@{msg.author.username}</span>
                </div>
              )}
              <div className={`px-6 py-4 rounded-[32px] shadow-2xl text-[14px] font-bold leading-relaxed animate-in zoom-in duration-500 backdrop-blur-3xl border border-white/10 ${
                msg.role === 'user' 
                  ? 'bg-primary/70 text-white rounded-tr-none' 
                  : 'bg-black/70 text-white rounded-tl-none'
              }`}>
                {msg.text.split('\n').map((line, i) => (
                  <p key={i} className={line.startsWith('*') ? 'italic text-white/50 text-[12px] mb-1.5 block' : 'mb-1'}>{line}</p>
                ))}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-end space-x-3 animate-in fade-in">
             <div className="bg-black/60 backdrop-blur-3xl px-6 py-4 rounded-[32px] rounded-bl-none border border-white/10 shadow-2xl">
                <div className="flex space-x-2">
                  <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
             </div>
          </div>
        )}
      </div>

      <div className="px-6 pb-12 pt-4 relative z-10">
        <div className="flex items-center space-x-3 bg-black/60 backdrop-blur-3xl rounded-[40px] p-2.5 pl-5 border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.6)]">
          <button 
            onClick={() => setShowActionModal(true)}
            className="w-13 h-13 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all hover:bg-white/15"
          >
            <span className="material-symbols-rounded text-3xl">add</span>
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={currentSubLoc ? `Roleplay em ${currentSubLoc.name}...` : "Sua próxima ação..."}
            className="flex-1 bg-transparent border-none text-[15px] focus:ring-0 placeholder:text-white/20 text-white font-bold py-4 px-2"
          />
          
          <button 
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className={`w-13 h-13 rounded-full flex items-center justify-center transition-all ${
              isLoading || !input.trim()
                ? 'bg-white/5 text-white/10' 
                : 'bg-primary text-white shadow-2xl shadow-primary/40 active:scale-90 hover:brightness-110'
            }`}
          >
            <span className="material-symbols-rounded text-3xl">send</span>
          </button>
        </div>
      </div>

      {showActionModal && (
        <div className="fixed inset-0 z-[160] bg-black/90 backdrop-blur-3xl flex items-end animate-in fade-in duration-400">
          <div className="w-full bg-background-dark rounded-t-[60px] border-t border-white/10 p-10 pb-16 animate-in slide-in-from-bottom duration-500 shadow-[0_-30px_120px_rgba(0,0,0,1)]">
            <div className="w-16 h-1.5 bg-white/5 rounded-full mx-auto mb-10"></div>
            <div className="space-y-8">
              <div className="flex items-center justify-between px-4">
                <div className="flex items-center space-x-3">
                   <div className="w-2 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]"></div>
                   <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40">Mudar de Sala</h3>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5 max-h-[40vh] overflow-y-auto scrollbar-hide pb-8">
                {internalLocs.map((loc, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSubLoc(loc)}
                    className="relative flex flex-col items-center justify-center p-8 rounded-[40px] bg-white/[0.03] border border-white/5 hover:bg-white/10 active:scale-95 transition-all shadow-2xl group overflow-hidden"
                  >
                    <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center text-white mb-5 border border-white/10 group-hover:bg-primary group-hover:border-primary transition-all duration-500">
                      <span className="material-symbols-rounded text-3xl">{loc.icon}</span>
                    </div>
                    <span className="text-[11px] font-black text-white uppercase tracking-[0.25em] text-center">{loc.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setShowActionModal(false)} className="w-full bg-white text-black py-7 rounded-[36px] text-[11px] font-black uppercase tracking-[0.5em] shadow-3xl active:scale-[0.97] transition-all">Voltar ao Roleplay</button>
          </div>
        </div>
      )}

      {showMenu && hasMenu && !currentSubLoc && (
        <MenuView locationName={locationContext || ''} items={MENUS[contextKey]} onClose={() => setShowMenu(false)} />
      )}
    </div>
  );
};