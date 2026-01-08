import { useState, useEffect } from 'react';
import { supabase } from '@/src/integrations/supabase/client';
import type { 
  PharmacyOrder, 
  PregnancyTest, 
  Pregnancy, 
  ScratchCard,
  ContraceptiveEffect,
  ScratchSlot
} from '@/src/types/pharmacy';
import { 
  SCRATCH_SYMBOLS, 
  SCRATCH_PRIZES,
  PREGNANCY_MIN_DAYS,
  PREGNANCY_MAX_DAYS
} from '@/src/types/pharmacy';

export function usePharmacy(userId: string | undefined) {
  const [orders, setOrders] = useState<PharmacyOrder[]>([]);
  const [pregnancyTests, setPregnancyTests] = useState<PregnancyTest[]>([]);
  const [pregnancy, setPregnancy] = useState<Pregnancy | null>(null);
  const [contraceptive, setContraceptive] = useState<ContraceptiveEffect | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchUserData();
      subscribeToOrders();
    }
  }, [userId]);

  const fetchUserData = async () => {
    if (!userId) return;

    setLoading(true);

    // Fetch pregnancy tests (not expired)
    const { data: tests } = await supabase
      .from('pregnancy_tests')
      .select('*')
      .eq('user_id', userId)
      .gte('expires_at', new Date().toISOString())
      .order('used_at', { ascending: false });

    // Fetch active pregnancy
    const { data: pregnancyData } = await supabase
      .from('pregnancies')
      .select('*')
      .eq('user_id', userId)
      .eq('delivered', false)
      .maybeSingle();

    // Fetch active contraceptive
    const { data: contraceptiveData } = await supabase
      .from('contraceptive_effects')
      .select('*')
      .eq('user_id', userId)
      .gte('expires_at', new Date().toISOString())
      .maybeSingle();

    // Fetch user orders
    const { data: ordersData } = await supabase
      .from('pharmacy_orders')
      .select('*')
      .eq('customer_id', userId)
      .order('created_at', { ascending: false });

    setPregnancyTests((tests || []) as PregnancyTest[]);
    setPregnancy(pregnancyData as Pregnancy | null);
    setContraceptive(contraceptiveData as ContraceptiveEffect | null);
    setOrders((ordersData || []) as PharmacyOrder[]);
    setLoading(false);
  };

  const subscribeToOrders = () => {
    if (!userId) return;

    const channel = supabase
      .channel('pharmacy-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pharmacy_orders',
          filter: `customer_id=eq.${userId}`,
        },
        () => {
          fetchUserData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const createOrder = async (
    customerId: string,
    customerName: string,
    itemType: string,
    itemName: string,
    itemPrice: number
  ) => {
    const { data, error } = await supabase
      .from('pharmacy_orders')
      .insert({
        customer_id: customerId,
        customer_name: customerName,
        item_type: itemType,
        item_name: itemName,
        item_price: itemPrice,
      })
      .select()
      .single();

    if (!error) {
      setOrders(prev => [data as PharmacyOrder, ...prev]);
    }

    return { data, error };
  };

  const usePregnancyTest = async (hasContraceptive: boolean) => {
    if (!userId) return { success: false };

    // Calculate result - if has contraceptive, always negative
    // Otherwise random with 30% chance positive
    const isPositive = hasContraceptive ? false : Math.random() < 0.3;
    const result = isPositive ? 'positive' : 'negative';

    const { data, error } = await supabase
      .from('pregnancy_tests')
      .insert({
        user_id: userId,
        result,
        expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
      })
      .select()
      .single();

    if (!error && data) {
      setPregnancyTests(prev => [data as PregnancyTest, ...prev]);

      // If positive, create pregnancy
      if (isPositive) {
        const pregnancyDays = Math.floor(
          Math.random() * (PREGNANCY_MAX_DAYS - PREGNANCY_MIN_DAYS + 1) + PREGNANCY_MIN_DAYS
        );
        const endsAt = new Date(Date.now() + pregnancyDays * 24 * 60 * 60 * 1000);
        const babyGender = Math.random() < 0.5 ? 'male' : 'female';

        const { data: pregnancyData } = await supabase
          .from('pregnancies')
          .insert({
            user_id: userId,
            ends_at: endsAt.toISOString(),
            baby_gender: babyGender,
            created_from_test_id: data.id,
          })
          .select()
          .single();

        if (pregnancyData) {
          setPregnancy(pregnancyData as Pregnancy);
        }
      }
    }

    return { success: !error, result };
  };

  const announcePregnancy = async (testId: string) => {
    if (!pregnancy) return { success: false };

    const { error } = await supabase
      .from('pregnancies')
      .update({ announced: true })
      .eq('id', pregnancy.id);

    if (!error) {
      setPregnancy(prev => prev ? { ...prev, announced: true } : null);
      
      // Also mark the test as announced
      await supabase
        .from('pregnancy_tests')
        .update({ announced: true })
        .eq('id', testId);
    }

    return { success: !error };
  };

  const useContraceptive = async (durationDays: number) => {
    if (!userId) return { success: false };

    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    // Upsert contraceptive effect
    const { data, error } = await supabase
      .from('contraceptive_effects')
      .upsert({
        user_id: userId,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (!error && data) {
      setContraceptive(data as ContraceptiveEffect);
    }

    return { success: !error };
  };

  const scratchCard = async (): Promise<{ 
    success: boolean; 
    slots: ScratchSlot[]; 
    won: boolean; 
    prizeType: 'money' | 'food_voucher' | 'nothing' | null;
    prizeAmount: number;
  }> => {
    if (!userId) return { success: false, slots: [], won: false, prizeType: null, prizeAmount: 0 };

    // Generate 3 random slots with weighted probabilities
    // Make it very hard to win - 2% chance of matching
    const generateSlots = (): ScratchSlot[] => {
      const willWin = Math.random() < 0.02; // 2% chance to win
      
      if (willWin) {
        const winningSymbol = SCRATCH_SYMBOLS[Math.floor(Math.random() * SCRATCH_SYMBOLS.length)];
        return [
          { symbol: winningSymbol, revealed: false },
          { symbol: winningSymbol, revealed: false },
          { symbol: winningSymbol, revealed: false },
        ];
      }

      // Generate non-matching slots
      const slots: ScratchSlot[] = [];
      const usedSymbols: string[] = [];
      
      for (let i = 0; i < 3; i++) {
        let symbol: string;
        do {
          symbol = SCRATCH_SYMBOLS[Math.floor(Math.random() * SCRATCH_SYMBOLS.length)];
        } while (usedSymbols.length < 2 && usedSymbols.includes(symbol));
        
        usedSymbols.push(symbol);
        slots.push({ symbol, revealed: false });
      }

      // Make sure they don't all match accidentally
      if (slots[0].symbol === slots[1].symbol && slots[1].symbol === slots[2].symbol) {
        slots[2].symbol = SCRATCH_SYMBOLS.find(s => s !== slots[0].symbol) || '🎯';
      }

      return slots;
    };

    const slots = generateSlots();
    const allMatch = slots[0].symbol === slots[1].symbol && slots[1].symbol === slots[2].symbol;
    
    let prizeType: 'money' | 'food_voucher' | 'nothing' | null = null;
    let prizeAmount = 0;

    if (allMatch) {
      const key = `${slots[0].symbol}${slots[1].symbol}${slots[2].symbol}` as keyof typeof SCRATCH_PRIZES;
      const prize = SCRATCH_PRIZES[key];
      if (prize) {
        prizeType = prize.type;
        prizeAmount = prize.amount;
      }
    }

    // Save to database
    const { error } = await supabase
      .from('scratch_cards')
      .insert({
        user_id: userId,
        slots: JSON.parse(JSON.stringify(slots)),
        prize_type: prizeType || 'nothing',
        prize_amount: prizeAmount,
        won: allMatch && prizeType !== null,
      } as any);

    return {
      success: !error,
      slots,
      won: allMatch && prizeType !== null,
      prizeType,
      prizeAmount,
    };
  };

  return {
    orders,
    pregnancyTests,
    pregnancy,
    contraceptive,
    loading,
    createOrder,
    usePregnancyTest,
    announcePregnancy,
    useContraceptive,
    scratchCard,
    refreshData: fetchUserData,
    hasActiveContraceptive: contraceptive !== null && new Date(contraceptive.expires_at) > new Date(),
  };
}
