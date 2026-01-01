"use client";

import React, { useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase';
import { supabaseService } from '../services/supabaseService';
import { ChatMessage, User, OrderItem } from '../types';
import abbyAvatar from '../src/assets/abby-avatar.jpg';

// Avatar da ABBY - IA funcionária dos estabelecimentos
const ABBY_AVATAR = abbyAvatar;

const ABBY_USER: User = {
  id: 'abby-ai',
  name: 'ABBY',
  username: 'abby',
  avatar: ABBY_AVATAR,
  race: 'draeven'
};

// Frases de preparação de comida
const COOKING_PHRASES = [
  "liga o fogão e começa a preparar com carinho",
  "coloca os ingredientes frescos na bancada",
  "mexe a panela com dedicação",
  "verifica a temperatura com atenção",
  "adiciona os temperos secretos da casa",
  "prepara tudo com muito amor",
  "organiza os pratos com cuidado",
  "finaliza a receita com maestria"
];

// Frases de entrega
const DELIVERY_PHRASES = [
  "leva o pedido até a mesa com um sorriso",
  "entrega o pedido quentinho para",
  "coloca o pedido na mesa de",
  "chega com o pedido perfeito para",
  "apresenta o pedido com orgulho para"
];

interface AbbyAISystemProps {
  locationContext: string;
  currentUser: User;
  onAbbyMessage?: (msg: ChatMessage) => void;
}

export const AbbyAISystem: React.FC<AbbyAISystemProps> = ({ 
  locationContext, 
  currentUser,
  onAbbyMessage 
}) => {
  const processingOrdersRef = useRef<Set<string>>(new Set());
  const lastCheckRef = useRef<number>(0);

  const getRandomPhrase = (phrases: string[]) => {
    return phrases[Math.floor(Math.random() * phrases.length)];
  };

  const sendAbbyMessage = useCallback(async (content: string) => {
    try {
      // Persistir no chat para não sumir ao sair/entrar novamente
      await supabaseService.sendChatMessage(
        currentUser.id,
        locationContext,
        content,
        ABBY_USER.name,
        ABBY_USER.avatar,
        undefined
      );

      // Também notifica localmente quem está com o chat aberto (UI imediata)
      if (onAbbyMessage) {
        const abbyMsg: ChatMessage = {
          id: `abby-${Date.now()}`,
          role: 'model',
          text: content,
          author: ABBY_USER
        };
        onAbbyMessage(abbyMsg);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem da ABBY:', error);
    }
  }, [currentUser.id, locationContext, onAbbyMessage]);

  const processPendingOrder = useCallback(async (order: any) => {
    const orderId = order.id;
    
    // Verificar se já está processando este pedido
    if (processingOrdersRef.current.has(orderId)) {
      return;
    }

    processingOrdersRef.current.add(orderId);

    try {
      const items = order.items as OrderItem[];
      const itemNames = items.map(i => `${i.quantity}x ${i.name}`).join(', ');
      const customerName = order.customer_name;
      const prepTime = order.preparation_time;

      // 1. Mensagem de início do preparo
      const startPhrase = getRandomPhrase(COOKING_PHRASES);
      await sendAbbyMessage(`*${startPhrase}* — Preparando pedido para ${customerName}: ${itemNames}`);

      // 2. Aprovar o pedido no banco (mudar status para 'preparing')
      // e registrar o horário estimado de conclusão baseado no tempo de preparo (minutos reais)
      const approvedAtIso = new Date().toISOString();
      const readyAtIso = new Date(Date.now() + prepTime * 60 * 1000).toISOString();

      const { error: approveError } = await supabase
        .from('food_orders')
        .update({
          status: 'preparing',
          approved_by: currentUser.id,
          approved_at: approvedAtIso,
          ready_at: readyAtIso
        })
        .eq('id', orderId);

      if (approveError) {
        throw approveError;
      }

      // A entrega (completeFoodOrder + mensagem) acontece quando o tempo de preparo terminar
      // via deliverPreparingOrder() nas próximas verificações.

    } catch (error: any) {
      console.error('Erro ao processar pedido:', error);
      
      // Em caso de erro, tentar cancelar o pedido
      try {
        await supabase
          .from('food_orders')
          .update({ status: 'cancelled' })
          .eq('id', orderId);
        
        await sendAbbyMessage(`*olha preocupada* — Desculpe ${order.customer_name}, houve um problema com seu pedido. Por favor, tente novamente!`);
      } catch (cancelError) {
        console.error('Erro ao cancelar pedido:', cancelError);
      }
    } finally {
      processingOrdersRef.current.delete(orderId);
    }
  }, [sendAbbyMessage]);

  // Processar pedido que já está em preparing (entrega quando o tempo terminar)
  const deliverPreparingOrder = useCallback(async (order: any) => {
    const orderId = order.id;

    // Verificar se já está processando este pedido
    if (processingOrdersRef.current.has(orderId)) {
      return;
    }

    processingOrdersRef.current.add(orderId);

    try {
      const items = order.items as OrderItem[];
      const itemNames = items.map(i => `${i.quantity}x ${i.name}`).join(', ');
      const customerName = order.customer_name;

      // Respeitar o tempo de preparo REAL (minutos)
      // Preferir ready_at; se não existir, calcular via approved_at/created_at + preparation_time.
      const prepTimeMs = (order.preparation_time || 0) * 60 * 1000;
      const baseTime = order.approved_at || order.created_at;
      const readyAtMs = order.ready_at
        ? new Date(order.ready_at).getTime()
        : new Date(baseTime).getTime() + prepTimeMs;

      if (Date.now() < readyAtMs) {
        return; // ainda está preparando
      }

      // Completar o pedido (adicionar ao inventário e descontar dinheiro)
      await supabaseService.completeFoodOrder(orderId);

      // Mensagem de entrega
      const deliveryPhrase = getRandomPhrase(DELIVERY_PHRASES);
      await sendAbbyMessage(`*${deliveryPhrase} ${customerName}!* — Seu pedido está pronto: ${itemNames}. Bom apetite! 🍽️`);

    } catch (error: any) {
      console.error('Erro ao entregar pedido:', error);
      await sendAbbyMessage(`*olha preocupada* — Desculpe ${order.customer_name}, houve um problema com a entrega. Por favor, chame um funcionário!`);
    } finally {
      processingOrdersRef.current.delete(orderId);
    }
  }, [sendAbbyMessage]);

  const checkForOrders = useCallback(async () => {
    // Evitar verificações muito frequentes
    const now = Date.now();
    if (now - lastCheckRef.current < 5000) {
      return;
    }
    lastCheckRef.current = now;

    try {
      // Buscar pedidos pendentes E em preparo para este local
      const { data: orders, error } = await supabase
        .from('food_orders')
        .select('*')
        .eq('location', locationContext)
        .in('status', ['pending', 'preparing'])
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erro ao buscar pedidos:', error);
        return;
      }

      // Processar cada pedido
      for (const order of (orders || [])) {
        if (!processingOrdersRef.current.has(order.id)) {
          // Processar com pequeno delay entre pedidos
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          if (order.status === 'pending') {
            processPendingOrder(order);
          } else if (order.status === 'preparing') {
            deliverPreparingOrder(order);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao verificar pedidos:', error);
    }
  }, [locationContext, processPendingOrder, deliverPreparingOrder]);

  // Verificar pedidos periodicamente
  useEffect(() => {
    // Só ativar ABBY em locais de comida
    if (locationContext !== 'restaurante' && locationContext !== 'padaria') {
      return;
    }

    // Verificar pedidos imediatamente ao entrar
    checkForOrders();

    // Configurar verificação periódica
    const interval = setInterval(checkForOrders, 10000); // A cada 10 segundos

    // Subscrever a novos pedidos em tempo real
    const channel = supabase
      .channel(`abby-orders-${locationContext}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'food_orders',
          filter: `location=eq.${locationContext}`
        },
        (payload) => {
          console.log('Novo pedido detectado:', payload.new);
          // Aguardar um pouco antes de processar para dar tempo de exibir a mensagem do usuário
          setTimeout(() => {
            checkForOrders();
          }, 2000);
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [locationContext, checkForOrders]);

  // Este componente não renderiza nada visualmente
  return null;
};
