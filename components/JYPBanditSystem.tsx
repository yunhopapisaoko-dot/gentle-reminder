import React, { useEffect, useState, useCallback } from 'react';
import { supabaseService } from '../services/supabaseService';
import { User, ChatMessage } from '../types';

// Avatar do JYP
const jypAvatar = '/jyp-avatar.jpg';

// JYP aparece a cada 70 horas (em ms)
const JYP_INTERVAL_MS = 70 * 60 * 60 * 1000;

// Mensagens de cena do JYP
const JYP_SCENES = [
  "*Uma figura sombria surge das sombras, é JYP! Seus olhos brilham de forma ameaçadora enquanto ele se aproxima...*",
  "*O ar fica pesado quando JYP aparece do nada, com um sorriso malicioso no rosto. Ele vasculha rapidamente os bolsos das pessoas...*",
  "*Um flash de movimento! JYP aparece como um raio, suas mãos hábeis já procurando algo para roubar...*",
  "*O ladrão lendário JYP emerge da escuridão. Não há tempo para reagir enquanto ele faz seu trabalho...*",
  "*Silêncio... Então, de repente, JYP está ali! Com movimentos rápidos como um gato, ele começa a revirar pertences...*",
];

const JYP_ESCAPE_MESSAGES = [
  "*JYP desaparece tão rápido quanto apareceu, deixando apenas o som de sua risada ecoando...*",
  "*Com um último sorriso debochado, JYP some nas sombras, levando seu prêmio consigo!*",
  "*'Até a próxima!' grita JYP enquanto foge em velocidade impressionante!*",
  "*JYP faz uma mesura irônica antes de evaporar como fumaça, deixando todos em choque!*",
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
    
    // Mensagem de entrada
    const entranceScene = JYP_SCENES[Math.floor(Math.random() * JYP_SCENES.length)];
    const escapeScene = JYP_ESCAPE_MESSAGES[Math.floor(Math.random() * JYP_ESCAPE_MESSAGES.length)];
    
    // Envia mensagem de cena
    const entranceMsg: ChatMessage = {
      id: `jyp-${Date.now()}`,
      role: 'model',
      text: entranceScene,
      author: {
        id: 'jyp-bandit',
        name: 'JYP',
        username: 'jyp_bandit',
        avatar: jypAvatar,
        race: 'draeven' as any
      }
    };
    onJYPMessage(entranceMsg);
    
    // Aguarda um pouco para drama
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mensagem de roubo
    const robberyMsg: ChatMessage = {
      id: `jyp-robbery-${Date.now()}`,
      role: 'model',
      text: `*JYP rapidamente pega ${actualStolen} MKC de ${victim.name}!*`,
      author: {
        id: 'jyp-bandit',
        name: 'JYP',
        username: 'jyp_bandit',
        avatar: jypAvatar,
        race: 'draeven' as any
      }
    };
    onJYPMessage(robberyMsg);
    
    // Registra o roubo
    await supabaseService.recordJYPAppearance(
      location,
      subLocation,
      victim.id,
      victim.name,
      actualStolen,
      `${entranceScene} Roubou ${actualStolen} MKC de ${victim.name}!`
    );
    
    // Aplica a perda de dinheiro
    onRobbery(victim.id, actualStolen);
    
    // Aguarda mais um pouco
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mensagem de fuga
    const escapeMsg: ChatMessage = {
      id: `jyp-escape-${Date.now()}`,
      role: 'model',
      text: escapeScene,
      author: {
        id: 'jyp-bandit',
        name: 'JYP',
        username: 'jyp_bandit',
        avatar: jypAvatar,
        race: 'draeven' as any
      }
    };
    onJYPMessage(escapeMsg);
    
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
    
    // Também verifica imediatamente ao entrar
    setTimeout(checkJYPAppearance, 10000); // 10 segundos após entrar
    
    return () => clearInterval(interval);
  }, [isPousada, checkJYPAppearance]);

  // Componente não renderiza nada visualmente
  return null;
};

export default JYPBanditSystem;
