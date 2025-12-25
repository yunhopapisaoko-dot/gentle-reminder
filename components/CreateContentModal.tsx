
import React, { useState } from 'react';
import { supabaseService } from '../services/supabaseService';

interface CreateContentModalProps {
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

export const CreateContentModal: React.FC<CreateContentModalProps> = ({ onClose, onSuccess, userId }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [step, setStep] = useState<'options' | 'text-post'>('options');
  const [postContent, setPostContent] = useState({ title: '', text: '' });

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 400);
  };

  const handlePublishText = async () => {
    if (!postContent.title.trim() || !postContent.text.trim()) return;
    
    setIsCreating(true);
    try {
      await supabaseService.createPost(userId, postContent.title, postContent.text);
      onSuccess();
      handleClose();
    } catch (error) {
      alert("Erro ao publicar post.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-end justify-center">
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-500 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
        onClick={handleClose}
      />
      
      <div 
        className={`relative w-full max-w-md bg-background-dark rounded-t-[60px] border-t border-white/5 p-10 pb-16 shadow-[0_-30px_100px_rgba(0,0,0,1)] 
          ${isClosing ? 'animate-out slide-out-bottom duration-500' : 'animate-in slide-in-bottom duration-500'}`}
      >
        <div className="w-16 h-1.5 bg-white/10 rounded-full mx-auto mb-12"></div>
        
        {step === 'options' ? (
          <div className="grid grid-cols-1 gap-5 mb-12">
            <button 
              onClick={() => setStep('text-post')}
              className="group flex items-center space-x-6 p-6 rounded-[32px] bg-white/[0.03] border border-white/5 hover:bg-primary/10 hover:border-primary/30 transition-all active:scale-95"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-xl">
                <span className="material-symbols-rounded text-3xl">edit_note</span>
              </div>
              <div className="text-left">
                <h4 className="text-sm font-black text-white uppercase tracking-widest leading-none mb-2">Postar Texto</h4>
                <p className="text-[10px] text-white/30 font-bold">Escreva para a comunidade.</p>
              </div>
            </button>

            <button 
              onClick={() => alert("Upload de mídia em breve!")}
              className="group flex items-center space-x-6 p-6 rounded-[32px] bg-white/[0.03] border border-white/5 hover:bg-secondary/10 hover:border-secondary/30 transition-all active:scale-95"
            >
              <div className="w-14 h-14 rounded-2xl bg-secondary/20 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-all shadow-xl">
                <span className="material-symbols-rounded text-3xl">movie_filter</span>
              </div>
              <div className="text-left">
                <h4 className="text-sm font-black text-white uppercase tracking-widest leading-none mb-2">Foto / Vídeo</h4>
                <p className="text-[10px] text-white/30 font-bold">Em breve integrado ao Storage.</p>
              </div>
            </button>
          </div>
        ) : (
          <div className="space-y-6 mb-12 animate-in slide-in-from-right duration-300">
            <input 
              type="text"
              placeholder="Título do Post"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-black placeholder:text-white/20 focus:ring-primary focus:border-primary"
              value={postContent.title}
              onChange={(e) => setPostContent({...postContent, title: e.target.value})}
            />
            <textarea 
              placeholder="O que você está pensando?"
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-4 text-white text-sm font-medium placeholder:text-white/20 focus:ring-primary focus:border-primary resize-none"
              value={postContent.text}
              onChange={(e) => setPostContent({...postContent, text: e.target.value})}
            />
            <button 
              onClick={handlePublishText}
              disabled={isCreating}
              className="w-full bg-primary py-6 rounded-[32px] text-white text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all"
            >
              {isCreating ? 'Publicando...' : 'Publicar Agora'}
            </button>
          </div>
        )}

        <button 
          onClick={handleClose}
          className="w-full py-6 rounded-[32px] bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-[0.4em] active:scale-95 transition-all border border-white/5"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};
