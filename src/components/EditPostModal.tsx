"use client";

import React, { useState } from 'react';

interface EditPostModalProps {
  initialTitle: string;
  initialContent: string;
  onSave: (title: string, content: string) => Promise<void>;
  onClose: () => void;
}

export const EditPostModal: React.FC<EditPostModalProps> = ({ initialTitle, initialContent, onSave, onClose }) => {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) return;
    setIsSaving(true);
    await onSave(title, content);
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />
      <div className="relative w-full max-w-md bg-background-dark border border-white/10 rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in duration-400">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Editar Momento</h3>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mt-1">Refine sua postagem</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors">
              <span className="material-symbols-rounded">close</span>
            </button>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-4">Título (Opcional)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título do post..."
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:ring-primary focus:border-primary outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-4">Conteúdo</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="O que você está pensando?"
                rows={4}
                className="w-full bg-white/[0.03] border border-white/10 rounded-3xl px-6 py-4 text-white text-sm focus:ring-primary outline-none transition-all resize-none italic"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={onClose}
                className="flex-1 py-5 rounded-[24px] bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all border border-white/5"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !content.trim()}
                className="flex-1 py-5 rounded-[24px] bg-primary text-white text-[10px] font-black uppercase tracking-[0.3em] shadow-xl shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="material-symbols-rounded text-lg">check_circle</span>
                    Salvar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};