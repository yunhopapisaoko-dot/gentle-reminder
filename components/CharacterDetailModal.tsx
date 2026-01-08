"use client";

import React, { useState, useRef } from 'react';
import { supabaseService } from '../services/supabaseService';

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

interface CharacterDetailModalProps {
  character: Character;
  currentUserId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export const CharacterDetailModal: React.FC<CharacterDetailModalProps> = ({
  character,
  currentUserId,
  onClose,
  onUpdate
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: character.name,
    age: character.age?.toString() || '',
    gender: character.gender || '',
    sexuality: character.sexuality || '',
    appearance_name: character.appearance_name || '',
    group_name: character.group_name || '',
    relationship: character.relationship || ''
  });

  const isOwner = character.user_id === currentUserId;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 400);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert("O nome é obrigatório.");
      return;
    }
    
    setIsSaving(true);
    try {
      let imageUrl = character.image_url;
      
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `char_${Date.now()}.${fileExt}`;
        const filePath = `${currentUserId}/characters/${fileName}`;
        imageUrl = await supabaseService.uploadFile('avatars', filePath, selectedFile);
      }

      await supabaseService.updateCharacter(character.id, {
        name: formData.name,
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender || null,
        sexuality: formData.sexuality || null,
        appearance_name: formData.appearance_name || null,
        group_name: formData.group_name || null,
        relationship: formData.relationship || null,
        image_url: imageUrl
      });
      
      onUpdate();
      setIsEditing(false);
    } catch (error: any) {
      alert("Erro ao salvar: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir este personagem?")) return;
    
    setIsDeleting(true);
    try {
      await supabaseService.deleteCharacter(character.id);
      onUpdate();
      handleClose();
    } catch (error: any) {
      alert("Erro ao excluir: " + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const displayImage = previewUrl || character.image_url;

  return (
    <div className="fixed inset-0 z-[600] flex flex-col justify-end items-center overscroll-none">
      <div 
        className={`absolute inset-0 bg-black/70 backdrop-blur-xl transition-opacity duration-500 ${isClosing ? 'opacity-0' : 'opacity-100'}`} 
        onClick={handleClose} 
      />
      
      <div className={`relative w-full max-w-md bg-background-dark rounded-t-[50px] border-t border-white/5 shadow-[0_-30px_100px_rgba(0,0,0,1)] max-h-[92dvh] flex flex-col transition-all duration-300 ${isClosing ? 'animate-out slide-out-bottom' : 'animate-in slide-in-bottom'}`}>
        
        {/* Header */}
        <div className="p-6 pb-2 shrink-0">
          <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-6"></div>
          <h2 className="text-lg font-black text-white uppercase tracking-tight text-center">
            {isEditing ? 'Editar Personagem' : 'Ficha'}
          </h2>
          {!isEditing && character.profiles && (
            <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest text-center mt-1">
              @{character.profiles.username}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-8 pb-4 space-y-4 min-h-0">
          {/* Avatar */}
          <div className="flex justify-center mb-2">
            {isEditing ? (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="relative w-28 h-28 rounded-[32px] bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden group active:scale-95 transition-all"
              >
                {displayImage ? (
                  <img src={displayImage} alt={formData.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-rounded text-3xl text-white/20">person</span>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="material-symbols-rounded text-white text-xl">edit</span>
                </div>
              </button>
            ) : (
              <div className="w-28 h-28 rounded-[32px] bg-white/5 border border-white/10 overflow-hidden">
                {displayImage ? (
                  <img src={displayImage} alt={character.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-rounded text-3xl text-white/20">person</span>
                  </div>
                )}
              </div>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
          </div>

          {isEditing ? (
            <>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-4">Nome *</label>
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:ring-primary focus:border-primary"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-4">Idade</label>
                  <input 
                    type="number" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:ring-primary"
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-4">Gênero</label>
                  <input 
                    type="text" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:ring-primary"
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-4">Sexualidade</label>
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:ring-primary"
                  value={formData.sexuality}
                  onChange={(e) => setFormData({...formData, sexuality: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-4">Relacionamento</label>
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:ring-primary"
                  value={formData.relationship}
                  onChange={(e) => setFormData({...formData, relationship: e.target.value})}
                />
              </div>

              <div className="pt-2 border-t border-white/5">
                <p className="text-[9px] font-black text-primary/60 uppercase tracking-widest ml-4 mb-3">Aparência</p>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-4">Face Claim</label>
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:ring-primary"
                  value={formData.appearance_name}
                  onChange={(e) => setFormData({...formData, appearance_name: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-4">Grupo / Origem</label>
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:ring-primary"
                  value={formData.group_name}
                  onChange={(e) => setFormData({...formData, group_name: e.target.value})}
                />
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-2">
                <h3 className="text-xl font-black text-white">{character.name}</h3>
                {character.appearance_name && (
                  <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">
                    FC: {character.appearance_name}
                    {character.group_name && ` • ${character.group_name}`}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {character.age && (
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Idade</p>
                    <p className="text-white text-sm font-bold">{character.age} anos</p>
                  </div>
                )}
                {character.gender && (
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Gênero</p>
                    <p className="text-white text-sm font-bold">{character.gender}</p>
                  </div>
                )}
                {character.sexuality && (
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Sexualidade</p>
                    <p className="text-white text-sm font-bold">{character.sexuality}</p>
                  </div>
                )}
                {character.relationship && (
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Status</p>
                    <p className="text-white text-sm font-bold">{character.relationship}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="p-8 pt-4 space-y-3 shrink-0 border-t border-white/5 bg-background-dark">
          {isOwner ? (
            isEditing ? (
              <>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full bg-primary py-5 rounded-[28px] text-white text-[10px] font-black uppercase tracking-[0.3em] shadow-xl shadow-primary/30 active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Salvando...</span>
                    </>
                  ) : 'Salvar Alterações'}
                </button>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="w-full py-4 rounded-2xl bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all border border-white/5"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="w-full bg-primary py-5 rounded-[28px] text-white text-[10px] font-black uppercase tracking-[0.3em] shadow-xl shadow-primary/30 active:scale-95 transition-all"
                >
                  Editar Ficha
                </button>
                <div className="flex space-x-3">
                  <button 
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 py-4 rounded-2xl bg-red-500/10 text-red-400 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all border border-red-500/20 disabled:opacity-50"
                  >
                    {isDeleting ? '...' : 'Excluir'}
                  </button>
                  <button 
                    onClick={handleClose}
                    className="flex-1 py-4 rounded-2xl bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all border border-white/5"
                  >
                    Fechar
                  </button>
                </div>
              </>
            )
          ) : (
            <button 
              onClick={handleClose}
              className="w-full py-5 rounded-[28px] bg-white/5 text-white/60 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all border border-white/5"
            >
              Fechar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};