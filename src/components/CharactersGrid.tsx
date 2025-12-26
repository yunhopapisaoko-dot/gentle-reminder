"use client";

import React, { useState, useMemo } from 'react';
import { Character } from '../types';

interface CharactersGridProps {
  characters: Character[];
  onCreateClick: () => void;
}

export const CharactersGrid: React.FC<CharactersGridProps> = ({ characters, onCreateClick }) => {
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  // Agrupamento automático por pastas (group_name)
  const groups = useMemo(() => {
    const map: Record<string, Character[]> = {};
    characters.forEach(c => {
      const g = c.group_name || 'OUTROS';
      if (!map[g]) map[g] = [];
      map[g].push(c);
    });
    return map;
  }, [characters]);

  const filteredGroups = useMemo(() => {
    const keys = Object.keys(groups);
    if (!search) return keys;
    return keys.filter(g => 
      g.toLowerCase().includes(search.toLowerCase()) || 
      groups[g].some(c => c.name.toLowerCase().includes(search.toLowerCase()))
    );
  }, [groups, search]);

  return (
    <div className="p-6 space-y-8 pb-40 animate-in slide-in-bottom duration-500">
      {/* Search & Header */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
           <div>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">Personagens</h2>
              <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1.5">{characters.length} identidades registradas</p>
           </div>
           {/* Botão de Ação Rápida no Topo */}
           <button 
            onClick={onCreateClick}
            className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 active:scale-90 transition-all border border-white/20"
           >
             <span className="material-symbols-rounded text-3xl">add</span>
           </button>
        </div>

        <div className="relative group">
          <div className="absolute inset-y-0 left-5 flex items-center text-white/20 group-focus-within:text-primary transition-colors">
            <span className="material-symbols-rounded">search</span>
          </div>
          <input 
            type="text"
            placeholder="Buscar por nome ou grupo..."
            className="w-full bg-white/[0.03] border border-white/10 rounded-[28px] py-4.5 pl-14 pr-6 text-sm text-white font-bold focus:ring-primary placeholder:text-white/10 transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Grid de Pastas ou Personagens */}
      {selectedGroup ? (
        <div className="space-y-8 animate-in slide-in-right duration-400">
           <div className="flex items-center justify-between">
             <button 
              onClick={() => setSelectedGroup(null)}
              className="flex items-center space-x-3 text-white/40 hover:text-white transition-colors group"
             >
               <span className="material-symbols-rounded group-hover:-translate-x-1 transition-transform">arrow_back</span>
               <span className="text-[10px] font-black uppercase tracking-widest">Voltar para pastas</span>
             </button>
             <button onClick={onCreateClick} className="flex items-center space-x-2 text-primary active:scale-95 transition-all">
                <span className="material-symbols-rounded text-lg">add_circle</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Novo</span>
             </button>
           </div>

           <div className="flex items-center space-x-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                <span className="material-symbols-rounded text-3xl">folder_open</span>
              </div>
              <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">{selectedGroup}</h3>
           </div>

           <div className="grid grid-cols-1 gap-4">
             {groups[selectedGroup].map(char => (
               <div key={char.id} className="bg-white/[0.03] border border-white/5 rounded-[40px] p-6 flex items-center space-x-6 group hover:bg-white/[0.06] transition-all">
                  <img src={char.image_url} className="w-24 h-24 rounded-[32px] object-cover border border-white/10" alt={char.name} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                       <h4 className="text-lg font-black text-white leading-none">{char.name}</h4>
                       <span className="text-[8px] font-black bg-primary/20 text-primary px-3 py-1 rounded-full border border-primary/10 uppercase tracking-widest">{char.origin}</span>
                    </div>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-3">{char.appearance_name} • {char.age} anos</p>
                    <div className="flex items-center space-x-4">
                       <div className="flex items-center space-x-1.5 text-white/20">
                         <span className="material-symbols-rounded text-[14px]">favorite</span>
                         <span className="text-[9px] font-black">{char.relationship}</span>
                       </div>
                       <div className="flex items-center space-x-1.5 text-white/20">
                         <span className="material-symbols-rounded text-[14px]">transgender</span>
                         <span className="text-[9px] font-black">{char.gender}</span>
                       </div>
                    </div>
                  </div>
               </div>
             ))}
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5">
          {/* Card Especial para CRIAR PERSONAGEM - Sempre Visível */}
          <button 
            onClick={onCreateClick}
            className="relative group aspect-square rounded-[48px] bg-primary/5 border-2 border-dashed border-primary/20 flex flex-col items-center justify-center p-8 hover:bg-primary/10 hover:border-primary/40 transition-all duration-500 shadow-2xl active:scale-95"
          >
            <div className="w-16 h-16 rounded-[24px] bg-primary text-white flex items-center justify-center shadow-[0_10px_30px_rgba(139,92,246,0.4)] mb-4">
               <span className="material-symbols-rounded text-4xl">person_add</span>
            </div>
            <span className="text-[12px] font-black text-primary tracking-widest uppercase italic text-center">Criar Novo</span>
          </button>

          {filteredGroups.map(group => (
            <button 
              key={group}
              onClick={() => setSelectedGroup(group)}
              className="relative group aspect-square rounded-[48px] bg-white/[0.03] border border-white/5 flex flex-col items-center justify-center p-8 hover:border-primary/40 hover:bg-primary/5 transition-all duration-500 shadow-2xl active:scale-95"
            >
              <div className="relative mb-4">
                 <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 <div className="relative w-16 h-16 rounded-[24px] bg-white/5 flex items-center justify-center text-white/30 group-hover:text-primary transition-colors">
                    <span className="material-symbols-rounded text-5xl">folder</span>
                 </div>
              </div>
              <span className="text-[13px] font-black text-white tracking-tighter uppercase italic text-center leading-tight mb-2 truncate w-full">{group}</span>
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{groups[group].length} Personagens</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};