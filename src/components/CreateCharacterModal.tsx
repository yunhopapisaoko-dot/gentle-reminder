"use client";

import React, { useState, useRef } from 'react';
import { supabaseService } from '../services/supabaseService';

interface CreateCharacterModalProps {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const ORIGINS = ['Cantor', 'K-pop', 'Ator', 'Modelo', 'Influencer'];

export const CreateCharacterModal: React.FC<CreateCharacterModalProps> = ({ userId, onClose, onSuccess }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    relationship: 'Solteiro(a)',
    gender: 'Masculino',
    sexuality: 'Heterossexual',
    origin: 'K-pop',
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !formData.name || !formData.appearance_name || !formData.group_name) {
      alert("Por favor, preencha todos os campos e selecione uma foto.");
      return;
    }

    setIsSaving(true);
    try {
      const fileName = `char_${Date.now()}.${selectedFile.name.split('.').pop()}`;
      const imageUrl = await supabaseService.uploadFile('avatars', `characters/${userId}/${fileName}`, selectedFile);

      await supabaseService.createCharacter({
        user_id: userId,
        name: formData.name,
        age: parseInt(formData.age) || 0,
        relationship: formData.relationship,
        gender: formData.gender,
        sexuality: formData.sexuality,
        origin: formData.origin,
        appearance_name: formData.appearance_name,
        group_name: formData.group_name.toUpperCase(),
        image_url: imageUrl
      });

      onSuccess();
      handleClose();
    } catch (error: any) {
      alert("Erro ao criar personagem: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
      <div className={`absolute inset-0 bg-black/80 backdrop-blur-xl transition-opacity duration-500 ${isClosing ? 'opacity-0' : 'opacity-100'}`} onClick={handleClose} />
      
      <div className={`relative w-full max-w-md bg-background-dark border border-white/10 rounded-[50px] overflow-hidden shadow-[0_0_100px_rgba(139,92,246,0.2)] flex flex-col max-h-[90vh] ${isClosing ? 'animate-out zoom-out' : 'animate-in zoom-in'}`}>
        <div className="p-8 border-b border-white/5 shrink-0 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
              <span className="material-symbols-rounded text-2xl">person_add</span>
            </div>
            <div>
              <h2 className="text-xl font-black text-white italic uppercase leading-none">Novo Personagem</h2>
              <p className="text-[9px] font-black text-primary uppercase tracking-widest mt-1">Defina sua identidade</p>
            </div>
          </div>
          <button onClick={handleClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40"><span className="material-symbols-rounded">close</span></button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto scrollbar-hide p-8 space-y-6">
          <div className="flex flex-col items-center">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative w-32 h-32 rounded-[40px] bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer overflow-hidden group"
            >
              {previewUrl ? (
                <img src={previewUrl} className="w-full h-full object-cover" alt="preview" />
              ) : (
                <span className="material-symbols-rounded text-4xl text-white/10 group-hover:text-primary transition-colors">add_a_photo</span>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
            </div>
            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mt-4">Foto do Personagem</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[8px] font-black text-white/20 uppercase tracking-widest ml-3">Nome</label>
              <input required type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm focus:ring-primary" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-white/20 uppercase tracking-widest ml-3">Idade</label>
              <input required type="number" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm focus:ring-primary" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[8px] font-black text-white/20 uppercase tracking-widest ml-3">Sexo</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-xs focus:ring-primary appearance-none" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
                <option value="Não-Binário">Não-Binário</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-white/20 uppercase tracking-widest ml-3">Sexualidade</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-xs focus:ring-primary appearance-none" value={formData.sexuality} onChange={e => setFormData({...formData, sexuality: e.target.value})}>
                <option value="Heterossexual">Heterossexual</option>
                <option value="Homossexual">Homossexual</option>
                <option value="Bissexual">Bissexual</option>
                <option value="Pansexual">Pansexual</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[8px] font-black text-white/20 uppercase tracking-widest ml-3">Relacionamento</label>
            <input type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm focus:ring-primary" value={formData.relationship} onChange={e => setFormData({...formData, relationship: e.target.value})} />
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Origem & Detalhes</p>
            
            <div className="space-y-1">
              <label className="text-[8px] font-black text-white/20 uppercase tracking-widest ml-3">Origem</label>
              <div className="flex flex-wrap gap-2">
                {ORIGINS.map(o => (
                  <button 
                    key={o} 
                    type="button" 
                    onClick={() => setFormData({...formData, origin: o})}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${formData.origin === o ? 'bg-primary text-white' : 'bg-white/5 text-white/20'}`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[8px] font-black text-white/20 uppercase tracking-widest ml-3">Nome da Aparência</label>
                <input required placeholder="Ex: Jongho" type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm focus:ring-primary" value={formData.appearance_name} onChange={e => setFormData({...formData, appearance_name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black text-white/20 uppercase tracking-widest ml-3">Função/Grupo</label>
                <input required placeholder="Ex: ATEEZ" type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm focus:ring-primary" value={formData.group_name} onChange={e => setFormData({...formData, group_name: e.target.value})} />
              </div>
            </div>
          </div>

          <button type="submit" disabled={isSaving} className="w-full py-5 rounded-[28px] bg-primary text-white text-[11px] font-black uppercase tracking-[0.4em] shadow-xl active:scale-95 transition-all flex items-center justify-center space-x-3">
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span className="material-symbols-rounded">check</span>
                <span>Finalizar Personagem</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};