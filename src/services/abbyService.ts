// ABBY - IA que trabalha nos estabelecimentos
// Prepara pedidos e entrega automaticamente aos clientes

import { supabase } from '../../supabase';
import abbyAvatar from '@/assets/abby-avatar.jpg';

export const ABBY_CONFIG = {
  id: 'abby-worker',
  name: 'ABBY',
  avatar: abbyAvatar,
  preparationMessages: [
    "*coloca o avental e ajusta a bandana* Hora de trabalhar!",
    "*lava as mãos cuidadosamente* Higiene em primeiro lugar~",
    "*separa os ingredientes na bancada* Vamos lá!",
    "*acende o fogão com um sorriso* Preparando com carinho!",
    "*dança enquanto cozinha* Lalala~",
    "*verifica a temperatura* Perfeito!",
    "*mistura os ingredientes com maestria* Quase lá...",
    "*adiciona um toque especial* O segredo é o amor!",
  ],
  deliveryMessages: [
    "*entrega o pedido com um sorriso radiante* Aqui está, feito com carinho!",
    "*coloca o pedido na mesa* Bom apetite! ♡",
    "*faz uma reverência* Seu pedido está pronto, espero que goste!",
    "*ajusta o guardanapo ao lado do prato* Aproveite!",
    "*pisca* Feito especialmente pra você!",
    "*ajeita os pratos* Tudo certinho, pode saborear!",
  ]
};

function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

// Envia mensagem no chat como ABBY
async function sendAbbyMessage(location: string, content: string, subLocation?: string): Promise<void> {
  try {
    const { error } = await supabase.from('chat_messages').insert([{
      user_id: ABBY_CONFIG.id,
      location,
      sub_location: subLocation,
      content,
      character_name: ABBY_CONFIG.name,
      character_avatar: ABBY_CONFIG.avatar
    }]);
    
    if (error) {
      console.error('[ABBY] Erro ao enviar mensagem:', error);
    }
  } catch (e) {
    console.error('[ABBY] Erro ao enviar mensagem:', e);
  }
}

// Inicia a preparação de um pedido
export async function startPreparation(
  orderId: string, 
  customerName: string, 
  itemNames: string[], 
  location: string
): Promise<void> {
  const itemList = itemNames.join(', ');
  
  // Mensagem de início
  const startMessage = `*olha o pedido de **${customerName}**: ${itemList}* ${getRandomMessage(ABBY_CONFIG.preparationMessages)}`;
  await sendAbbyMessage(location, startMessage);
}

// Envia mensagem de progresso
export async function sendProgressMessage(location: string): Promise<void> {
  await sendAbbyMessage(location, getRandomMessage(ABBY_CONFIG.preparationMessages));
}

// Completa a entrega
export async function completeDelivery(
  orderId: string,
  customerName: string,
  itemNames: string[],
  location: string
): Promise<void> {
  const itemList = itemNames.join(', ');
  
  const deliveryMessage = `*finaliza o(s) ${itemList} e leva até **${customerName}*** ${getRandomMessage(ABBY_CONFIG.deliveryMessages)}`;
  await sendAbbyMessage(location, deliveryMessage);
}

export const abbyService = {
  sendMessage: sendAbbyMessage,
  startPreparation,
  sendProgressMessage,
  completeDelivery,
  config: ABBY_CONFIG
};
