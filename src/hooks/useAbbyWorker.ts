// Hook que gerencia ABBY - a IA trabalhadora dos estabelecimentos
// Processa pedidos automaticamente sem necessidade de gerente

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../supabase';
import { abbyService } from '../services/abbyService';
import { FoodOrder, OrderItem } from '../../types';

interface ProcessingOrder {
  orderId: string;
  customerName: string;
  customerId: string;
  items: OrderItem[];
  location: string;
  preparationTime: number; // em minutos
  startedAt: number;
  progressMessagesSent: number;
}

export function useAbbyWorker() {
  const processingOrdersRef = useRef<Map<string, ProcessingOrder>>(new Map());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Processa a entrega final do pedido
  const deliverOrder = useCallback(async (order: ProcessingOrder) => {
    try {
      console.log('[ABBY] Entregando pedido:', order.orderId);
      
      // Buscar dados atuais do cliente
      const { data: customerProfile, error: profileError } = await supabase
        .from('profiles')
        .select('money')
        .eq('user_id', order.customerId)
        .single();

      if (profileError || !customerProfile) {
        console.error('[ABBY] Erro ao buscar perfil do cliente:', profileError);
        return;
      }

      // Verificar saldo
      const totalPrice = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      if (customerProfile.money < totalPrice) {
        console.error('[ABBY] Cliente sem saldo suficiente');
        // Cancelar pedido
        await supabase.from('food_orders').update({ status: 'cancelled' }).eq('id', order.orderId);
        await abbyService.sendMessage(
          order.location, 
          `*olha triste para o pedido de **${order.customerName}*** Ops... parece que houve um problema com o pagamento...`
        );
        return;
      }

      // Descontar dinheiro
      const { error: moneyError } = await supabase
        .from('profiles')
        .update({ money: customerProfile.money - totalPrice })
        .eq('user_id', order.customerId);

      if (moneyError) {
        console.error('[ABBY] Erro ao descontar dinheiro:', moneyError);
        return;
      }

      // Adicionar itens ao inventário
      for (const item of order.items) {
        const { data: existing } = await supabase
          .from('inventory')
          .select('id, quantity')
          .eq('user_id', order.customerId)
          .eq('item_id', item.id)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('inventory')
            .update({ quantity: (existing.quantity || 1) + item.quantity })
            .eq('id', existing.id);
        } else {
          await supabase.from('inventory').insert([{
            user_id: order.customerId,
            item_id: item.id,
            item_name: item.name,
            item_image: item.image,
            category: 'Comida',
            quantity: item.quantity,
            attributes: {
              hunger: item.hungerRestore,
              thirst: item.thirstRestore,
              alcohol: item.alcoholLevel
            }
          }]);
        }
      }

      // Marcar pedido como entregue
      await supabase
        .from('food_orders')
        .update({ 
          status: 'delivered',
          ready_at: new Date().toISOString()
        })
        .eq('id', order.orderId);

      // Enviar mensagem de entrega
      const itemNames = order.items.map(i => i.name);
      await abbyService.completeDelivery(order.orderId, order.customerName, itemNames, order.location);

      console.log('[ABBY] Pedido entregue com sucesso:', order.orderId);
    } catch (error) {
      console.error('[ABBY] Erro ao entregar pedido:', error);
    }
  }, []);

  // Verifica pedidos em processamento
  const checkProcessingOrders = useCallback(() => {
    const now = Date.now();
    
    processingOrdersRef.current.forEach(async (order, orderId) => {
      const elapsedMs = now - order.startedAt;
      const prepTimeMs = order.preparationTime * 60 * 1000;
      
      // Enviar mensagens de progresso a cada 1/3 do tempo
      const progressInterval = prepTimeMs / 3;
      const expectedProgress = Math.floor(elapsedMs / progressInterval);
      
      if (expectedProgress > order.progressMessagesSent && expectedProgress < 3) {
        order.progressMessagesSent = expectedProgress;
        processingOrdersRef.current.set(orderId, order);
        await abbyService.sendProgressMessage(order.location);
      }
      
      // Verificar se o tempo de preparação acabou
      if (elapsedMs >= prepTimeMs) {
        processingOrdersRef.current.delete(orderId);
        await deliverOrder(order);
      }
    });
  }, [deliverOrder]);

  // Inicia o processamento de um novo pedido
  const processOrder = useCallback(async (order: FoodOrder) => {
    // Ignorar se já está processando
    if (processingOrdersRef.current.has(order.id)) return;
    
    const items = order.items as OrderItem[];
    const itemNames = items.map(i => i.name);
    
    // Criar registro de processamento
    const processingOrder: ProcessingOrder = {
      orderId: order.id,
      customerName: order.customer_name,
      customerId: order.customer_id,
      items,
      location: order.location,
      preparationTime: order.preparation_time,
      startedAt: Date.now(),
      progressMessagesSent: 0
    };
    
    processingOrdersRef.current.set(order.id, processingOrder);
    
    // Atualizar status para preparing
    await supabase
      .from('food_orders')
      .update({ 
        status: 'preparing', 
        approved_at: new Date().toISOString(),
        approved_by: 'abby-worker'
      })
      .eq('id', order.id);
    
    // Enviar mensagem de início
    await abbyService.startPreparation(order.id, order.customer_name, itemNames, order.location);
    
    console.log('[ABBY] Iniciando preparo:', order.id, 'tempo:', order.preparation_time, 'min');
  }, []);

  // Carrega pedidos pendentes ao iniciar
  const loadPendingOrders = useCallback(async () => {
    try {
      // Buscar pedidos pendentes em restaurante e padaria
      const { data: orders } = await supabase
        .from('food_orders')
        .select('*')
        .in('location', ['restaurante', 'padaria'])
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (orders && orders.length > 0) {
        console.log('[ABBY] Encontrados', orders.length, 'pedidos pendentes');
        for (const order of orders) {
          await processOrder(order as FoodOrder);
        }
      }

      // Também verificar pedidos em preparo que podem ter sido interrompidos
      const { data: preparingOrders } = await supabase
        .from('food_orders')
        .select('*')
        .in('location', ['restaurante', 'padaria'])
        .eq('status', 'preparing')
        .order('created_at', { ascending: true });

      if (preparingOrders && preparingOrders.length > 0) {
        console.log('[ABBY] Retomando', preparingOrders.length, 'pedidos em preparo');
        for (const order of preparingOrders) {
          const items = order.items as OrderItem[];
          
          // Calcular tempo restante baseado no approved_at
          const approvedAt = order.approved_at ? new Date(order.approved_at).getTime() : Date.now();
          const prepTimeMs = order.preparation_time * 60 * 1000;
          const elapsed = Date.now() - approvedAt;
          
          if (elapsed >= prepTimeMs) {
            // Já deveria ter sido entregue - entregar agora
            const processingOrder: ProcessingOrder = {
              orderId: order.id,
              customerName: order.customer_name,
              customerId: order.customer_id,
              items,
              location: order.location,
              preparationTime: order.preparation_time,
              startedAt: approvedAt,
              progressMessagesSent: 3
            };
            await deliverOrder(processingOrder);
          } else {
            // Ainda em preparo - retomar
            const processingOrder: ProcessingOrder = {
              orderId: order.id,
              customerName: order.customer_name,
              customerId: order.customer_id,
              items,
              location: order.location,
              preparationTime: order.preparation_time,
              startedAt: approvedAt,
              progressMessagesSent: Math.floor(elapsed / (prepTimeMs / 3))
            };
            processingOrdersRef.current.set(order.id, processingOrder);
          }
        }
      }
    } catch (error) {
      console.error('[ABBY] Erro ao carregar pedidos:', error);
    }
  }, [processOrder, deliverOrder]);

  useEffect(() => {
    console.log('[ABBY] Iniciando sistema...');
    
    // Carregar pedidos existentes
    loadPendingOrders();
    
    // Iniciar intervalo de verificação
    intervalRef.current = setInterval(checkProcessingOrders, 5000); // Verificar a cada 5 segundos
    
    // Subscrever para novos pedidos
    const channel = supabase
      .channel('abby-food-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'food_orders'
        },
        async (payload) => {
          const order = payload.new as FoodOrder;
          console.log('[ABBY] Novo pedido detectado:', order.id);
          
          // Verificar se é restaurante ou padaria
          if (order.location === 'restaurante' || order.location === 'padaria') {
            if (order.status === 'pending') {
              await processOrder(order);
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('[ABBY] Encerrando sistema...');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [loadPendingOrders, checkProcessingOrders, processOrder]);

  return {
    processingCount: processingOrdersRef.current.size
  };
}
