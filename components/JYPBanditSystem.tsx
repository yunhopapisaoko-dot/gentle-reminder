import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabaseService } from '../services/supabaseService';
import { User } from '../types';

// Avatar do JYP (foto de perfil)
const JYP_AVATAR = '/jyp-avatar.jpg';

// UUID fixo do sistema para o JYP (permite inserção válida no banco)
const JYP_SYSTEM_UUID = '00000000-0000-0000-0000-000000000002';

// JYP só pode roubar novamente após 70 horas (em ms)
const JYP_COOLDOWN_MS = 70 * 60 * 60 * 1000;

// Locais onde o JYP pode aparecer (escolhido aleatoriamente)
const JYP_LOCATIONS = ['pousada', 'praia'];

// Cenas completas do JYP (uma única mensagem grande)
const JYP_COMPLETE_SCENES = [
  (victimName: string, amount: number) => 
    `*As luzes piscam em ritmo.*

*Uma silhueta surge da escuridão, deslizando pelo chão como se flutuasse.*

*Cada passo é um movimento de dança, cada giro uma provocação elegante.*

*Aproxima-se de ${victimName} em uma valsa solitária...*

- Ah, que belo encontro...

*Gira graciosamente ao redor da vítima, dedos dançando pelos pertences.*

- Permita-me esta dança...

*Em um movimento fluido e teatral, recolhe ${amount} MKC.*

- Obrigado pelo show!

*Curva-se em reverência dramática e desaparece com um último passo de dança nas sombras.*`,
  
  (victimName: string, amount: number) => 
    `*O ar vibra com uma energia misteriosa.*

*Surge como um dançarino entrando no palco, movimentos precisos e hipnotizantes.*

*Cada gesto é coreografado, cada olhar é uma performance.*

- Aplausos, por favor...

*Desliza até ${victimName} em passos suaves, quase invisíveis.*

- Você foi escolhido para minha próxima apresentação...

*Mãos hábeis extraem ${amount} MKC enquanto executa um moonwalk para trás.*

- Bravo! Bis!

*Lança uma rosa imaginária e desvanece no escuro com um arabesque final.*`,
  
  (victimName: string, amount: number) => 
    `*Um spotlight invisível parece iluminar a figura que surge do nada, pose dramática, olhos intensos.*

*Move-se como água, cada transição é arte pura.*

- O espetáculo... começou.

*Dança em direção a ${victimName}, braços ondulando como serpentes hipnóticas.*

- Esta noite, você é minha plateia especial...

*Com elegância provocadora, desliza ${amount} MKC para sua posse.*

- Standing ovation merecida!

*Executa uma pirueta perfeita e se dissolve na penumbra, deixando apenas o eco de passos ritmados.*`,
  
  (victimName: string, amount: number) => 
    `*Uma brisa carrega notas de uma melodia distante.*

*Emerge das sombras em câmera lenta, cada movimento um frame de arte viva.*

*Os olhos brilham com mistério e travessura.*

- Todo mundo é um palco...

*Aproxima-se de ${victimName} em uma coreografia sedutora e ameaçadora.*

- E eu sou o protagonista.

*Dedos ágeis coletam ${amount} MKC em um gesto que parece parte da dança.*

- Que performance magnífica!

*Faz uma reverência teatral profunda.*

- Até o próximo ato!

*Gira sobre os calcanhares e se funde com as sombras em um grand finale silencioso.*`,
];

interface JYPBanditSystemProps {
  currentUser: User;
  onRobbery: (victimId: string, amount: number) => void;
}

export const JYPBanditSystem: React.FC<JYPBanditSystemProps> = ({
  currentUser,
  onRobbery,
}) => {
  const [isActive, setIsActive] = useState(false);
  
  // Usar ref para evitar stale closure
  const onRobberyRef = useRef(onRobbery);
  
  useEffect(() => {
    onRobberyRef.current = onRobbery;
  }, [onRobbery]);

  // Executa roubo
  const executeRobbery = async (
    victim: { id: string; name: string; money: number }, 
    targetLocation: string
  ) => {
    const stolenAmount = Math.floor(Math.random() * 191) + 10; // 10 a 200
    const actualStolen = Math.min(stolenAmount, victim.money);
    
    if (actualStolen <= 0) {
      console.log('[JYP] Vítima sem dinheiro suficiente');
      return false;
    }
    
    // Seleciona uma cena completa aleatória
    const sceneGenerator = JYP_COMPLETE_SCENES[Math.floor(Math.random() * JYP_COMPLETE_SCENES.length)];
    const sceneText = sceneGenerator(victim.name, actualStolen);
    
    console.log(`[JYP] Roubando ${actualStolen} MKC de ${victim.name} em ${targetLocation}`);
    
    // Salvar mensagem do JYP no chat do local escolhido (usa UUID de sistema)
    await supabaseService.sendChatMessage(
      JYP_SYSTEM_UUID,
      targetLocation,
      sceneText,
      'JYP',
      JYP_AVATAR,
      null
    );
    
    // Registra o roubo no banco
    await supabaseService.recordJYPAppearance(
      targetLocation,
      null,
      victim.id,
      victim.name,
      actualStolen,
      sceneText
    );
    
    // Aplica a perda de dinheiro
    onRobberyRef.current(victim.id, actualStolen);
    
    console.log(`[JYP] Roubo concluído! ${victim.name} perdeu ${actualStolen} MKC em ${targetLocation}`);
    return true;
  };

  // Dispara o roubo do JYP
  const triggerJYPRobbery = useCallback(async () => {
    setIsActive(true);
    
    console.log('[JYP] Buscando usuários ativos na praia/pousada...');
    
    // Busca usuários que estavam ativamente conversando nos últimos 60 minutos
    const activeUsers = await supabaseService.getActiveChattingUsers(60);
    
    if (!activeUsers || activeUsers.length === 0) {
      console.log('[JYP] Nenhum usuário ativo no chat encontrado');
      setIsActive(false);
      return;
    }
    
    console.log(`[JYP] Encontrados ${activeUsers.length} usuários ativos:`, activeUsers.map(u => u.full_name));
    
    // Filtra apenas quem tem dinheiro suficiente
    const possibleVictims = activeUsers.filter(u => (u.money || 0) > 10);
    if (possibleVictims.length === 0) {
      console.log('[JYP] Nenhuma vítima com dinheiro suficiente encontrada');
      setIsActive(false);
      return;
    }
    
    // Seleciona uma vítima aleatória
    const victim = possibleVictims[Math.floor(Math.random() * possibleVictims.length)];
    
    // Escolhe local aleatório (praia ou pousada)
    const robberyLocation = JYP_LOCATIONS[Math.floor(Math.random() * JYP_LOCATIONS.length)];
    
    await executeRobbery(
      { id: victim.user_id, name: victim.full_name, money: victim.money || 0 },
      robberyLocation
    );
    
    setIsActive(false);
  }, []);

  // Verifica se JYP deve aparecer
  const checkJYPAppearance = useCallback(async () => {
    if (isActive) {
      console.log('[JYP] Check: já está ativo, ignorando');
      return;
    }
    
    console.log('[JYP] Check: tentando adquirir lock atômico...');
    
    // Tenta adquirir lock atômico no banco (cooldown de 70 horas entre roubos)
    try {
      const canRob = await supabaseService.tryTriggerJYPRobbery(JYP_COOLDOWN_MS);
      if (canRob) {
        console.log('[JYP] Lock adquirido! Executando roubo...');
        triggerJYPRobbery();
      } else {
        console.log('[JYP] Check: ainda em cooldown de 70 horas');
      }
    } catch (e) {
      console.error("[JYP] Erro ao verificar JYP:", e);
    }
  }, [isActive, triggerJYPRobbery]);

  useEffect(() => {
    console.log('[JYP] Sistema global iniciado');
    
    // Verifica a cada 5 minutos se JYP deve aparecer
    const interval = setInterval(checkJYPAppearance, 5 * 60 * 1000);
    
    // Também verifica imediatamente ao montar (após 10 segundos)
    const timeout = setTimeout(checkJYPAppearance, 10000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [checkJYPAppearance]);

  return null;
};

export default JYPBanditSystem;
