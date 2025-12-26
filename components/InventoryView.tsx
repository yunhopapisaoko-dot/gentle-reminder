"use client";

import React, { useState, useEffect } from 'react';
import { supabaseService } from '../services/supabaseService';

interface InventoryViewProps {
  userId: string;
  onClose: () => void;
  onConsume: (item: any) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ userId, onClose, onConsume }) => {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setIsLoading(true);
    const data = await supabaseService.getInventory(userId);
    setItems(data);
    setIsLoading(false);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 400);
  };

  const handleUseItem = async (item: any) => {
    try {
      await supabaseService.consumeFromInventory(item.id, item.quantity);
      onConsume(item);
      fetchInventory();
    } catch (error: any) {
      alert("Erro ao usar item: " + error.message);
    }
  };

  return (
    <div className={`fixed inset-0 z-[550] bg-background-dark/95 backdrop-blur-3xl flex flex-col h-[100dvh] overflow-hidden ${isClosing ? 'animate-out slide-out-bottom' : 'animate-in slide-in-bottom'}`}>
      <div className="pt-16 px-8 pb-8 bg-black/40 border-b border-white/5 relative shrink-0">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button onClick={handleClose} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all">
              <span className="material-symbols-rounded">arrow_back</span>
            </button>
            <div>
              <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Inventário</h2>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mt-1.5">Meus Pertences</p>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <span className="material-symbols-rounded text-3xl">inventory_2</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide p-8 space-y-6 pb-32">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center opacity-20"><div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div></div>
        ) : items.length === 0 ? (
          <div className="py-32 text-center opacity-20 flex flex-col items-center">
             <span className="material-symbols-rounded text-6xl mb-4">shopping_bag</span>
             <p className="text-sm font-black uppercase tracking-[0.3em]">Sacola Vazia</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white/[0.03] border border-white/5 rounded-[32px] p-6 flex items-center justify-between group hover:bg-white/[0.05] transition-all">
                <div className="flex items-center space-x-5">
                   <div className="relative">
                      <img src={item.item_image} className="w-16 h-16 rounded-2xl object-cover border border-white/10" alt={item.item_name} />
                      <span className="absolute -top-2 -right-2 bg-primary text-white text-[9px] font-black px-2 py-0.5 rounded-lg border-2 border-background-dark">x{item.quantity}</span>
                   </div>
                   <div>
                      <h4 className="text-sm font-black text-white tracking-tight leading-none mb-1">{item.item_name}</h4>
                      <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest">{item.category}</p>
                   </div>
                </div>
                <button 
                  onClick={() => handleUseItem(item)}
                  className="px-6 py-3 rounded-xl bg-primary text-white text-[9px] font-black uppercase tracking-widest active:scale-90 transition-all shadow-lg shadow-primary/20"
                >
                  Usar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};