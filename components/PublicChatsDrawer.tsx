
import React, { useState } from 'react';
import { User } from '../types';
import { ARTISTS } from '../constants';

interface PublicChatsDrawerProps {
  onClose: () => void;
  onSelectRoom: (id: string) => void;
}

const ACTIVE_ROOMS = [
  { id: 'hospital', name: 'Hospital Central', active: 12, icon: 'medical_services', color: 'bg-blue-500' },
  { id: 'restaurante', name: 'Neon Grill', active: 24, icon: 'restaurant', color: 'bg-orange-500' },
  { id: 'padaria', name: 'Baguette Miku', active: 15, icon: 'bakery_dining', color: 'bg-yellow-600' },
  { id: 'creche', name: 'Sweet Kids', active: 8, icon: 'child_care', color: 'bg-pink-500' },
  { id: 'pousada', name: 'Pousada', active: 10, icon: 'hotel', color: 'bg-purple-500' },
  { id: 'praia', name: 'Praia', active: 6, icon: 'beach_access', color: 'bg-cyan-500' },
  { id: 'farmacia', name: 'Farmácia', active: 4, icon: 'local_pharmacy', color: 'bg-teal-500' },
];

const ONLINE_MEMBERS: User[] = [
  ...ARTISTS,
  { id: 'o1', name: 'Kaito', username: 'ice_kaito', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8UMZbyNBjK0Y6ht-U0Zdk-x6P4P-kN2zL7jQii2bgGPDHw36t3jfsCTVmTPunEkGRYXe32-rj1l797zbFzB8HZoKxz3g84pNhNeQAbdvQWee1ujOZ4R19SdmzhmQ-EEgCUiATik5lVNwKITZdD9ypXr4Qj0ZdqDsKxmEXyafPR6kSLsmztZktWu7u7c5MUCJrXhCq5p7ssn8J6-ByQZlNl0QrfnfnQ-OTl8grbr4NQtsqhWQxq0M-RUthmQ0Jx9e7kuk3-MiA5w' },
  { id: 'o2', name: 'Meiko', username: 'red_meiko', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200' },
];

export const PublicChatsDrawer: React.FC<PublicChatsDrawerProps> = ({ onClose, onSelectRoom }) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 400);
  };

  return (
    <div className="fixed inset-0 z-[240] flex items-end justify-center">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-500 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
        onClick={handleClose}
      />
      
      {/* Drawer Content */}
      <div 
        className={`relative w-full max-w-md bg-background-dark/95 backdrop-blur-3xl rounded-t-[60px] border-t border-white/10 p-8 pb-12 shadow-[0_-30px_100px_rgba(0,0,0,1)] flex flex-col max-h-[85vh]
          ${isClosing ? 'animate-out slide-out-bottom duration-500' : 'animate-in slide-in-bottom duration-500'}`}
      >
        <div className="w-16 h-1.5 bg-white/10 rounded-full mx-auto mb-8 shrink-0"></div>
        
        <div className="flex items-center justify-between mb-8 px-2 shrink-0">
          <div>
            <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Explorar Magic</h2>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mt-1">Status Global em tempo real</p>
          </div>
          <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-2xl">
             <span className="text-[10px] font-black text-primary uppercase tracking-widest">{ONLINE_MEMBERS.length + 42} Online</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide space-y-10">
          {/* Canais Ativos Section */}
          <section>
            <div className="flex items-center space-x-3 mb-6 px-2">
               <div className="w-1.5 h-4 bg-secondary rounded-full"></div>
               <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Canais Ativos Agora</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {ACTIVE_ROOMS.map((room) => (
                <button
                  key={room.id}
                  onClick={() => { onSelectRoom(room.id); handleClose(); }}
                  className="group flex items-center justify-between p-4 rounded-[28px] bg-white/[0.03] border border-white/5 hover:bg-white/10 transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-2xl ${room.color} flex items-center justify-center text-white shadow-lg`}>
                      <span className="material-symbols-rounded text-2xl">{room.icon}</span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black text-white">{room.name}</p>
                      <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{room.active} membros interagindo</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:text-primary transition-colors">
                     <span className="material-symbols-rounded text-lg">arrow_forward</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Membros Online Section */}
          <section>
            <div className="flex items-center space-x-3 mb-6 px-2">
               <div className="w-1.5 h-4 bg-primary rounded-full"></div>
               <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Membros Online</h3>
            </div>
            
            <div className="flex flex-wrap gap-4 px-2">
              {ONLINE_MEMBERS.map((member) => (
                <div key={member.id} className="flex flex-col items-center space-y-2 group cursor-pointer">
                  <div className="relative">
                    <img src={member.avatar} className="w-14 h-14 rounded-2xl object-cover border-2 border-white/5 group-hover:border-primary transition-all" alt={member.name} />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background-dark rounded-full"></div>
                  </div>
                  <span className="text-[8px] font-black text-white/40 group-hover:text-white transition-colors uppercase tracking-widest text-center w-14 truncate">{member.name.split(' ')[0]}</span>
                </div>
              ))}
              <button className="flex flex-col items-center space-y-2 group">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center text-white/10 group-hover:border-primary group-hover:text-primary transition-all">
                   <span className="material-symbols-rounded">more_horiz</span>
                </div>
                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Ver Todos</span>
              </button>
            </div>
          </section>
        </div>

        <button 
          onClick={handleClose}
          className="w-full py-5 rounded-[28px] bg-white text-black text-[10px] font-black uppercase tracking-[0.4em] mt-10 shadow-2xl active:scale-95 transition-all"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};
