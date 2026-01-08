"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { supabaseService } from '../services/supabaseService';
import { CharacterDetailModal } from './CharacterDetailModal';

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
  user_id: string;
  profiles?: {
    full_name: string;
    username: string;
    avatar_url: string;
  };
}

interface CharactersGridProps {
  characters: Character[];
  currentUserId: string;
  onCreateClick: () => void;
  onRefresh: () => void;
}

type ViewMode = 'folders' | 'my-characters';

export const CharactersGrid: React.FC<CharactersGridProps> = ({ 
  characters, 
  currentUserId,
  onCreateClick,
  onRefresh
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('folders');

  // Filtra personagens pela busca
  const filteredCharacters = useMemo(() => {
    const baseList = viewMode === 'my-characters' 
      ? characters.filter(c => c.user_id === currentUserId)
      : characters;
      
    if (!searchQuery.trim()) return baseList;
    const query = searchQuery.toLowerCase();
    return baseList.filter(char =>
      char.name.toLowerCase().includes(query) ||
      char.group_name?.toLowerCase().includes(query) ||
      char.appearance_name?.toLowerCase().includes(query) ||
      char.profession?.toLowerCase().includes(query) ||
      char.origin?.toLowerCase().includes(query)
    );
  }, [characters, searchQuery, viewMode, currentUserId]);

  // Agrupa personagens por grupo (aparência) - cria pastas inteligentes
  const groupedCharacters = useMemo(() => {
    const groups: Record<string, Character[]> = {};
    
    filteredCharacters.forEach(char => {
      // Prioridade: group_name (ex: ATEEZ, BTS) > profession (ex: Atriz) > Sem Categoria
      const groupKey = char.group_name?.trim().toUpperCase() || 
                       char.profession?.trim() || 
                       'Sem Categoria';
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(char);
    });

    // Ordena grupos alfabeticamente, mas coloca "Sem Categoria" no final
    const sortedEntries = Object.entries(groups).sort(([a], [b]) => {
      if (a === 'Sem Categoria') return 1;
      if (b === 'Sem Categoria') return -1;
      return a.localeCompare(b);
    });

    return Object.fromEntries(sortedEntries);
  }, [filteredCharacters]);

  // Conta quantas aparências estão em uso por grupo
  const appearanceUsage = useMemo(() => {
    const usage: Record<string, string[]> = {};
    characters.forEach(char => {
      if (char.appearance_name) {
        const key = char.appearance_name.toLowerCase().trim();
        if (!usage[key]) usage[key] = [];
        usage[key].push(char.user_id);
      }
    });
    return usage;
  }, [characters]);

  const isAppearanceInUse = (appearanceName: string | undefined) => {
    if (!appearanceName) return false;
    const key = appearanceName.toLowerCase().trim();
    return (appearanceUsage[key]?.length || 0) > 0;
  };

  const getAppearanceUsageCount = (appearanceName: string | undefined) => {
    if (!appearanceName) return 0;
    const key = appearanceName.toLowerCase().trim();
    return appearanceUsage[key]?.length || 0;
  };

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const isGroupExpanded = (groupName: string) => {
    return expandedGroups[groupName] !== false;
  };

  const myCharactersCount = characters.filter(c => c.user_id === currentUserId).length;

  return (
    <div className="p-6 pb-40">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-black text-white uppercase tracking-tight">Personagens</h2>
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">
            {characters.length} fichas • {Object.keys(groupedCharacters).length} pastas
          </p>
        </div>
        <button 
          onClick={onCreateClick}
          className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30 active:scale-90 transition-all"
        >
          <span className="material-symbols-rounded text-2xl">add</span>
        </button>
      </div>

      {/* View Mode Toggle */}
      <div className="flex bg-white/5 rounded-2xl p-1 mb-6">
        <button
          onClick={() => setViewMode('folders')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            viewMode === 'folders' 
              ? 'bg-primary text-white shadow-lg' 
              : 'text-white/40 hover:text-white/60'
          }`}
        >
          <span className="material-symbols-rounded text-sm align-middle mr-1">folder</span>
          Pastas
        </button>
        <button
          onClick={() => setViewMode('my-characters')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            viewMode === 'my-characters' 
              ? 'bg-primary text-white shadow-lg' 
              : 'text-white/40 hover:text-white/60'
          }`}
        >
          <span className="material-symbols-rounded text-sm align-middle mr-1">person</span>
          Meus ({myCharactersCount})
        </button>
      </div>

      {/* Barra de Busca */}
      <div className="relative mb-6">
        <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-white/30">search</span>
        <input
          type="text"
          placeholder="Buscar por nome, grupo, aparência..."
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
          <p className="text-[10px] text-white/20 font-bold max-w-[200px]">Seja o primeiro a criar um personagem!</p>
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
              {/* Header do Grupo (Pasta) */}
              <button
                onClick={() => toggleGroup(groupName)}
                className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center relative">
                    <span className="material-symbols-rounded text-primary">folder</span>
                    {chars.length > 1 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-[9px] font-black text-white">{chars.length}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-black text-white">{groupName}</h3>
                    <p className="text-[10px] text-white/30 font-bold">
                      {chars.length} personagem{chars.length > 1 ? 's' : ''}
                      {chars.some(c => c.user_id === currentUserId) && (
                        <span className="text-primary ml-2">• Você tem ficha aqui</span>
                      )}
                    </p>
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
                    {chars.map((char) => {
                      const usageCount = getAppearanceUsageCount(char.appearance_name);
                      const isOwner = char.user_id === currentUserId;
                      
                      return (
                        <button 
                          key={char.id} 
                          onClick={() => setSelectedCharacter(char)}
                          className={`bg-white/[0.03] rounded-[24px] border p-4 hover:bg-white/5 transition-all text-left ${
                            isOwner ? 'border-primary/30' : 'border-white/5'
                          }`}
                        >
                          <div className="relative w-full aspect-square rounded-[18px] bg-white/5 mb-3 overflow-hidden border border-white/5">
                            {char.image_url ? (
                              <img src={char.image_url} alt={char.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="material-symbols-rounded text-3xl text-white/10">person</span>
                              </div>
                            )}
                            {isOwner && (
                              <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
                                <span className="material-symbols-rounded text-white text-sm">edit</span>
                              </div>
                            )}
                          </div>
                          
                          <h4 className="text-xs font-black text-white truncate mb-1">{char.name}</h4>
                          
                          <div className="flex items-center space-x-1 text-[9px] text-white/30 font-bold">
                            {char.age && <span>{char.age} anos</span>}
                            {char.gender && <span>• {char.gender}</span>}
                          </div>
                          
                          {char.appearance_name && (
                            <div className="flex items-center space-x-1 mt-2">
                              <span className={`material-symbols-rounded text-xs ${usageCount > 0 ? 'text-amber-400' : 'text-primary/50'}`}>
                                {usageCount > 0 ? 'verified' : 'face'}
                              </span>
                              <p className="text-[9px] font-bold truncate flex-1" style={{ color: usageCount > 0 ? '#fbbf24' : 'rgba(var(--primary), 0.6)' }}>
                                {char.appearance_name}
                              </p>
                              {usageCount > 1 && (
                                <span className="text-[8px] text-amber-400/60 font-bold">×{usageCount}</span>
                              )}
                            </div>
                          )}
                          
                          {/* Criador */}
                          {char.profiles && !isOwner && (
                            <div className="flex items-center space-x-1 mt-2 pt-2 border-t border-white/5">
                              <img 
                                src={char.profiles.avatar_url} 
                                alt="" 
                                className="w-4 h-4 rounded-full"
                              />
                              <span className="text-[8px] text-white/20 font-bold truncate">
                                @{char.profiles.username}
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Character Detail Modal */}
      {selectedCharacter && (
        <CharacterDetailModal
          character={selectedCharacter}
          currentUserId={currentUserId}
          onClose={() => setSelectedCharacter(null)}
          onUpdate={() => {
            setSelectedCharacter(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
};
