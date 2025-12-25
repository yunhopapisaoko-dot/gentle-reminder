
import React, { useState, useRef } from 'react';
import { User } from '../types';
import { supabaseService } from '../services/supabaseService';

interface EditProfileModalProps {
  user: User;
  onClose: () => void;
  onUpdate: (updatedUser: User) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onUpdate }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string>('');
  const [formData, setFormData] = useState({
    name: user.name,
    username: user.username,
    bio: user.bio || '',
    avatarUrl: user.avatar
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const handleClose = () => {
    if (isUpdating) return;
    setIsClosing(true);
    setTimeout(onClose, 400);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verificação de tipo
    if (!file.type.startsWith('image/')) {
      alert("Por favor, selecione um arquivo de imagem válido.");
      return;
    }

    setAvatarFile(file);

    // Usar FileReader para um preview mais robusto (Base64)
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFormData(prev => ({
        ...prev,
        avatarUrl: base64String
      }));
    };
    reader.onerror = () => {
      alert("Erro ao ler o arquivo selecionado. Tente novamente.");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.username.trim()) {
      alert("Nome e Username são obrigatórios.");
      return;
    }

    setIsUpdating(true);
    setUpdateStatus('Preparando...');

    try {
      let finalAvatarUrl = user.avatar; // Padrão: usa o avatar atual

      // Se tiver imagem em base64 e não tivermos arquivo, isso é um estado inválido se não era pra ser assim
      if (formData.avatarUrl.startsWith('data:') && !avatarFile) {
        console.warn("Avatar é Base64 mas sem arquivo para upload. Revertendo para avatar original.");
        // fallback para evitar envio de Base64
        finalAvatarUrl = user.avatar;
      } else if (avatarFile) {
        setUpdateStatus('Subindo foto...');
        try {
          finalAvatarUrl = await supabaseService.uploadAvatar(user.id, avatarFile);
        } catch (uploadErr: any) {
          console.error("Erro de upload:", uploadErr);
          alert(`Erro no envio da imagem: ${uploadErr.message}`);
          setIsUpdating(false);
          setUpdateStatus('');
          return;
        }
      } else if (formData.avatarUrl !== user.avatar && !formData.avatarUrl.startsWith('data:')) {
        // Caso seja uma URL normal que mudou (improvável sem arquivo, mas possível se tivéssemos galeria)
        finalAvatarUrl = formData.avatarUrl;
      }

      setUpdateStatus('Salvando perfil...');
      const updates = {
        full_name: formData.name,
        username: formData.username,
        bio: formData.bio,
        avatar_url: finalAvatarUrl
      };

      console.log("Chamando supabaseService.updateProfile com:", user.id, updates);
      await supabaseService.updateProfile(user.id, updates);
      console.log("Retornou de supabaseService.updateProfile");

      onUpdate({
        ...user,
        name: formData.name,
        username: formData.username,
        bio: formData.bio,
        avatar: finalAvatarUrl
      });

      setUpdateStatus('Concluído!');
      setUpdateStatus('Concluído!');
      setTimeout(() => handleClose(), 1000); // Dá um tempinho pra ver o "Concluído" antes de fechar
    } catch (error: any) {
      console.error("Erro fatal no salvamento:", error);
      alert(error.message || "Erro de conexão com o Supabase.");
    } finally {
      setIsUpdating(false);
      setUpdateStatus('');
    }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-end justify-center">
      <div
        className={`absolute inset-0 bg-black/95 backdrop-blur-xl transition-opacity duration-500 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
        onClick={handleClose}
      />

      <div
        className={`relative w-full max-w-md bg-background-dark rounded-t-[60px] border-t border-white/10 p-10 pb-16 shadow-[0_-30px_100px_rgba(0,0,0,1)] 
          ${isClosing ? 'animate-out slide-out-bottom duration-500' : 'animate-in slide-in-bottom duration-500'}`}
      >
        <div className="w-16 h-1.5 bg-white/10 rounded-full mx-auto mb-10"></div>

        <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-8 text-center">Configurar Perfil</h2>

        <div className="space-y-8 mb-10 overflow-y-auto max-h-[55vh] scrollbar-hide px-2">
          <div className="flex flex-col items-center">
            <div
              className={`relative group cursor-pointer ${isUpdating ? 'pointer-events-none' : ''}`}
              onClick={() => !isUpdating && fileInputRef.current?.click()}
            >
              <div className="absolute -inset-3 bg-gradient-to-tr from-primary via-secondary to-primary rounded-[48px] blur-xl opacity-40 group-hover:opacity-80 transition-opacity"></div>
              <div className="relative w-36 h-36 rounded-[42px] bg-background-dark p-1.5 shadow-2xl overflow-hidden">
                {/* O key={formData.avatarUrl} força o React a remontar a imagem quando o SRC muda */}
                <img
                  key={formData.avatarUrl}
                  src={formData.avatarUrl}
                  className="w-full h-full rounded-[38px] object-cover border-2 border-white/10 transition-opacity duration-300"
                  alt="avatar preview"
                />
                {!isUpdating && (
                  <div className="absolute inset-0 bg-black/40 rounded-[38px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-rounded text-white text-4xl">add_a_photo</span>
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mt-6">Alterar Avatar</p>
          </div>

          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-4">Nome de Exibição</label>
              <input
                disabled={isUpdating}
                type="text"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:ring-primary focus:border-primary placeholder:text-white/5 disabled:opacity-50"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-4">Username (@)</label>
              <input
                disabled={isUpdating}
                type="text"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-primary font-black focus:ring-primary focus:border-primary placeholder:text-white/5 disabled:opacity-50"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-4">Bio</label>
              <textarea
                disabled={isUpdating}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-4 text-white text-sm font-medium focus:ring-primary focus:border-primary resize-none placeholder:text-white/5 disabled:opacity-50"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={handleClose}
            disabled={isUpdating}
            className="flex-1 py-5 rounded-[28px] bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-[0.4em] active:scale-95 transition-all border border-white/5 disabled:opacity-30"
          >
            Sair
          </button>
          <button
            onClick={handleSave}
            disabled={isUpdating}
            className={`flex-1 py-5 rounded-[28px] text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all flex items-center justify-center space-x-2 ${isUpdating ? 'bg-white/10 text-white/20' : 'bg-primary text-white shadow-primary/30'}`}
          >
            {isUpdating ? (
              <>
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>{updateStatus || 'Salvando...'}</span>
              </>
            ) : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
};
