
import React, { useState, useMemo } from 'react';
import { MenuItem, CartItem } from '../types';

interface MenuViewProps {
  locationName: string;
  items: MenuItem[];
  onClose: () => void;
}

interface CategoryTheme {
  primary: string;
  secondary: string;
  glow: string;
  image: string;
  icon: string;
}

const CATEGORY_THEMES: Record<string, CategoryTheme> = {
  'Comidas': {
    primary: 'from-orange-500',
    secondary: 'to-amber-600',
    glow: 'shadow-orange-500/40',
    image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=600',
    icon: 'restaurant'
  },
  'Bebidas': {
    primary: 'from-cyan-400',
    secondary: 'to-blue-600',
    glow: 'shadow-cyan-400/40',
    image: 'https://images.unsplash.com/photo-1543250609-bc0353982823?q=80&w=600',
    icon: 'local_cafe'
  },
  'Alcoólicas': {
    primary: 'from-purple-600',
    secondary: 'to-indigo-700',
    glow: 'shadow-purple-600/40',
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=600',
    icon: 'wine_bar'
  },
  'Sobremesas': {
    primary: 'from-pink-400',
    secondary: 'to-fuchsia-600',
    glow: 'shadow-pink-400/40',
    image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=600',
    icon: 'icecream'
  }
};

export const MenuView: React.FC<MenuViewProps> = ({ locationName, items, onClose }) => {
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

  return (
    <div className={`fixed inset-0 z-[150] bg-background-dark flex flex-col h-[100dvh] overflow-hidden ${isClosing ? 'animate-out slide-out-bottom' : 'animate-in slide-in-bottom'}`}>
      
      {/* Header Fixo Premium */}
      <div className="pt-12 px-6 pb-6 bg-black/50 backdrop-blur-3xl border-b border-white/5 relative z-40">
        <div className="flex items-center justify-between">
          <button 
            onClick={activeCategory ? () => setActiveCategory(null) : handleClose} 
            className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center text-white active:scale-90 transition-all border border-white/10"
          >
            <span className="material-symbols-rounded">{activeCategory ? 'arrow_back' : 'close'}</span>
          </button>
          
          <div className="text-center">
            <h2 className="text-lg font-black text-white leading-none tracking-tighter italic uppercase">{activeCategory || 'Cardápio'}</h2>
            <p className="text-[8px] font-black text-primary uppercase tracking-[0.25em] mt-1.5">{locationName}</p>
          </div>

          <button 
            onClick={() => setShowCartOverlay(true)}
            className="w-11 h-11 rounded-2xl bg-primary/20 flex items-center justify-center text-primary relative border border-primary/20 shadow-lg shadow-primary/10"
          >
            <span className="material-symbols-rounded">shopping_bag</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-secondary text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-background-dark animate-bounce">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide p-5 pb-40">
        {!activeCategory ? (
          /* Grid de Categorias Quadrado (2 colunas) */
          <div className="grid grid-cols-2 gap-4 animate-in zoom-in duration-500">
            {categories.map(cat => {
              const theme = CATEGORY_THEMES[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="relative aspect-square w-full rounded-[40px] overflow-hidden group shadow-2xl active:scale-95 transition-all duration-500 border border-white/5"
                >
                  <img src={theme.image} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={cat} />
                  <div className={`absolute inset-0 bg-gradient-to-br ${theme.primary} ${theme.secondary} opacity-40 group-hover:opacity-60 transition-opacity`}></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                  
                  <div className="relative h-full flex flex-col items-center justify-center p-6 text-center">
                    <span className="material-symbols-rounded text-white text-3xl mb-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{theme.icon}</span>
                    <h3 className="text-sm font-black text-white italic tracking-widest uppercase">{cat}</h3>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          /* Grid de Itens 2-cols com Descrições */
          <div className="animate-in slide-in-right duration-500">
             <div className="flex items-center justify-between mb-8 px-2">
                <div className="flex items-center space-x-3">
                  <div className={`w-1.5 h-6 bg-gradient-to-b ${CATEGORY_THEMES[activeCategory].primary} ${CATEGORY_THEMES[activeCategory].secondary} rounded-full`}></div>
                  <h3 className="text-xs font-black text-white/50 uppercase tracking-widest">{activeCategory}</h3>
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
               {items.filter(i => i.category === activeCategory).map(item => {
                 const inCart = cart.find(ci => ci.id === item.id);
                 const theme = CATEGORY_THEMES[activeCategory];
                 return (
                   <div key={item.id} className="bg-surface-purple/20 rounded-[32px] overflow-hidden border border-white/5 shadow-xl flex flex-col group relative">
                      <div className="aspect-square relative overflow-hidden">
                        <img src={item.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={item.name} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        
                        {/* Botão flutuante de adicionar */}
                        <div className="absolute top-3 right-3">
                           {inCart ? (
                             <div className={`flex flex-col items-center bg-white text-black rounded-2xl p-1.5 space-y-2 shadow-2xl`}>
                               <button onClick={() => addToCart(item)} className="active:scale-75"><span className="material-symbols-rounded text-xs font-black">add</span></button>
                               <span className="text-[10px] font-black">{inCart.quantity}</span>
                               <button onClick={() => removeFromCart(item.id)} className="active:scale-75"><span className="material-symbols-rounded text-xs font-black">remove</span></button>
                             </div>
                           ) : (
                             <button 
                               onClick={() => addToCart(item)}
                               className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center shadow-2xl active:scale-90 transition-all"
                             >
                               <span className="material-symbols-rounded text-xl">add</span>
                             </button>
                           )}
                        </div>
                      </div>
                      
                      <div className="p-4 flex flex-col flex-1">
                        <div className="flex flex-col mb-1.5">
                          <h4 className="text-[12px] font-black text-white leading-tight tracking-tight mb-1">{item.name}</h4>
                          <span className={`text-[11px] font-black bg-clip-text text-transparent bg-gradient-to-r ${theme.primary} ${theme.secondary}`}>
                            R$ {item.price.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-[9px] text-white/30 leading-relaxed font-bold line-clamp-3 italic">
                          {item.description}
                        </p>
                      </div>
                   </div>
                 );
               })}
             </div>
          </div>
        )}
      </div>

      {/* Botão de Finalizar Checkout */}
      {cartCount > 0 && (
        <div className="absolute bottom-10 left-6 right-6 z-50 animate-in slide-in-from-bottom duration-500">
          <button 
            onClick={() => setShowCartOverlay(true)}
            className="w-full bg-white text-black p-5 rounded-[28px] flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)] active:scale-95 transition-all group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-2xl bg-black flex items-center justify-center text-white">
                <span className="text-[11px] font-black">{cartCount}</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Revisar Pedido</span>
            </div>
            <div className="flex items-center space-x-2">
               <span className="text-sm font-black italic">R$ {cartTotal.toFixed(2)}</span>
               <span className="material-symbols-rounded group-hover:translate-x-1 transition-transform">east</span>
            </div>
          </button>
        </div>
      )}

      {/* Cart Modal Overlay */}
      {showCartOverlay && (
        <div className="fixed inset-0 z-[160] bg-black/80 backdrop-blur-xl flex items-end animate-in fade-in duration-300">
          <div className="w-full bg-background-dark rounded-t-[50px] border-t border-white/5 p-10 animate-in slide-in-from-bottom duration-500 shadow-[0_-30px_100px_rgba(0,0,0,1)]">
            <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-10"></div>
            
            <div className="flex justify-between items-center mb-10">
              <h4 className="text-2xl font-black text-white italic tracking-tighter uppercase">Minha Sacola</h4>
              <button onClick={() => setShowCartOverlay(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white border border-white/10">
                 <span className="material-symbols-rounded">close</span>
              </button>
            </div>

            <div className="max-h-[35vh] overflow-y-auto scrollbar-hide space-y-8 mb-10">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center animate-in slide-in-from-right duration-300">
                  <div className="flex items-center space-x-5">
                    <div className="w-16 h-16 rounded-[20px] overflow-hidden shadow-2xl border border-white/5">
                      <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white tracking-tight leading-none mb-1.5">{item.name}</p>
                      <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">R$ {item.price.toFixed(2)} por unidade</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 bg-white/5 rounded-2xl p-2 border border-white/5">
                    <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 flex items-center justify-center text-white/40 active:scale-75 transition-transform"><span className="material-symbols-rounded text-base">remove</span></button>
                    <span className="text-xs font-black text-white w-4 text-center">{item.quantity}</span>
                    <button onClick={() => addToCart(item)} className="w-8 h-8 flex items-center justify-center text-white/40 active:scale-75 transition-transform"><span className="material-symbols-rounded text-base">add</span></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-white/5 pt-8 mb-10 space-y-3">
               <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Subtotal</span>
                  <span className="text-xs font-black text-white/60 tracking-widest">R$ {cartTotal.toFixed(2)}</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-lg font-black text-white italic tracking-tighter uppercase">Total</span>
                  <span className="text-2xl font-black text-secondary drop-shadow-[0_0_15px_rgba(217,70,239,0.5)]">R$ {cartTotal.toFixed(2)}</span>
               </div>
            </div>

            <button 
              onClick={() => {
                alert("Pedido confirmado no Roleplay! Bom apetite! ^_^");
                setCart([]);
                setShowCartOverlay(false);
              }}
              className="w-full bg-gradient-to-r from-primary to-secondary py-6 rounded-[30px] text-[10px] font-black uppercase tracking-[0.3em] text-white shadow-2xl shadow-primary/30 active:scale-95 transition-all"
            >
              Confirmar Pedido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
