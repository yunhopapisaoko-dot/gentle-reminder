import { useState, useEffect } from 'react';
import { supabase } from '@/src/integrations/supabase/client';
import type { PharmacyOrder, BabyDelivery } from '@/src/types/pharmacy';

export function usePharmacyWorker(userId: string | undefined) {
  const [pendingOrders, setPendingOrders] = useState<PharmacyOrder[]>([]);
  const [pendingDeliveries, setPendingDeliveries] = useState<BabyDelivery[]>([]);
  const [isWorker, setIsWorker] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      checkWorkerStatus();
      fetchPendingOrders();
      subscribeToOrders();
    }
  }, [userId]);

  const checkWorkerStatus = async () => {
    if (!userId) return;

    const { data } = await supabase
      .from('establishment_workers')
      .select('*')
      .eq('user_id', userId)
      .eq('location', 'farmacia')
      .maybeSingle();

    setIsWorker(!!data);
  };

  const fetchPendingOrders = async () => {
    setLoading(true);

    // Fetch pending pharmacy orders
    const { data: orders } = await supabase
      .from('pharmacy_orders')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    // Fetch pending baby deliveries for hospital view
    const { data: deliveries } = await supabase
      .from('baby_deliveries')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    setPendingOrders((orders || []) as PharmacyOrder[]);
    setPendingDeliveries((deliveries || []) as BabyDelivery[]);
    setLoading(false);
  };

  const subscribeToOrders = () => {
    const channel = supabase
      .channel('pharmacy-worker-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pharmacy_orders',
        },
        () => {
          fetchPendingOrders();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'baby_deliveries',
        },
        () => {
          fetchPendingOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const approveOrder = async (orderId: string) => {
    if (!userId) return { success: false };

    const { error } = await supabase
      .from('pharmacy_orders')
      .update({
        status: 'approved',
        approved_by: userId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (!error) {
      setPendingOrders(prev => prev.filter(o => o.id !== orderId));
    }

    return { success: !error };
  };

  const deliverOrder = async (orderId: string) => {
    if (!userId) return { success: false };

    const { error } = await supabase
      .from('pharmacy_orders')
      .update({ status: 'delivered' })
      .eq('id', orderId);

    return { success: !error };
  };

  const cancelOrder = async (orderId: string) => {
    const { error } = await supabase
      .from('pharmacy_orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId);

    if (!error) {
      setPendingOrders(prev => prev.filter(o => o.id !== orderId));
    }

    return { success: !error };
  };

  const processBabyDelivery = async (deliveryId: string) => {
    if (!userId) return { success: false };

    const { error } = await supabase
      .from('baby_deliveries')
      .update({
        status: 'processed',
        processed_by: userId,
        processed_at: new Date().toISOString(),
      })
      .eq('id', deliveryId);

    if (!error) {
      setPendingDeliveries(prev => prev.filter(d => d.id !== deliveryId));
    }

    return { success: !error };
  };

  return {
    pendingOrders,
    pendingDeliveries,
    isWorker,
    loading,
    approveOrder,
    deliverOrder,
    cancelOrder,
    processBabyDelivery,
    refreshOrders: fetchPendingOrders,
  };
}
