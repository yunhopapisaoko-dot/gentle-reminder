"use client";

import React, { useState, useMemo } from 'react';
import { MenuItem, CartItem, OrderItem } from '../types';

interface MenuViewProps {
  locationName: string;
  items: MenuItem[];
  onClose: () => void;
  onOrderConfirmed?: (items: MenuItem[], orderItems: OrderItem[], preparationTime: number) => void;
}

interface CategoryTheme {
  gradient: string;
  bgGradient: string;
  icon: string;
  iconBg: string;
  accent: string;
  border: string;
}

const CATEGORY_THEMES: Record<string, CategoryTheme> = {
  'Comidas': {
    gradient: 'from-amber-500 to-orange-600',
    bgGradient: 'from-amber-950/40 to-orange-950/40',
    icon: 'restaurant',
    iconBg: 'bg-amber-500/20 border-amber-500/30',
    accent: 'text-amber-400',
    border: 'border-amber-500/20'
  },
  'Bebidas': {
    gradient: 'from-sky-400 to-cyan-600',
    bgGradient: 'from-sky-950/40 to-cyan-950/40',
    icon: 'local_cafe',
    iconBg: 'bg-sky-500/20 border-sky-500/30',
    accent: 'text-sky-400',
    border: 'border-sky-500/20'
  },
  'Alcoólicas': {
    gradient: 'from-violet-500 to-purple-700',
    bgGradient: 'from-violet-950/40 to-purple-950/40',
    icon: 'wine_bar',
    iconBg: 'bg-violet-500/20 border-violet-500/30',
    accent: 'text-violet-400',
    border: 'border-violet-500/20'
  },
  'Sobremesas': {
    gradient: 'from-rose-400 to-pink-600',
    bgGradient: 'from-rose-950/40 to-pink-950/40',
    icon: 'icecream',
    iconBg: 'bg-rose-500/20 border-rose-500/30',
    accent: 'text-rose-400',
    border: 'border-rose-500/20'
  }
};

export const MenuView: React.FC<MenuViewProps> = ({ locationName, items, onClose, onOrderConfirmed }) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isClosing, setIsClosing] = useState(false);
  const [showCartOverlay, setShowCartOverlay] = useState(false);

  const categories = useMemo(() => ['Comidas', 'Bebidas', 'Alcoólicas', 'Sobremesas'], []);

  const cartTotal = useMemo(() => 
    cart.reduce((acc, item) => acc + (item.price * item.quantity), 0),
  [cart]);

  const cartCount = useMemo(() => 
    cart.reduce((acc, item) => acc + item.quantity, 0),
  [cart]);

  const maxPreparationTime = useMemo(() => 
    Math.max(...cart.map(item => item.preparationTime || 5), 0),
  [cart]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 350);
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === id);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.id === id ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.id !== id);
    });
  };

  const handleFinalize = () => {
    if (onOrderConfirmed) {
      const flatItems: MenuItem[] = [];
      const orderItems: OrderItem[] = cart.map(cartItem => ({
        id: cartItem.id,
        name: cartItem.name,
        price: cartItem.price,
        quantity: cartItem.quantity,
        image: cartItem.image,
        hungerRestore: cartItem.hungerRestore,
        thirstRestore: cartItem.thirstRestore,
        alcoholLevel: cartItem.alcoholLevel
      }));
      
      cart.forEach(cartItem => {
        for (let i = 0; i < cartItem.quantity; i++) {
          flatItems.push(cartItem);
        }
      });
      onOrderConfirmed(flatItems, orderItems, maxPreparationTime);
    }
    setCart([]);
    setShowCartOverlay(false);
    handleClose();
  };

  return (
    <div className={`fixed inset-0 z-[150] flex flex-col h-[100dvh] overflow-hidden ${isClosing ? 'animate-out slide-out-bottom' : 'animate-in slide-in-bottom'}`}>
      {/* Elegant Dark Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-900 via-neutral-950 to-black"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent"></div>
      
      {/* Decorative Pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>

      {/* Header Premium */}
      <div className="relative pt-12 px-6 pb-6 border-b border-white/10 bg-black/40 backdrop-blur-sm z-40">
        <div className="flex items-center justify-between">
          <button 
            onClick={activeCategory ? () => setActiveCategory(null) : handleClose} 
            className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 active:scale-90 transition-all border border-white/10"
          >
            <span className="material-symbols-rounded text-xl">{activeCategory ? 'arrow_back' : 'close'}</span>
          </button>
          
          <div className="text-center">
            <p className="text-[10px] font-medium text-emerald-400 uppercase tracking-[0.3em] mb-1">{locationName}</p>
            <h2 className="text-xl font-light text-white tracking-wide">{activeCategory || 'Cardápio'}</h2>
          </div>

          <button 
            onClick={() => setShowCartOverlay(true)}
            className="w-11 h-11 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 relative border border-emerald-500/30 hover:bg-emerald-500/30 transition-all"
          >
            <span className="material-symbols-rounded text-xl">shopping_bag</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-black text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/50">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="relative flex-1 overflow-y-auto scrollbar-hide p-6 pb-40">
        {!activeCategory ? (
          /* Category Selection - Elegant Grid */
          <div className="grid grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-500">
            {categories.map((cat, index) => {
              const theme = CATEGORY_THEMES[cat];
              const categoryItems = items.filter(i => i.category === cat);
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`relative aspect-square w-full rounded-2xl overflow-hidden group active:scale-95 transition-all duration-300 bg-gradient-to-br ${theme.bgGradient} border ${theme.border} hover:border-white/20`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Glow Effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                  
                  {/* Content */}
                  <div className="relative h-full flex flex-col items-center justify-center p-5">
                    <div className={`w-16 h-16 rounded-2xl ${theme.iconBg} border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <span className={`material-symbols-rounded text-3xl ${theme.accent}`}>{theme.icon}</span>
                    </div>
                    <h3 className="text-base font-medium text-white/90 tracking-wide">{cat}</h3>
                    <p className="text-xs text-white/40 mt-1.5">{categoryItems.length} opções</p>
                  </div>
                  
                  {/* Corner Accent */}
                  <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl ${theme.gradient} opacity-10 rounded-bl-full`}></div>
                </button>
              );
            })}
          </div>
        ) : (
          /* Items List - Elegant Cards */
          <div className="animate-in slide-in-from-right duration-500 space-y-4">
            {/* Category Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-1 h-8 rounded-full bg-gradient-to-b ${CATEGORY_THEMES[activeCategory].gradient}`}></div>
              <div>
                <h3 className="text-lg font-medium text-white">{activeCategory}</h3>
                <p className="text-xs text-white/40">{items.filter(i => i.category === activeCategory).length} itens disponíveis</p>
              </div>
            </div>
            
            {items.filter(i => i.category === activeCategory).map((item, index) => {
              const inCart = cart.find(ci => ci.id === item.id);
              const theme = CATEGORY_THEMES[activeCategory];
              
              return (
                <div 
                  key={item.id} 
                  className={`bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5 group hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-xl ${theme.iconBg} border flex items-center justify-center flex-shrink-0`}>
                      <span className={`material-symbols-rounded text-2xl ${theme.accent}`}>{theme.icon}</span>
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h4 className="text-base font-medium text-white leading-tight">{item.name}</h4>
                        <span className={`text-lg font-semibold ${theme.accent} whitespace-nowrap`}>
                          R$ {item.price.toFixed(2)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-white/50 leading-relaxed line-clamp-2 mb-3">
                        {item.description}
                      </p>
                      
                      {/* Stats Row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.hungerRestore && item.hungerRestore > 0 && (
                          <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                            <span className="material-symbols-rounded text-sm text-amber-400">restaurant</span>
                            <span className="text-xs font-medium text-amber-400">+{item.hungerRestore} fome</span>
                          </div>
                        )}
                        {item.thirstRestore && item.thirstRestore > 0 && (
                          <div className="flex items-center gap-1.5 bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 rounded-lg">
                            <span className="material-symbols-rounded text-sm text-sky-400">water_drop</span>
                            <span className="text-xs font-medium text-sky-400">+{item.thirstRestore} sede</span>
                          </div>
                        )}
                        {item.alcoholLevel && item.alcoholLevel > 0 && (
                          <div className="flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-lg">
                            <span className="material-symbols-rounded text-sm text-violet-400">wine_bar</span>
                            <span className="text-xs font-medium text-violet-400">+{item.alcoholLevel} álcool</span>
                          </div>
                        )}
                        {item.preparationTime && (
                          <div className="flex items-center gap-1 text-white/30">
                            <span className="material-symbols-rounded text-sm">schedule</span>
                            <span className="text-xs">{item.preparationTime}min</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Add Button Row */}
                  <div className="flex justify-end mt-4 pt-4 border-t border-white/5">
                    {inCart ? (
                      <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-2 py-1.5">
                        <button 
                          onClick={() => removeFromCart(item.id)} 
                          className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-all"
                        >
                          <span className="material-symbols-rounded text-lg">remove</span>
                        </button>
                        <span className="text-base font-semibold text-emerald-400 w-6 text-center">{inCart.quantity}</span>
                        <button 
                          onClick={() => addToCart(item)} 
                          className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-black hover:bg-emerald-400 active:scale-90 transition-all"
                        >
                          <span className="material-symbols-rounded text-lg">add</span>
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => addToCart(item)}
                        className="flex items-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 px-4 py-2.5 rounded-xl active:scale-95 transition-all"
                      >
                        <span className="material-symbols-rounded text-lg">add</span>
                        <span className="text-sm font-medium">Adicionar</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      {cartCount > 0 && (
        <div className="absolute bottom-8 left-6 right-6 z-50 animate-in slide-in-from-bottom duration-500">
          <button 
            onClick={() => setShowCartOverlay(true)}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-black p-4 rounded-2xl flex items-center justify-between shadow-2xl shadow-emerald-500/30 active:scale-[0.98] transition-all hover:shadow-emerald-500/40"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center">
                <span className="text-sm font-bold">{cartCount}</span>
              </div>
              <span className="text-sm font-semibold">Ver Sacola</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">R$ {cartTotal.toFixed(2)}</span>
              <span className="material-symbols-rounded">arrow_forward</span>
            </div>
          </button>
        </div>
      )}

      {/* Cart Overlay */}
      {showCartOverlay && (
        <div className="fixed inset-0 z-[160] bg-black/90 backdrop-blur-xl flex items-end animate-in fade-in duration-300">
          <div className="w-full bg-neutral-900 rounded-t-3xl border-t border-white/10 p-8 animate-in slide-in-from-bottom duration-500">
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-8"></div>
            
            <div className="flex justify-between items-center mb-8">
              <div>
                <h4 className="text-xl font-medium text-white">Minha Sacola</h4>
                <p className="text-sm text-white/40 mt-1">{cartCount} {cartCount === 1 ? 'item' : 'itens'}</p>
              </div>
              <button onClick={() => setShowCartOverlay(false)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white border border-white/10 transition-all">
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>

            <div className="max-h-[40vh] overflow-y-auto scrollbar-hide space-y-3 mb-8">
              {cart.map(item => {
                const theme = CATEGORY_THEMES[item.category] || CATEGORY_THEMES['Comidas'];
                return (
                  <div key={item.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className={`w-12 h-12 rounded-xl ${theme.iconBg} border flex items-center justify-center flex-shrink-0`}>
                      <span className={`material-symbols-rounded text-xl ${theme.accent}`}>{theme.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{item.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-white/40">R$ {item.price.toFixed(2)} un.</span>
                        {item.hungerRestore && item.hungerRestore > 0 && (
                          <span className="text-[10px] text-amber-400 font-medium">+{item.hungerRestore} fome</span>
                        )}
                        {item.thirstRestore && item.thirstRestore > 0 && (
                          <span className="text-[10px] text-sky-400 font-medium">+{item.thirstRestore} sede</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1.5 border border-white/10">
                      <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 flex items-center justify-center text-white/50 hover:text-white active:scale-90 transition-all">
                        <span className="material-symbols-rounded text-lg">remove</span>
                      </button>
                      <span className="text-sm font-semibold text-white w-5 text-center">{item.quantity}</span>
                      <button onClick={() => addToCart(item)} className="w-7 h-7 flex items-center justify-center text-white/50 hover:text-white active:scale-90 transition-all">
                        <span className="material-symbols-rounded text-lg">add</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-white/10 pt-6 mb-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/50">Subtotal</span>
                <span className="text-sm font-medium text-white">R$ {cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/50">Tempo de Preparo</span>
                <span className="text-sm font-medium text-amber-400 flex items-center gap-1.5">
                  <span className="material-symbols-rounded text-sm">schedule</span>
                  ~{maxPreparationTime} min
                </span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <span className="text-base font-medium text-white">Total</span>
                <span className="text-2xl font-bold text-emerald-400">R$ {cartTotal.toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={handleFinalize}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 py-4 rounded-2xl text-base font-semibold text-black shadow-xl shadow-emerald-500/30 active:scale-[0.98] transition-all hover:shadow-emerald-500/40"
            >
              Confirmar Pedido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};