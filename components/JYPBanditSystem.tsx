import React, { useEffect, useState, useCallback } from 'react';
import { supabaseService } from '../services/supabaseService';
import { User, ChatMessage } from '../types';

// Avatar do JYP (foto de perfil)
const JYP_AVATAR = '/jyp-avatar.jpg';

// JYP aparece a cada 70 horas (em ms)
const JYP_INTERVAL_MS = 70 * 60 * 60 * 1000;

// Cenas completas do JYP (uma única mensagem grande)
// Usa - para fala e * para ações (itálico) - Estilo performático e dançante
const JYP_COMPLETE_SCENES = [
  (victimName: string, amount: number) => 
    `*As luzes piscam em ritmo. Uma silhueta surge da escuridão, deslizando pelo chão como se flutuasse. Cada passo é um movimento de dança, cada giro uma provocação elegante. Aproxima-se de ${victimName} em uma valsa solitária...* - Ah, que belo encontro... *Gira graciosamente ao redor da vítima, dedos dançando pelos pertences.* - Permita-me esta dança... *Em um movimento fluido e teatral, recolhe ${amount} MKC.* - Obrigado pelo show! *Curva-se em reverência dramática e desaparece com um último passo de dança nas sombras.*`,
  
  (victimName: string, amount: number) => 
    `*O ar vibra com uma energia misteriosa. Surge como um dançarino entrando no palco, movimentos precisos e hipnotizantes. Cada gesto é coreografado, cada olhar é uma performance.* - Aplausos, por favor... *Desliza até ${victimName} em passos suaves, quase invisíveis.* - Você foi escolhido para minha próxima apresentação... *Mãos hábeis extraem ${amount} MKC enquanto executa um moonwalk para trás.* - Bravo! Bis! *Lança uma rosa imaginária e desvanece no escuro com um arabesque final.*`,
  
  (victimName: string, amount: number) => 
    `*Um spotlight invisível parece iluminar a figura que surge do nada, pose dramática, olhos intensos. Move-se como água, cada transição é arte pura.* - O espetáculo... começou. *Dança em direção a ${victimName}, braços ondulando como serpentes hipnóticas.* - Esta noite, você é minha plateia especial... *Com elegância provocadora, desliza ${amount} MKC para sua posse.* - Standing ovation merecida! *Executa uma pirueta perfeita e se dissolve na penumbra, deixando apenas o eco de passos ritmados.*`,
  
  (victimName: string, amount: number) => 
    `*Uma brisa carrega notas de uma melodia distante. Emerge das sombras em câmera lenta, cada movimento um frame de arte viva. Os olhos brilham com mistério e travessura.* - Todo mundo é um palco... *Aproxima-se de ${victimName} em uma coreografia sedutora e ameaçadora.* - E eu sou o protagonista. *Dedos ágeis coletam ${amount} MKC em um gesto que parece parte da dança.* - Que performance magnífica! *Faz uma reverência teatral profunda.* - Até o próximo ato! *Gira sobre os calcanhares e se funde com as sombras em um grand finale silencioso.*`,
];

interface JYPBanditSystemProps {
  location: string;
  subLocation?: string;
  currentUser: User;
  onlineUsers: User[];
  onRobbery: (victimId: string, amount: number) => void;
  onJYPMessage: (message: ChatMessage) => void;
}

export const JYPBanditSystem: React.FC<JYPBanditSystemProps> = ({
  location,
  subLocation,
  currentUser,
  onlineUsers,
  onRobbery,
  onJYPMessage
}) => {
  const [lastAppearance, setLastAppearance] = useState<Date | null>(null);
  const [isActive, setIsActive] = useState(false);

  // Verifica se está na Pousada
  const isPousada = location.toLowerCase() === 'pousada';

  // Busca última aparição do JYP
  const checkLastAppearance = useCallback(async () => {
    if (!isPousada) return;
    
    const last = await supabaseService.getLastJYPAppearance();
    if (last) {
      setLastAppearance(new Date(last.appeared_at));
    }
  }, [isPousada]);

  // Verifica se JYP deve aparecer
  const checkJYPAppearance = useCallback(async () => {
    if (!isPousada || isActive) return;
    
    const now = new Date();
    const shouldAppear = !lastAppearance || 
      (now.getTime() - lastAppearance.getTime() >= JYP_INTERVAL_MS);
    
    if (shouldAppear && onlineUsers.length > 0) {
      // Chance de 30% de aparecer quando as condições são atendidas
      if (Math.random() < 0.3) {
        triggerJYPRobbery();
      }
    }
  }, [isPousada, isActive, lastAppearance, onlineUsers]);

  // Dispara o roubo do JYP
  const triggerJYPRobbery = async () => {
    setIsActive(true);

    // Guard extra: revalidar no banco para evitar múltiplos clientes disparando ao mesmo tempo
    try {
      const lastDb = await supabaseService.getLastJYPAppearance();
      if (lastDb?.appeared_at) {
        const lastDbDate = new Date(lastDb.appeared_at);
        const now = new Date();
        if (now.getTime() - lastDbDate.getTime() < JYP_INTERVAL_MS) {
          setLastAppearance(lastDbDate);
          setIsActive(false);
          return;
        }
      }
    } catch {
      // Se falhar a leitura, segue o fluxo normal
    }
    
    // Seleciona uma vítima aleatória (pode ser o usuário atual ou outros online)
    const possibleVictims = onlineUsers.filter(u => (u.money || 0) > 10);
    if (possibleVictims.length === 0) {
      setIsActive(false);
      return;
    }
    
    const victim = possibleVictims[Math.floor(Math.random() * possibleVictims.length)];
    const stolenAmount = Math.floor(Math.random() * 191) + 10; // 10 a 200
    const actualStolen = Math.min(stolenAmount, victim.money || 0);
    
    if (actualStolen <= 0) {
      setIsActive(false);
      return;
    }
    
    // Seleciona uma cena completa aleatória
    const sceneGenerator = JYP_COMPLETE_SCENES[Math.floor(Math.random() * JYP_COMPLETE_SCENES.length)];
    const sceneText = sceneGenerator(victim.name, actualStolen);
    
    // Envia uma única mensagem com toda a cena
    const jypMessage: ChatMessage = {
      id: `jyp-${Date.now()}`,
      role: 'model',
      text: sceneText,
      author: {
        id: 'jyp-bandit',
        name: 'JYP',
        username: 'jyp',
        avatar: JYP_AVATAR,
        race: 'draeven' as any
      }
    };
    onJYPMessage(jypMessage);
    
    // Salvar mensagem do JYP no chat_messages para persistir
    await supabaseService.sendChatMessage(
      'jyp-bandit',
      location,
      sceneText,
      'JYP',
      JYP_AVATAR,
      subLocation
    );
    
    // Registra o roubo no banco
    await supabaseService.recordJYPAppearance(
      location,
      subLocation,
      victim.id,
      victim.name,
      actualStolen,
      sceneText
    );
    
    // Aplica a perda de dinheiro
    onRobbery(victim.id, actualStolen);
    
    setLastAppearance(new Date());
    setIsActive(false);
  };

  useEffect(() => {
    checkLastAppearance();
  }, [checkLastAppearance]);

  useEffect(() => {
    if (!isPousada) return;
    
    // Verifica a cada 5 minutos se JYP deve aparecer
    const interval = setInterval(checkJYPAppearance, 5 * 60 * 1000);
    
    // Também verifica imediatamente ao entrar (após 10 segundos)
    setTimeout(checkJYPAppearance, 10000);
    
    return () => clearInterval(interval);
  }, [isPousada, checkJYPAppearance]);

  // Componente não renderiza nada visualmente
  return null;
};

export default JYPBanditSystem;
