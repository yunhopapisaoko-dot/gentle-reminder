"use client";

import React from 'react';

interface Character {
  id: string;
  name: string;
  image_url?: string;
  age?: number;
  gender?: string;
  origin?: string;
  group_name?: string;
  appearance_name?: string;
  sexuality?: string;
  relationship?: string;
}

interface CharactersGridProps {
  characters: Character[];
  onCreateClick: () => void;
}

export const CharactersGrid: React.FC<CharactersGridProps> = ({ characters, onCreateClick }) => {
  return (
    <div className="p-6 pb-40">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-black text-white uppercase tracking-tight">Seus Personagens</h2>
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Crie fichas para o roleplay</p>
        </div>
        <button 
          onClick={onCreateClick}
          className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30 active:scale-90 transition-all"
        >
          <span className="material-symbols-rounded text-2xl">add</span>
        </button>
      </div>

      {characters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 rounded-[40px] bg-white/5 flex items-center justify-center mb-6 border border-white/5">
            <span className="material-symbols-rounded text-5xl text-white/20">person_add</span>
          </div>
          <h3 className="text-sm font-black text-white/40 uppercase tracking-widest mb-2">Nenhum Personagem</h3>
          <p className="text-[10px] text-white/20 font-bold max-w-[200px]">Crie seu primeiro personagem para participar do roleplay nos locais.</p>
          <button 
            onClick={onCreateClick}
            className="mt-8 px-8 py-4 bg-primary rounded-2xl text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/30 active:scale-95 transition-all"
          >
            Criar Personagem
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {characters.map((char) => (
            <div 
              key={char.id} 
              className="bg-white/[0.03] rounded-[32px] border border-white/5 p-5 hover:bg-white/5 transition-all"
            >
              <div className="w-full aspect-square rounded-[24px] bg-white/5 mb-4 overflow-hidden border border-white/5">
                {char.image_url ? (
                  <img src={char.image_url} alt={char.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-rounded text-4xl text-white/10">person</span>
                  </div>
                )}
              </div>
              <h3 className="text-sm font-black text-white truncate mb-1">{char.name}</h3>
              <div className="flex items-center space-x-2 text-[9px] text-white/30 font-bold uppercase tracking-widest">
                {char.age && <span>{char.age} anos</span>}
                {char.gender && <span>• {char.gender}</span>}
              </div>
              {char.origin && (
                <p className="text-[9px] text-primary/60 font-bold mt-2 truncate">{char.origin}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
