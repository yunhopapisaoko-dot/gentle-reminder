"use client";

import React, { useState, useMemo } from 'react';

interface Character {
  id: string;
  name: string;
  image_url?: string;
  age?: number;
  gender?: string;
  origin?: string;
  group_name?: string;
  profession?: string;
  appearance_name?: string;
  sexuality?: string;
  relationship?: string;
}

interface CharactersGridProps {
  characters: Character[];
  onCreateClick: () => void;
}

export const CharactersGrid: React.FC<CharactersGridProps> = ({ characters, onCreateClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Filtra personagens pela busca
  const filteredCharacters = useMemo(() => {
    if (!searchQuery.trim()) return characters;
    const query = searchQuery.toLowerCase();
    return characters.filter(char =>
      char.name.toLowerCase().includes(query) ||
      char.group_name?.toLowerCase().includes(query) ||
      char.profession?.toLowerCase().includes(query) ||
      char.origin?.toLowerCase().includes(query)
    );
  }, [characters, searchQuery]);

  // Agrupa personagens por grupo/profissão
  const groupedCharacters = useMemo(() => {
    const groups: Record<string, Character[]> = {};
    
    filteredCharacters.forEach(char => {
      const groupKey = char.group_name || char.profession || 'Sem Categoria';
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(char);
    });

    return groups;
  }, [filteredCharacters]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  // Por padrão, todos os grupos estão expandidos
  const isGroupExpanded = (groupName: string) => {
    return expandedGroups[groupName] !== false;
  };

  return (
    <div className="p-6 pb-40">
      {/* Header */}
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

      {/* Barra de Busca */}
      <div className="relative mb-6">
        <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-white/30">search</span>
        <input
          type="text"
          placeholder="Buscar por nome, grupo ou profissão..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white text-sm placeholder:text-white/20 focus:ring-primary focus:border-primary"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
          >
            <span className="material-symbols-rounded text-xl">close</span>
          </button>
        )}
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
      ) : filteredCharacters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="material-symbols-rounded text-5xl text-white/20 mb-4">search_off</span>
          <h3 className="text-sm font-black text-white/40 uppercase tracking-widest mb-2">Nenhum Resultado</h3>
          <p className="text-[10px] text-white/20 font-bold">Nenhum personagem encontrado para "{searchQuery}"</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedCharacters).map(([groupName, chars]) => (
            <div key={groupName} className="bg-white/[0.02] rounded-[32px] border border-white/5 overflow-hidden">
              {/* Header do Grupo */}
              <button
                onClick={() => toggleGroup(groupName)}
                className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-rounded text-primary">folder</span>
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-black text-white">{groupName}</h3>
                    <p className="text-[10px] text-white/30 font-bold">{chars.length} personagem{chars.length > 1 ? 's' : ''}</p>
                  </div>
                </div>
                <span className={`material-symbols-rounded text-white/30 transition-transform ${isGroupExpanded(groupName) ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>

              {/* Grid de Personagens */}
              {isGroupExpanded(groupName) && (
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-2 gap-3">
                    {chars.map((char) => (
                      <div 
                        key={char.id} 
                        className="bg-white/[0.03] rounded-[24px] border border-white/5 p-4 hover:bg-white/5 transition-all"
                      >
                        <div className="w-full aspect-square rounded-[18px] bg-white/5 mb-3 overflow-hidden border border-white/5">
                          {char.image_url ? (
                            <img src={char.image_url} alt={char.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="material-symbols-rounded text-3xl text-white/10">person</span>
                            </div>
                          )}
                        </div>
                        <h4 className="text-xs font-black text-white truncate mb-1">{char.name}</h4>
                        <div className="flex items-center space-x-1 text-[9px] text-white/30 font-bold">
                          {char.age && <span>{char.age} anos</span>}
                          {char.gender && <span>• {char.gender}</span>}
                        </div>
                        {char.profession && (
                          <div className="flex items-center space-x-1 mt-2">
                            <span className="material-symbols-rounded text-primary/50 text-xs">work</span>
                            <p className="text-[9px] text-primary/60 font-bold truncate">{char.profession}</p>
                          </div>
                        )}
                        {char.origin && !char.profession && (
                          <p className="text-[9px] text-primary/60 font-bold mt-2 truncate">{char.origin}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};