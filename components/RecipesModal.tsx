"use client";

import React, { useState, useEffect } from 'react';
import { supabaseService } from '../services/supabaseService';

interface RecipesModalProps {
  userId: string;
  userName: string;
  onClose: () => void;
}

export const RecipesModal: React.FC<RecipesModalProps> = ({ userId, userName, onClose }) => {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPreparing, setIsPreparing] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<any | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [recipesData, inventoryData] = await Promise.all([
      supabaseService.getRecipes(),
      supabaseService.getInventory(userId)
    ]);
    setRecipes(recipesData);
    setInventory(inventoryData);
    setIsLoading(false);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  const handlePrepare = async (recipe: any) => {
    setIsPreparing(recipe.id);
    try {
      await supabaseService.prepareRecipe(userId, userName, recipe);
      alert(`${recipe.result_item_name} foi preparado e adicionado ao seu inventário! 🍳`);
      loadData();
      setSelectedRecipe(null);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsPreparing(null);
    }
  };

  const getIngredientStatus = (recipe: any) => {
    return supabaseService.checkRecipeIngredients(recipe, inventory);
  };

  return (
    <div className={`fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-end justify-center ${isClosing ? 'animate-out fade-out' : 'animate-in fade-in'}`}>
      <div className={`w-full max-w-md bg-background-dark rounded-t-[48px] border-t border-white/10 h-[85vh] flex flex-col ${isClosing ? 'animate-out slide-out-to-bottom' : 'animate-in slide-in-from-bottom'}`}>
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-white/5">
          <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6"></div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <span className="material-symbols-rounded text-3xl">menu_book</span>
              </div>
              <div>
                <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">Receitas</h2>
                <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Cozinha da Pousada</p>
              </div>
            </div>
            <button onClick={handleClose} className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all">
              <span className="material-symbols-rounded">close</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide pb-32">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center opacity-20">
              <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : recipes.length === 0 ? (
            <div className="py-20 text-center opacity-30 flex flex-col items-center">
              <span className="material-symbols-rounded text-6xl mb-4">menu_book</span>
              <p className="text-sm font-black uppercase tracking-[0.2em]">Sem Receitas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recipes.map((recipe) => {
                const status = getIngredientStatus(recipe);
                const servings = recipe.result_attributes?.servings || 1;
                
                return (
                  <div 
                    key={recipe.id} 
                    className={`bg-white/[0.03] border rounded-3xl overflow-hidden transition-all ${
                      status.hasAll ? 'border-green-500/30 hover:border-green-500/50' : 'border-white/5'
                    }`}
                  >
                    <div className="flex items-start p-5 cursor-pointer" onClick={() => setSelectedRecipe(selectedRecipe?.id === recipe.id ? null : recipe)}>
                      <img src={recipe.image_url} className="w-20 h-20 rounded-2xl object-cover border border-white/10 flex-shrink-0" alt={recipe.name} />
                      <div className="ml-4 flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-black text-white leading-tight truncate">{recipe.name}</h4>
                          {status.hasAll && (
                            <span className="bg-green-500/20 text-green-400 text-[7px] font-black px-2 py-1 rounded-lg uppercase">Pronto!</span>
                          )}
                        </div>
                        <p className="text-[10px] text-white/40 mb-2 line-clamp-2">{recipe.description}</p>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1 text-white/30">
                            <span className="material-symbols-rounded text-xs">schedule</span>
                            <span className="text-[9px] font-bold">{recipe.preparation_time}min</span>
                          </div>
                          <div className="flex items-center space-x-1 text-white/30">
                            <span className="material-symbols-rounded text-xs">group</span>
                            <span className="text-[9px] font-bold">{servings} porções</span>
                          </div>
                        </div>
                      </div>
                      <span className={`material-symbols-rounded text-white/30 ml-2 transition-transform ${selectedRecipe?.id === recipe.id ? 'rotate-180' : ''}`}>
                        expand_more
                      </span>
                    </div>

                    {/* Expanded Content */}
                    {selectedRecipe?.id === recipe.id && (
                      <div className="px-5 pb-5 pt-0 border-t border-white/5 animate-in slide-in-from-top-2">
                        <div className="mt-4 mb-4">
                          <h5 className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-3">Ingredientes Necessários</h5>
                          <div className="space-y-2">
                            {(recipe.ingredients as Array<{ item_id: string; item_name: string; quantity: number }>).map((ing, idx) => {
                              const hasItem = inventory.some(i => i.item_id === ing.item_id && i.quantity >= ing.quantity);
                              return (
                                <div key={idx} className={`flex items-center justify-between p-3 rounded-xl ${hasItem ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                  <div className="flex items-center space-x-2">
                                    <span className={`material-symbols-rounded text-sm ${hasItem ? 'text-green-400' : 'text-red-400'}`}>
                                      {hasItem ? 'check_circle' : 'cancel'}
                                    </span>
                                    <span className="text-[11px] font-bold text-white">{ing.item_name}</span>
                                  </div>
                                  <span className={`text-[10px] font-black ${hasItem ? 'text-green-400' : 'text-red-400'}`}>
                                    x{ing.quantity}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {!status.hasAll && (
                          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 mb-4">
                            <p className="text-[9px] text-amber-400 font-bold">
                              <span className="material-symbols-rounded text-xs align-middle mr-1">warning</span>
                              Faltam: {status.missing.join(', ')}
                            </p>
                          </div>
                        )}

                        <button
                          onClick={() => handlePrepare(recipe)}
                          disabled={!status.hasAll || isPreparing === recipe.id}
                          className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                            status.hasAll
                              ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                              : 'bg-white/5 text-white/20 cursor-not-allowed'
                          }`}
                        >
                          {isPreparing === recipe.id ? 'Preparando...' : status.hasAll ? '🍳 Preparar Receita' : 'Ingredientes Faltando'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
