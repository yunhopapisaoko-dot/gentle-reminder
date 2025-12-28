"use client";

import React, { useState, useEffect } from 'react';
import { supabaseService } from '../services/supabaseService';

interface FridgeModalProps {
  userId: string;
  userName: string;
  onClose: () => void;
}

export const FridgeModal: React.FC<FridgeModalProps> = ({ userId, userName, onClose }) => {
  const [fridgeItems, setFridgeItems] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'fridge' | 'inventory'>('fridge');
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [fridge, inventory] = await Promise.all([
      supabaseService.getFridgeItems(),
      supabaseService.getInventory(userId)
    ]);
    setFridgeItems(fridge);
    setInventoryItems(inventory);
    setIsLoading(false);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  const handleTakeFromFridge = async (item: any) => {
    try {
      await supabaseService.takeFromFridge(userId, item.id, item.quantity);
      alert(`${item.item_name} foi adicionado ao seu inventário!`);
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleAddToFridge = async (item: any) => {
    try {
      await supabaseService.moveToFridge(userId, userName, item.id, item.quantity);
      alert(`${item.item_name} foi adicionado à geladeira!`);
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className={`fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-end justify-center ${isClosing ? 'animate-out fade-out' : 'animate-in fade-in'}`}>
      <div className={`w-full max-w-md bg-background-dark rounded-t-[48px] border-t border-white/10 h-[85vh] flex flex-col ${isClosing ? 'animate-out slide-out-to-bottom' : 'animate-in slide-in-from-bottom'}`}>
        {/* Header */}
        <div className="px-8 pt-8 pb-4 border-b border-white/5">
          <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6"></div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <span className="material-symbols-rounded text-3xl">kitchen</span>
              </div>
              <div>
                <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">Geladeira</h2>
                <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Compartilhada da Pousada</p>
              </div>
            </div>
            <button onClick={handleClose} className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all">
              <span className="material-symbols-rounded">close</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setActiveTab('fridge')}
              className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'fridge'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-white/5 text-white/40'
              }`}
            >
              🧊 Na Geladeira
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'inventory'
                  ? 'bg-primary text-white'
                  : 'bg-white/5 text-white/40'
              }`}
            >
              🎒 Meu Inventário
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center opacity-20">
              <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : activeTab === 'fridge' ? (
            fridgeItems.length === 0 ? (
              <div className="py-20 text-center opacity-30 flex flex-col items-center">
                <span className="material-symbols-rounded text-6xl mb-4">kitchen</span>
                <p className="text-sm font-black uppercase tracking-[0.2em]">Geladeira Vazia</p>
                <p className="text-[10px] text-white/40 mt-2">Adicione itens do seu inventário!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {fridgeItems.map((item) => (
                  <div key={item.id} className="bg-white/[0.03] border border-white/5 rounded-3xl p-5 flex items-center justify-between group hover:bg-white/[0.05] transition-all">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <img src={item.item_image} className="w-14 h-14 rounded-xl object-cover border border-white/10" alt={item.item_name} />
                        <span className="absolute -top-2 -right-2 bg-cyan-500 text-white text-[8px] font-black px-2 py-0.5 rounded-lg">x{item.quantity}</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white leading-tight mb-1">{item.item_name}</h4>
                        <p className="text-[8px] text-white/30 font-bold">Por: {item.added_by_name}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleTakeFromFridge(item)}
                      className="px-5 py-3 rounded-xl bg-cyan-500 text-white text-[9px] font-black uppercase tracking-wider active:scale-90 transition-all shadow-lg shadow-cyan-500/20"
                    >
                      Pegar
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : (
            inventoryItems.length === 0 ? (
              <div className="py-20 text-center opacity-30 flex flex-col items-center">
                <span className="material-symbols-rounded text-6xl mb-4">inventory_2</span>
                <p className="text-sm font-black uppercase tracking-[0.2em]">Inventário Vazio</p>
              </div>
            ) : (
              <div className="space-y-3">
                {inventoryItems.map((item) => (
                  <div key={item.id} className="bg-white/[0.03] border border-white/5 rounded-3xl p-5 flex items-center justify-between group hover:bg-white/[0.05] transition-all">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <img src={item.item_image} className="w-14 h-14 rounded-xl object-cover border border-white/10" alt={item.item_name} />
                        <span className="absolute -top-2 -right-2 bg-primary text-white text-[8px] font-black px-2 py-0.5 rounded-lg">x{item.quantity}</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white leading-tight mb-1">{item.item_name}</h4>
                        <p className="text-[8px] text-white/30 font-bold uppercase tracking-widest">{item.category}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddToFridge(item)}
                      className="px-5 py-3 rounded-xl bg-primary text-white text-[9px] font-black uppercase tracking-wider active:scale-90 transition-all shadow-lg shadow-primary/20"
                    >
                      Guardar
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
