"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { supabaseService } from '../services/supabaseService';
import { User } from '../types';
import { PHARMACY_ITEMS } from '../src/types/pharmacy';

interface PharmacyViewProps {
  onClose: () => void;
  currentUser: User;
  onUpdateMoney?: (amount: number) => void;
}

interface PregnancyTest {
  id: string;
  result: 'positive' | 'negative';
  used_at: string;
  expires_at: string;
  announced: boolean;
}

interface Pregnancy {
  id: string;
  user_id: string;
  started_at: string;
  ends_at: string;
  baby_gender: 'male' | 'female';
  announced: boolean;
  delivered: boolean;
}

interface ScratchSlot {
  symbol: string;
  revealed: boolean;
}

const SCRATCH_SYMBOLS = ['💰', '🎁', '⭐', '🍀', '💎', '🎯'];

const SCRATCH_PRIZES: Record<string, { type: 'money' | 'food_voucher'; amount: number; label: string }> = {
  '💰💰💰': { type: 'money', amount: 5000, label: '₭5.000' },
  '💎💎💎': { type: 'money', amount: 3000, label: '₭3.000' },
  '⭐⭐⭐': { type: 'money', amount: 1000, label: '₭1.000' },
  '🍀🍀🍀': { type: 'food_voucher', amount: 500, label: 'Vale ₭500' },
  '🎁🎁🎁': { type: 'food_voucher', amount: 300, label: 'Vale ₭300' },
  '🎯🎯🎯': { type: 'food_voucher', amount: 200, label: 'Vale ₭200' },
};

export const PharmacyView: React.FC<PharmacyViewProps> = ({ onClose, currentUser, onUpdateMoney }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [processingItem, setProcessingItem] = useState<string | null>(null);
  const [pregnancy, setPregnancy] = useState<Pregnancy | null>(null);
  const [pregnancyTests, setPregnancyTests] = useState<PregnancyTest[]>([]);
  const [contraceptiveExpires, setContraceptiveExpires] = useState<Date | null>(null);
  const [showScratchGame, setShowScratchGame] = useState(false);
  const [scratchSlots, setScratchSlots] = useState<ScratchSlot[]>([]);
  const [scratchResult, setScratchResult] = useState<{ won: boolean; prizeType: string | null; prizeAmount: number } | null>(null);
  const [showTestResult, setShowTestResult] = useState<{ result: 'positive' | 'negative'; testId: string } | null>(null);
  const [userMoney, setUserMoney] = useState(currentUser.money || 0);

  const isLunari = currentUser.race === 'lunari';

  useEffect(() => {
    fetchUserPharmacyData();
  }, [currentUser.id]);

  const fetchUserPharmacyData = async () => {
    try {
      // Fetch pregnancy
      const { data: pregnancyData } = await supabase
        .from('pregnancies')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('delivered', false)
        .maybeSingle();
      
      setPregnancy(pregnancyData as Pregnancy | null);

      // Check if pregnancy ended
      if (pregnancyData && new Date(pregnancyData.ends_at) <= new Date() && !pregnancyData.delivered) {
        // Create baby delivery for hospital
        await supabase.from('baby_deliveries').insert({
          mother_id: currentUser.id,
          mother_name: currentUser.name,
          baby_gender: pregnancyData.baby_gender,
          pregnancy_id: pregnancyData.id
        });
        
        // Mark pregnancy as delivered
        await supabase.from('pregnancies').update({ delivered: true }).eq('id', pregnancyData.id);
        setPregnancy(null);
      }

      // Fetch pregnancy tests
      const { data: tests } = await supabase
        .from('pregnancy_tests')
        .select('*')
        .eq('user_id', currentUser.id)
        .gte('expires_at', new Date().toISOString())
        .order('used_at', { ascending: false });
      
      setPregnancyTests((tests || []) as PregnancyTest[]);

      // Fetch contraceptive
      const { data: contraceptive } = await supabase
        .from('contraceptive_effects')
        .select('*')
        .eq('user_id', currentUser.id)
        .gte('expires_at', new Date().toISOString())
        .maybeSingle();
      
      if (contraceptive) {
        setContraceptiveExpires(new Date(contraceptive.expires_at));
      }
    } catch (error) {
      console.error('Erro ao carregar dados da farmácia:', error);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 400);
  };

  const handlePurchase = async (itemId: string) => {
    const item = PHARMACY_ITEMS.find(i => i.id === itemId);
    if (!item) return;

    if (item.restrictedTo === 'lunari' && !isLunari) {
      alert('Apenas Lunari podem comprar este item!');
      return;
    }

    if (userMoney < item.price) {
      alert('Dinheiro insuficiente!');
      return;
    }

    setProcessingItem(itemId);

    try {
      const newBalance = userMoney - item.price;
      await supabaseService.updateMoney(currentUser.id, newBalance);
      setUserMoney(newBalance);
      if (onUpdateMoney) onUpdateMoney(-item.price);

      // Handle item usage based on type
      if (item.type === 'pregnancy_test') {
        await handlePregnancyTest();
      } else if (item.type === 'scratch_card') {
        setShowScratchGame(true);
        generateScratchCard();
      } else if (item.type === 'contraceptive' && item.duration) {
        await handleContraceptive(item.duration);
      } else if (item.type === 'medicine') {
        await handleMedicine(item.name);
      }
    } catch (error: any) {
      alert('Erro ao processar compra: ' + error.message);
    } finally {
      setProcessingItem(null);
    }
  };

  const handlePregnancyTest = async () => {
    // Check if has contraceptive
    const hasContraceptive = contraceptiveExpires && contraceptiveExpires > new Date();
    
    // 30% chance of positive, 0% if on contraceptive
    const isPositive = hasContraceptive ? false : Math.random() < 0.3;
    const result = isPositive ? 'positive' : 'negative';

    const { data: testData, error } = await supabase
      .from('pregnancy_tests')
      .insert({
        user_id: currentUser.id,
        result,
        expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // If positive, create pregnancy
    if (isPositive) {
      const pregnancyDays = Math.floor(Math.random() * 8) + 14; // 14-21 days (2-3 weeks)
      const endsAt = new Date(Date.now() + pregnancyDays * 24 * 60 * 60 * 1000);
      const babyGender = Math.random() < 0.5 ? 'male' : 'female';

      const { data: pregnancyData } = await supabase
        .from('pregnancies')
        .insert({
          user_id: currentUser.id,
          ends_at: endsAt.toISOString(),
          baby_gender: babyGender,
          created_from_test_id: testData.id,
        })
        .select()
        .single();

      if (pregnancyData) {
        setPregnancy(pregnancyData as Pregnancy);
      }
    }

    setShowTestResult({ result, testId: testData.id });
    setPregnancyTests(prev => [testData as PregnancyTest, ...prev]);
  };

  const handleAnnouncePregnancy = async (testId: string) => {
    if (!pregnancy) return;

    await supabase.from('pregnancies').update({ announced: true }).eq('id', pregnancy.id);
    await supabase.from('pregnancy_tests').update({ announced: true }).eq('id', testId);
    
    setPregnancy(prev => prev ? { ...prev, announced: true } : null);
    setShowTestResult(null);
  };

  const handleContraceptive = async (days: number) => {
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    
    await supabase.from('contraceptive_effects').upsert({
      user_id: currentUser.id,
      expires_at: expiresAt.toISOString(),
    });
    
    setContraceptiveExpires(expiresAt);
    alert(`Anticoncepcional ativo por ${days} dias!`);
  };

  const handleMedicine = async (medicineName: string) => {
    // Add medicine to inventory
    await supabase.from('inventory').insert({
      user_id: currentUser.id,
      item_id: `medicine_${Date.now()}`,
      item_name: medicineName,
      item_image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=200',
      category: 'Remédio',
    });
    
    alert(`${medicineName} adicionado ao inventário!`);
  };

  const generateScratchCard = () => {
    const willWin = Math.random() < 0.05; // 5% chance
    
    let slots: ScratchSlot[];
    if (willWin) {
      const winningSymbol = SCRATCH_SYMBOLS[Math.floor(Math.random() * SCRATCH_SYMBOLS.length)];
      slots = [
        { symbol: winningSymbol, revealed: false },
        { symbol: winningSymbol, revealed: false },
        { symbol: winningSymbol, revealed: false },
      ];
    } else {
      const usedSymbols: string[] = [];
      slots = [];
      for (let i = 0; i < 3; i++) {
        let symbol: string;
        do {
          symbol = SCRATCH_SYMBOLS[Math.floor(Math.random() * SCRATCH_SYMBOLS.length)];
        } while (usedSymbols.length < 2 && usedSymbols.includes(symbol));
        usedSymbols.push(symbol);
        slots.push({ symbol, revealed: false });
      }
      // Ensure they don't all match
      if (slots[0].symbol === slots[1].symbol && slots[1].symbol === slots[2].symbol) {
        slots[2].symbol = SCRATCH_SYMBOLS.find(s => s !== slots[0].symbol) || '🎯';
      }
    }
    
    setScratchSlots(slots);
    setScratchResult(null);
  };

  const handleRevealSlot = (index: number) => {
    setScratchSlots(prev => {
      const newSlots = [...prev];
      newSlots[index] = { ...newSlots[index], revealed: true };
      
      // Check if all revealed
      const allRevealed = newSlots.every(s => s.revealed);
      if (allRevealed) {
        const key = `${newSlots[0].symbol}${newSlots[1].symbol}${newSlots[2].symbol}`;
        const prize = SCRATCH_PRIZES[key];
        
        if (prize) {
          setScratchResult({ won: true, prizeType: prize.type, prizeAmount: prize.amount });
          
          // Apply prize
          if (prize.type === 'money') {
            const newBalance = userMoney + prize.amount;
            supabaseService.updateMoney(currentUser.id, newBalance);
            setUserMoney(newBalance);
            if (onUpdateMoney) onUpdateMoney(prize.amount);
          } else if (prize.type === 'food_voucher') {
            // Add to inventory
            supabase.from('inventory').insert({
              user_id: currentUser.id,
              item_id: `food_voucher_${Date.now()}`,
              item_name: `Vale Alimentação ₭${prize.amount}`,
              item_image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=200',
              category: 'Vale',
              attributes: { value: prize.amount }
            });
          }
          
          // Save scratch card result
          supabase.from('scratch_cards').insert({
            user_id: currentUser.id,
            slots: JSON.parse(JSON.stringify(newSlots)),
            prize_type: prize.type,
            prize_amount: prize.amount,
            won: true,
          });
        } else {
          setScratchResult({ won: false, prizeType: null, prizeAmount: 0 });
          supabase.from('scratch_cards').insert({
            user_id: currentUser.id,
            slots: JSON.parse(JSON.stringify(newSlots)),
            prize_type: 'nothing',
            prize_amount: 0,
            won: false,
          });
        }
      }
      
      return newSlots;
    });
  };

  const formatTimeRemaining = (endDate: Date) => {
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h`;
  };

  return (
    <div className={`fixed inset-0 z-[300] bg-background-dark/95 backdrop-blur-3xl flex flex-col h-[100dvh] overflow-hidden ${isClosing ? 'animate-out slide-out-bottom' : 'animate-in slide-in-bottom'}`}>
      {/* Header */}
      <div className="pt-16 px-8 pb-8 bg-emerald-500/10 border-b border-emerald-500/20 relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button onClick={handleClose} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all">
              <span className="material-symbols-rounded">arrow_back</span>
            </button>
            <div>
              <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Farmácia</h2>
              <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em] mt-1.5">Saúde & Bem-Estar</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 flex items-center space-x-2">
              <span className="material-symbols-rounded text-emerald-400">account_balance_wallet</span>
              <span className="text-white font-bold">₭{userMoney.toLocaleString()}</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <span className="material-symbols-rounded text-3xl">local_pharmacy</span>
            </div>
          </div>
        </div>
        
        {/* Pregnancy Tag */}
        {pregnancy?.announced && (
          <div className="pregnancy-tag mt-4">
            🤰 Gravidez - {pregnancy.baby_gender === 'male' ? '♂️ Menino' : '♀️ Menina'} 
            <span className="ml-2 opacity-70">({formatTimeRemaining(new Date(pregnancy.ends_at))})</span>
          </div>
        )}
        
        {/* Contraceptive Status */}
        {contraceptiveExpires && contraceptiveExpires > new Date() && (
          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
            💊 Anticoncepcional ativo - {formatTimeRemaining(contraceptiveExpires)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-8 space-y-4 pb-32">
        {/* Scratch Game Modal */}
        {showScratchGame && (
          <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-xl flex items-center justify-center p-8">
            <div className="bg-background-dark border border-white/10 rounded-[40px] p-8 max-w-md w-full">
              <h3 className="text-2xl font-black text-white text-center mb-6 uppercase tracking-tighter">🎰 Raspadinha</h3>
              
              <div className="flex justify-center gap-4 mb-8">
                {scratchSlots.map((slot, i) => (
                  <button
                    key={i}
                    onClick={() => !slot.revealed && handleRevealSlot(i)}
                    disabled={slot.revealed}
                    className={`w-24 h-24 rounded-2xl flex items-center justify-center text-5xl transition-all ${
                      slot.revealed 
                        ? 'bg-white/10 border border-white/20' 
                        : 'scratch-card-surface cursor-pointer hover:scale-105 active:scale-95'
                    }`}
                  >
                    {slot.revealed ? slot.symbol : '❓'}
                  </button>
                ))}
              </div>
              
              {scratchResult && (
                <div className={`text-center p-6 rounded-3xl ${scratchResult.won ? 'bg-yellow-500/20 border border-yellow-500/30' : 'bg-white/5 border border-white/10'}`}>
                  {scratchResult.won ? (
                    <>
                      <p className="text-3xl mb-2">🎉</p>
                      <p className="text-xl font-black text-yellow-400">VOCÊ GANHOU!</p>
                      <p className="text-white font-bold mt-2">
                        {scratchResult.prizeType === 'money' ? `₭${scratchResult.prizeAmount}` : `Vale ₭${scratchResult.prizeAmount}`}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-3xl mb-2">😔</p>
                      <p className="text-white/60">Não foi dessa vez...</p>
                    </>
                  )}
                </div>
              )}
              
              <button
                onClick={() => {
                  setShowScratchGame(false);
                  setScratchSlots([]);
                  setScratchResult(null);
                }}
                className="w-full mt-6 py-4 rounded-2xl bg-white/10 text-white font-bold uppercase tracking-widest"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        {/* Pregnancy Test Result Modal */}
        {showTestResult && (
          <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-xl flex items-center justify-center p-8">
            <div className="bg-background-dark border border-white/10 rounded-[40px] p-8 max-w-md w-full text-center">
              <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${
                showTestResult.result === 'positive' ? 'bg-pink-500/20 border-2 border-pink-500/40' : 'bg-white/10 border-2 border-white/20'
              }`}>
                <span className="text-5xl">{showTestResult.result === 'positive' ? '🤰' : '➖'}</span>
              </div>
              
              <h3 className={`text-2xl font-black uppercase tracking-tighter mb-4 ${
                showTestResult.result === 'positive' ? 'text-pink-400' : 'text-white'
              }`}>
                {showTestResult.result === 'positive' ? 'POSITIVO!' : 'Negativo'}
              </h3>
              
              <p className="text-white/60 mb-6">
                {showTestResult.result === 'positive' 
                  ? 'Parabéns! Você está grávida!' 
                  : 'O teste deu negativo.'}
              </p>
              
              {showTestResult.result === 'positive' && pregnancy && !pregnancy.announced && (
                <button
                  onClick={() => handleAnnouncePregnancy(showTestResult.testId)}
                  className="w-full py-4 rounded-2xl bg-pink-500 text-white font-bold uppercase tracking-widest mb-4"
                >
                  🎀 Anunciar Gravidez
                </button>
              )}
              
              <button
                onClick={() => setShowTestResult(null)}
                className="w-full py-4 rounded-2xl bg-white/10 text-white font-bold uppercase tracking-widest"
              >
                {showTestResult.result === 'positive' && !pregnancy?.announced ? 'Manter em Segredo' : 'Fechar'}
              </button>
            </div>
          </div>
        )}

        <div className="px-2 mb-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Produtos Disponíveis</h3>
        </div>

        {/* Menu Items */}
        {PHARMACY_ITEMS.map((item) => {
          const isRestricted = item.restrictedTo === 'lunari' && !isLunari;
          const cantAfford = userMoney < item.price;
          const isProcessing = processingItem === item.id;

          return (
            <div 
              key={item.id}
              className={`group relative bg-white/[0.03] border rounded-[32px] p-6 transition-all ${
                isRestricted ? 'opacity-50 border-white/5' : 'border-white/5 hover:bg-white/[0.05] hover:border-emerald-500/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border ${
                    isRestricted ? 'bg-white/5 border-white/10' : 'bg-emerald-500/10 border-emerald-500/20'
                  }`}>
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-white tracking-tight leading-none mb-1">{item.name}</h4>
                    <p className="text-[11px] text-white/40">{item.description}</p>
                    {item.duration && (
                      <span className="text-[9px] text-blue-400 font-bold uppercase tracking-widest">
                        Duração: {item.duration} dias
                      </span>
                    )}
                    {isRestricted && (
                      <span className="text-[9px] text-rose-400 font-bold uppercase tracking-widest block mt-1">
                        Apenas para Lunari
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-lg font-black text-emerald-400">₭{item.price}</span>
                  <button
                    onClick={() => handlePurchase(item.id)}
                    disabled={isProcessing || isRestricted || cantAfford}
                    className={`px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                      isProcessing || isRestricted || cantAfford
                        ? 'bg-white/5 text-white/30 cursor-not-allowed'
                        : 'bg-emerald-500 text-white shadow-lg active:scale-95'
                    }`}
                  >
                    {isProcessing ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Comprar'
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Active Pregnancy Tests */}
        {pregnancyTests.length > 0 && (
          <>
            <div className="px-2 mt-8 mb-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Testes Recentes</h3>
            </div>
            {pregnancyTests.map((test) => (
              <div 
                key={test.id}
                className={`bg-white/[0.03] border rounded-[24px] p-4 ${
                  test.result === 'positive' ? 'border-pink-500/30' : 'border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{test.result === 'positive' ? '🤰' : '➖'}</span>
                    <div>
                      <p className={`font-bold ${test.result === 'positive' ? 'text-pink-400' : 'text-white/60'}`}>
                        {test.result === 'positive' ? 'Positivo' : 'Negativo'}
                      </p>
                      <p className="text-[9px] text-white/30">
                        Expira em: {formatTimeRemaining(new Date(test.expires_at))}
                      </p>
                    </div>
                  </div>
                  {test.result === 'positive' && pregnancy && !pregnancy.announced && (
                    <button
                      onClick={() => handleAnnouncePregnancy(test.id)}
                      className="px-4 py-2 rounded-xl bg-pink-500/20 text-pink-400 text-[10px] font-bold uppercase tracking-widest border border-pink-500/30"
                    >
                      Anunciar
                    </button>
                  )}
                  {test.announced && (
                    <span className="px-3 py-1 rounded-full bg-pink-500/20 text-pink-400 text-[9px] font-bold uppercase">
                      Anunciado
                    </span>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 bg-gradient-to-t from-background-dark via-background-dark/80 to-transparent absolute bottom-0 left-0 right-0">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[24px] p-4 text-center">
          <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em]">Cuide da sua saúde no MagicTalk!</p>
        </div>
      </div>
    </div>
  );
};