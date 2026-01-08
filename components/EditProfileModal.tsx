import React, { useState, useRef } from 'react';
import { User } from '../types';
import { supabaseService } from '../services/supabaseService';
import { ImageCropper } from './ImageCropper';

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
    avatarUrl: user.avatar,
    bannerUrl: user.banner || '',
    race: (user.race || 'draeven').toLowerCase() as 'draeven' | 'sylven' | 'lunari'
  });
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  
  // Estado para cropping
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [cropperType, setCropperType] = useState<'avatar' | 'banner' | null>(null);

  const handleClose = () => {
    if (isUpdating) return;
    setIsClosing(true);
    setTimeout(onClose, 400);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Por favor, selecione um arquivo de imagem válido.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setCropperImage(base64String);
      setCropperType(type);
    };
    reader.onerror = () => {
      alert("Erro ao ler o arquivo selecionado. Tente novamente.");
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    const file = new File([croppedBlob], `cropped_${Date.now()}.jpg`, { type: 'image/jpeg' });
    
    if (cropperType === 'avatar') {
      setAvatarFile(file);
      const url = URL.createObjectURL(croppedBlob);
      setFormData(prev => ({ ...prev, avatarUrl: url }));
    } else if (cropperType === 'banner') {
      setBannerFile(file);
      const url = URL.createObjectURL(croppedBlob);
      setFormData(prev => ({ ...prev, bannerUrl: url }));
    }
    
    setCropperImage(null);
    setCropperType(null);
  };

  const handleCropCancel = () => {
    setCropperImage(null);
    setCropperType(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.username.trim()) {
      alert("Nome e Username são obrigatórios.");
      return;
    }

    setIsUpdating(true);
    setUpdateStatus('Preparando...');

    try {
      let finalAvatarUrl = user.avatar;
      let finalBannerUrl = user.banner || '';

      // Upload avatar se tiver novo arquivo
      if (avatarFile) {
        setUpdateStatus('Subindo foto de perfil...');
        try {
          finalAvatarUrl = await supabaseService.uploadAvatar(user.id, avatarFile);
        } catch (uploadErr: any) {
          console.error("Erro de upload avatar:", uploadErr);
          alert(`Erro no envio da imagem: ${uploadErr.message}`);
          setIsUpdating(false);
          setUpdateStatus('');
          return;
        }
      }

      // Upload banner se tiver novo arquivo
      if (bannerFile) {
        setUpdateStatus('Subindo banner...');
        try {
          finalBannerUrl = await supabaseService.uploadBanner(user.id, bannerFile);
        } catch (uploadErr: any) {
          console.error("Erro de upload banner:", uploadErr);
          alert(`Erro no envio do banner: ${uploadErr.message}`);
          setIsUpdating(false);
          setUpdateStatus('');
          return;
        }
      }

      setUpdateStatus('Salvando perfil...');
      const updates = {
        full_name: formData.name,
        username: formData.username,
        bio: formData.bio,
        avatar_url: finalAvatarUrl,
        banner_url: finalBannerUrl || undefined,
        race: formData.race
      };

      await supabaseService.updateProfile(user.id, updates);

      onUpdate({
        ...user,
        name: formData.name,
        username: formData.username,
        bio: formData.bio,
        avatar: finalAvatarUrl,
        banner: finalBannerUrl || undefined,
        race: formData.race
      });

      setUpdateStatus('Concluído!');
      setTimeout(() => handleClose(), 1000);
    } catch (error: any) {
      console.error("Erro fatal no salvamento:", error);
      alert(error.message || "Erro de conexão com o Supabase.");
    } finally {
      setIsUpdating(false);
      setUpdateStatus('');
    }
  };

  return (
    <>
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
            {/* Banner Editor */}
            <div className="space-y-3">
              <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-4">Banner do Perfil</label>
              <div
                className={`relative group cursor-pointer ${isUpdating ? 'pointer-events-none' : ''}`}
                onClick={() => !isUpdating && bannerInputRef.current?.click()}
              >
                <div className="relative w-full h-28 rounded-3xl bg-white/5 border border-white/10 overflow-hidden">
                  {formData.bannerUrl ? (
                    <img
                      key={formData.bannerUrl}
                      src={formData.bannerUrl}
                      className="w-full h-full object-cover transition-opacity duration-300"
                      alt="banner preview"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                      <span className="material-symbols-rounded text-white/20 text-4xl">panorama</span>
                    </div>
                  )}
                  {!isUpdating && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center space-x-2 text-white">
                        <span className="material-symbols-rounded text-2xl">add_a_photo</span>
                        <span className="text-xs font-bold">Alterar Banner</span>
                      </div>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={bannerInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'banner')}
                />
              </div>
            </div>

            {/* Avatar Editor */}
            <div className="flex flex-col items-center">
              <div
                className={`relative group cursor-pointer ${isUpdating ? 'pointer-events-none' : ''}`}
                onClick={() => !isUpdating && avatarInputRef.current?.click()}
              >
                <div className="absolute -inset-3 bg-gradient-to-tr from-primary via-secondary to-primary rounded-[48px] blur-xl opacity-40 group-hover:opacity-80 transition-opacity"></div>
                <div className="relative w-28 h-28 rounded-[36px] bg-background-dark p-1.5 shadow-2xl overflow-hidden">
                  <img
                    key={formData.avatarUrl}
                    src={formData.avatarUrl}
                    className="w-full h-full rounded-[32px] object-cover border-2 border-white/10 transition-opacity duration-300"
                    alt="avatar preview"
                  />
                  {!isUpdating && (
                    <div className="absolute inset-0 bg-black/40 rounded-[32px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-rounded text-white text-3xl">add_a_photo</span>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={avatarInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'avatar')}
                />
              </div>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mt-4">Alterar Avatar</p>
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

              {/* Race Selector */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-4">Raça</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'draeven', name: 'Draeven', icon: 'local_fire_department', color: 'rose' },
                    { id: 'sylven', name: 'Sylven', icon: 'eco', color: 'emerald' },
                    { id: 'lunari', name: 'Lunari', icon: 'dark_mode', color: 'cyan' }
                  ].map((race) => (
                    <button
                      key={race.id}
                      type="button"
                      disabled={isUpdating}
                      onClick={() => setFormData({ ...formData, race: race.id as 'draeven' | 'sylven' | 'lunari' })}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center space-y-2 disabled:opacity-50 ${
                        formData.race === race.id 
                          ? `bg-${race.color}-500/20 border-${race.color}-500 text-${race.color}-400` 
                          : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'
                      }`}
                    >
                      <span className={`material-symbols-rounded text-2xl ${formData.race === race.id ? `text-${race.color}-400` : ''}`}>{race.icon}</span>
                      <span className="text-[9px] font-black uppercase tracking-widest">{race.name}</span>
                    </button>
                  ))}
                </div>
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

      {/* Image Cropper Modal */}
      {cropperImage && cropperType && (
        <ImageCropper
          imageSrc={cropperImage}
          aspectRatio={cropperType === 'banner' ? 16 / 9 : 1}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </>
  );
};
