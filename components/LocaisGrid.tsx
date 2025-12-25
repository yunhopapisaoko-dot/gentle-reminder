
import React from 'react';

interface Local {
  id: string;
  name: string;
  icon: string;
  color: string;
  image: string;
  activeCount: string;
}

const LOCAIS_DATA: Local[] = [
  { id: 'hospital', name: 'Hospital', icon: 'medical_services', color: 'from-blue-500', image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=400&auto=format&fit=crop', activeCount: '12 online' },
  { id: 'creche', name: 'Creche', icon: 'child_care', color: 'from-pink-500', image: 'https://images.unsplash.com/photo-1560523160-754a9e25c68f?q=80&w=400&auto=format&fit=crop', activeCount: '8 online' },
  { id: 'restaurante', name: 'Restaurante', icon: 'restaurant', color: 'from-orange-500', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=400&auto=format&fit=crop', activeCount: '24 online' },
  { id: 'padaria', name: 'Padaria', icon: 'bakery_dining', color: 'from-yellow-600', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=400&auto=format&fit=crop', activeCount: '15 online' },
];

export const LocaisGrid: React.FC<{ onSelect: (id: string) => void }> = ({ onSelect }) => {
  return (
    <div className="p-4 grid grid-cols-1 gap-5 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="px-2 mb-1">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Locais de Roleplay</h3>
      </div>
      {LOCAIS_DATA.map((local) => (
        <button
          key={local.id}
          onClick={() => onSelect(local.id)}
          className="relative group h-40 w-full rounded-[32px] overflow-hidden border border-white/5 shadow-2xl hover:border-primary/50 transition-all duration-500 transform active:scale-[0.96]"
        >
          {/* Thumbnails agora mostram o interior para combinar com o chat */}
          <img src={local.image} alt={local.name} className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-1000" />
          <div className="absolute inset-0 bg-gradient-to-tr from-background-dark via-background-dark/30 to-transparent"></div>
          
          <div className="relative h-full flex flex-col justify-end p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${local.color} to-background-dark/80 flex items-center justify-center shadow-xl border border-white/20 group-hover:rotate-3 transition-transform`}>
                  <span className="material-symbols-rounded text-white text-3xl">{local.icon}</span>
                </div>
                <div className="text-left">
                  <h4 className="text-2xl font-black text-white tracking-tighter leading-none drop-shadow-md">{local.name}</h4>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]"></div>
                    <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">{local.activeCount}</span>
                  </div>
                </div>
              </div>
              <div className="w-11 h-11 rounded-full bg-primary/20 backdrop-blur-md border border-primary/40 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-lg">
                <span className="material-symbols-rounded text-2xl">arrow_forward</span>
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};
