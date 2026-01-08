
import React from 'react';
import { User } from '../types';

interface StoriesProps {
  members: User[];
  onSelectArtist: (user: User) => void;
}

export const Stories: React.FC<StoriesProps> = ({ members, onSelectArtist }) => {
  return (
    <div className="py-6 bg-background-dark">
      <div className="px-6 mb-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Membros Ativos</h3>
      </div>
      <div className="flex space-x-6 px-6 overflow-x-auto scrollbar-hide">
        <div className="flex flex-col items-center space-y-2 group cursor-pointer">
          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border-2 border-dashed border-white/10 group-hover:border-primary transition-colors">
            <span className="material-symbols-rounded text-white/20 group-hover:text-primary">add</span>
          </div>
          <span className="text-[9px] font-bold text-white/30">Criar</span>
        </div>
        
        {members.length > 0 ? (
          members.map(member => (
            <div 
              key={member.id} 
              onClick={() => onSelectArtist(member)}
              className="flex flex-col items-center space-y-2 cursor-pointer group animate-in fade-in"
            >
              <div className="p-0.5 rounded-2xl bg-gradient-to-tr from-primary to-secondary">
                <div className="w-13 h-13 rounded-2xl bg-background-dark p-0.5">
                  <img src={member.avatar} alt={member.name} className="w-full h-full rounded-2xl object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all" />
                </div>
              </div>
              <span className="text-[9px] font-bold text-white/40 truncate w-14 text-center group-hover:text-white/80 transition-colors">
                {member.username}
              </span>
            </div>
          ))
        ) : (
          <div className="flex items-center space-x-2 px-4 opacity-20">
            <p className="text-[10px] font-black uppercase tracking-widest text-white">Aguardando membros...</p>
          </div>
        )}
      </div>
    </div>
  );
};
