"use client";

import React, { useState, useRef } from 'react';
import { supabaseService } from '../services/supabaseService';

interface CreateCharacterModalProps {
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

export const CreateCharacterModal: React.FC<CreateCharacterModalProps> = ({ onClose, onSuccess, userId }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    sexuality: '',
    relationship: '',
    appearance_name: '',
    group_name: ''
  });

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

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      alert("Por favor, dê um nome ao seu personagem.");
      return;
    }
    
    setIsCreating(true);
    try {
      let imageUrl = undefined;
      
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `char_${Date.now()}.${fileExt}`;
        const filePath = `${userId}/characters/${fileName}`;
        imageUrl = await supabaseService.uploadFile('avatars', filePath, selectedFile);
      }

      await supabaseService.createCharacter({
        user_id: userId,
        name: formData.name,
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender || null,
        sexuality: formData.sexuality || null,
        relationship: formData.relationship || null,
        appearance_name: formData.appearance_name || null,
        group_name: formData.group_name || null,
        image_url: imageUrl
      });
      
      onSuccess();
      handleClose();
    } catch (error: any) {
      alert("Erro ao criar personagem: " + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-end justify-center">
      <div className={`absolute inset-0 bg-black/70 backdrop-blur-xl transition-opacity duration-500 ${isClosing ? 'opacity-0' : 'opacity-100'}`} onClick={handleClose} />
      
      <div className={`relative w-full max-w-md bg-background-dark rounded-t-[60px] border-t border-white/5 shadow-[0_-30px_100px_rgba(0,0,0,1)] max-h-[90vh] overflow-hidden flex flex-col ${isClosing ? 'animate-out slide-out-bottom duration-500' : 'animate-in slide-in-bottom duration-700'}`}>
        
        {/* Header */}
        <div className="p-8 pb-4 shrink-0">
          <div className="w-16 h-1.5 bg-white/10 rounded-full mx-auto mb-6"></div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight text-center">Criar Personagem</h2>
          <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest text-center mt-2">Ficha de Roleplay</p>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-8 pb-8 space-y-4">
          {/* Avatar */}
          <div className="flex justify-center mb-4">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="relative w-28 h-28 rounded-[36px] bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden group active:scale-95 transition-all"
            >
              {previewUrl ? (
                <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-white/20 group-hover:text-primary transition-colors">
                  <span className="material-symbols-rounded text-3xl">add_photo_alternate</span>
                  <span className="text-[8px] font-black uppercase tracking-widest mt-1">Foto</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="material-symbols-rounded text-white text-2xl">edit</span>
              </div>
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
          </div>

          {/* SEÇÃO 1: Informações Básicas */}
          <div className="pb-2">
            <p className="text-[9px] font-black text-primary/60 uppercase tracking-widest ml-4 mb-3">Informações Básicas</p>
          </div>

          {/* Nome */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-4">Nome do Personagem *</label>
            <input 
              type="text" 
              placeholder="Ex: Hikari Yamamoto"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:ring-primary focus:border-primary placeholder:text-white/10"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          {/* Idade e Gênero */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-4">Idade</label>
              <input 
                type="number" 
                placeholder="18"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:ring-primary placeholder:text-white/10"
                value={formData.age}
                onChange={(e) => setFormData({...formData, age: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-4">Gênero</label>
              <input 
                type="text" 
                placeholder="Feminino"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:ring-primary placeholder:text-white/10"
                value={formData.gender}
                onChange={(e) => setFormData({...formData, gender: e.target.value})}
              />
            </div>
          </div>

          {/* Sexualidade */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-4">Sexualidade</label>
            <input 
              type="text" 
              placeholder="Ex: Bissexual"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:ring-primary placeholder:text-white/10"
              value={formData.sexuality}
              onChange={(e) => setFormData({...formData, sexuality: e.target.value})}
            />
          </div>

          {/* Status de Relacionamento */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-4">Status de Relacionamento</label>
            <input 
              type="text" 
              placeholder="Solteiro(a), Comprometido(a)..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:ring-primary placeholder:text-white/10"
              value={formData.relationship}
              onChange={(e) => setFormData({...formData, relationship: e.target.value})}
            />
          </div>

          {/* SEÇÃO 2: Aparência (Face Claim) */}
          <div className="pt-4 border-t border-white/5">
            <p className="text-[9px] font-black text-primary/60 uppercase tracking-widest ml-4 mb-1">Aparência (Face Claim)</p>
            <p className="text-[8px] text-white/20 font-bold ml-4 mb-3">Quem é a aparência do seu personagem?</p>
          </div>

          {/* Nome da Aparência */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-4">Nome da Aparência</label>
            <input 
              type="text" 
              placeholder="Ex: Jongho, Zendaya, Ariana Grande..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:ring-primary placeholder:text-white/10"
              value={formData.appearance_name}
              onChange={(e) => setFormData({...formData, appearance_name: e.target.value})}
            />
          </div>

          {/* Grupo / Origem da Aparência */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-4">Grupo / Origem da Aparência</label>
            <input 
              type="text" 
              placeholder="Ex: ATEEZ, Atriz, Cantora, BTS..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:ring-primary placeholder:text-white/10"
              value={formData.group_name}
              onChange={(e) => setFormData({...formData, group_name: e.target.value})}
            />
            <p className="text-[8px] text-white/15 font-bold ml-4 mt-1">
              Fichas com o mesmo grupo ficam na mesma pasta
            </p>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="p-8 pt-4 space-y-3 shrink-0 border-t border-white/5">
          <button 
            onClick={handleCreate}
            disabled={isCreating}
            className="w-full bg-primary py-5 rounded-[28px] text-white text-[10px] font-black uppercase tracking-[0.3em] shadow-xl shadow-primary/30 active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isCreating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Criando...</span>
              </>
            ) : 'Criar Personagem'}
          </button>
          <button 
            onClick={handleClose}
            className="w-full py-4 rounded-2xl bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all border border-white/5"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
