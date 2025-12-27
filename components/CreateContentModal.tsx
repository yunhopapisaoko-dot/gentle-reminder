import React, { useState, useRef } from 'react';
import { supabaseService } from '../services/supabaseService';

interface CreateContentModalProps {
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

export const CreateContentModal: React.FC<CreateContentModalProps> = ({ onClose, onSuccess, userId }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [step, setStep] = useState<'options' | 'editor'>('options');
  const [postContent, setPostContent] = useState({ title: '', text: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 400);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setStep('editor');
    }
  };

  const handlePublish = async () => {
    if (!postContent.title.trim() || !postContent.text.trim()) {
      alert("Por favor, preencha o título e o texto.");
      return;
    }
    
    setIsCreating(true);
    try {
      let imageUrl = undefined;
      
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `post_${Date.now()}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;
        imageUrl = await supabaseService.uploadFile('posts', filePath, selectedFile);
      }

      await supabaseService.createPost(userId, postContent.title, postContent.text, imageUrl);
      onSuccess();
      handleClose();
    } catch (error: any) {
      alert("Erro ao publicar: " + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-end justify-center">
      <div className={`absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-500 ${isClosing ? 'opacity-0' : 'opacity-100'}`} onClick={handleClose} />
      
      <div className={`relative w-full max-w-md bg-background-dark rounded-t-[60px] border-t border-white/5 p-10 pb-16 shadow-[0_-30px_100px_rgba(0,0,0,1)] ${isClosing ? 'animate-out slide-out-bottom duration-500' : 'animate-in slide-in-bottom duration-500'}`}>
        <div className="w-16 h-1.5 bg-white/10 rounded-full mx-auto mb-12"></div>
        
        {step === 'options' ? (
          <div className="grid grid-cols-1 gap-5 mb-12">
            <button onClick={() => setStep('editor')} className="group flex items-center space-x-6 p-6 rounded-[32px] bg-white/[0.03] border border-white/5 hover:bg-primary/10 transition-all active:scale-95">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                <span className="material-symbols-rounded text-3xl">edit_note</span>
              </div>
              <div className="text-left">
                <h4 className="text-sm font-black text-white uppercase tracking-widest leading-none mb-2">Postar Texto</h4>
                <p className="text-[10px] text-white/30 font-bold">Escreva para a comunidade.</p>
              </div>
            </button>

            <button onClick={() => fileInputRef.current?.click()} className="group flex items-center space-x-6 p-6 rounded-[32px] bg-white/[0.03] border border-white/5 hover:bg-secondary/10 transition-all active:scale-95">
              <div className="w-14 h-14 rounded-2xl bg-secondary/20 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-all">
                <span className="material-symbols-rounded text-3xl">add_photo_alternate</span>
              </div>
              <div className="text-left">
                <h4 className="text-sm font-black text-white uppercase tracking-widest leading-none mb-2">Foto da Galeria</h4>
                <p className="text-[10px] text-white/30 font-bold">Selecione uma imagem do seu dispositivo.</p>
              </div>
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
          </div>
        ) : (
          <div className="space-y-6 mb-12 animate-in slide-in-right duration-300 overflow-y-auto max-h-[60vh] scrollbar-hide px-1">
            {previewUrl && (
              <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-white/10 mb-4">
                <img src={previewUrl} className="w-full h-full object-cover" alt="preview" />
                <button onClick={() => {setSelectedFile(null); setPreviewUrl(null);}} className="absolute top-2 right-2 bg-black/60 p-2 rounded-full text-white"><span className="material-symbols-rounded">close</span></button>
              </div>
            )}
            <input 
              type="text"
              placeholder="Título do Post"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-black focus:ring-primary"
              value={postContent.title}
              onChange={(e) => setPostContent({...postContent, title: e.target.value})}
            />
            <textarea 
              placeholder="O que você está pensando?"
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-4 text-white text-sm focus:ring-primary resize-none"
              value={postContent.text}
              onChange={(e) => setPostContent({...postContent, text: e.target.value})}
            />
            <button 
              onClick={handlePublish}
              disabled={isCreating}
              className="w-full bg-primary py-6 rounded-[32px] text-white text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all flex items-center justify-center space-x-2"
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Publicando...</span>
                </>
              ) : 'Publicar Agora'}
            </button>
          </div>
        )}

        <button onClick={handleClose} className="w-full py-6 rounded-[32px] bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-[0.4em] active:scale-95 transition-all border border-white/5">Cancelar</button>
      </div>
    </div>
  );
};