import React, { useEffect, useState, useCallback } from 'react';
import { supabaseService } from '../services/supabaseService';
import { User, ChatMessage } from '../types';

// Avatar do JYP
const JYP_AVATAR = '/jyp-avatar.jpg';

// JYP aparece a cada 70 horas (em ms)
const JYP_INTERVAL_MS = 70 * 60 * 60 * 1000;

// Cenas completas do JYP (uma única mensagem grande)
const JYP_COMPLETE_SCENES = [
  (victimName: string, amount: number) => 
    `*As luzes da pousada piscam ameaçadoramente. Uma figura sombria surge das sombras - é JYP! Seus olhos brilham de forma ameaçadora enquanto ele se aproxima lentamente, um sorriso malicioso no rosto. Com movimentos rápidos como um gato, ele vasculha os pertences de ${victimName}, encontrando exatamente o que procurava. "Muito obrigado pela contribuição!" ele sussurra debochadamente enquanto pega ${amount} MKC. Antes que alguém possa reagir, JYP desaparece nas sombras tão rápido quanto apareceu, deixando apenas o eco de sua risada sinistra...*`,
  
  (victimName: string, amount: number) => 
    `*O ar fica pesado de repente. Um flash de movimento e JYP materializa do nada, com aquele sorriso característico que só pode significar problemas. Ele caminha calmamente até ${victimName}, ignorando qualquer tentativa de resistência. "Não se preocupe, vou cuidar bem disso..." ele diz enquanto habilmente subtrai ${amount} MKC. Com uma mesura irônica e exagerada, JYP some como fumaça, deixando todos em estado de choque. "Até a próxima!" ecoa sua voz fantasmagórica...*`,
  
  (victimName: string, amount: number) => 
    `*Silêncio absoluto. Então, como um raio, JYP está ali! Ninguém viu de onde ele veio, ninguém sabe como chegou. Seus passos são silenciosos como os de um fantasma enquanto se aproxima de ${victimName}. "Você parece ter mais do que precisa," ele comenta casualmente, suas mãos já trabalhando para extrair ${amount} MKC dos pertences da vítima. "Considere isso uma... taxa de hospitalidade!" JYP ri alto, e num piscar de olhos, desaparece na escuridão, deixando apenas perplexidade e bolsos mais leves para trás...*`,
  
  (victimName: string, amount: number) => 
    `*Uma brisa gelada atravessa a pousada. JYP emerge da penumbra, sua presença imponente e ameaçadora. Ele avalia todos no local com olhos calculistas antes de focar em ${victimName}. "Você foi escolhido! Que sortudo!" ele declara com falso entusiasmo enquanto rapidamente apodera-se de ${amount} MKC. Ninguém consegue reagir a tempo - JYP é rápido demais, experiente demais. Com um último sorriso debochado e um aceno teatral, ele se dissolve nas sombras. "Foi um prazer fazer negócios!" sua voz ecoa enquanto some completamente...*`,
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
