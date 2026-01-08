import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../../supabase';
import { useToast } from '../hooks/use-toast';
import { useState, useRef } from 'react';
import { VideoTrimmer } from './VideoTrimmer';

const MAX_VIDEO_DURATION = 30; // segundos
const MAX_VIDEO_SIZE_NO_COMPRESS = 10 * 1024 * 1024; // 10MB - não comprime se menor

export function CreatePost({ onPostCreated }: { onPostCreated: () => void }) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [processedVideoBlob, setProcessedVideoBlob] = useState<Blob | null>(null);
  const [showVideoTrimmer, setShowVideoTrimmer] = useState(false);
  const [rawVideoFile, setRawVideoFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'Erro', description: 'Imagem muito grande (máx. 5MB)', variant: 'destructive' });
        return;
      }
      // Limpar vídeo se houver
      removeVideo();
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho (máx 50MB antes da compressão)
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: 'Erro', description: 'Vídeo muito grande (máx. 50MB)', variant: 'destructive' });
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('video/')) {
      toast({ title: 'Erro', description: 'Arquivo inválido. Selecione um vídeo.', variant: 'destructive' });
      return;
    }

    // Limpar imagem se houver
    removeImage();

    // Verificar duração do vídeo
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      
      if (video.duration > MAX_VIDEO_DURATION) {
        // Vídeo precisa de trim - abrir modal
        setRawVideoFile(file);
        setShowVideoTrimmer(true);
      } else {
        // Vídeo curto o suficiente - usar diretamente sem compressão se < 10MB
        if (file.size <= MAX_VIDEO_SIZE_NO_COMPRESS) {
          setVideoFile(file);
          setProcessedVideoBlob(file);
          setVideoPreview(URL.createObjectURL(file));
          toast({ title: 'Vídeo adicionado!', description: 'Pronto para publicar.' });
        } else {
          // Vídeo grande, precisa comprimir
          setRawVideoFile(file);
          setShowVideoTrimmer(true);
        }
      }
    };

    video.onerror = () => {
      toast({ title: 'Erro', description: 'Não foi possível ler o vídeo.', variant: 'destructive' });
    };

    video.src = URL.createObjectURL(file);
  };

  const processShortVideo = async (file: File) => {
    // Para vídeos curtos, ainda comprimimos
    setVideoFile(file);
    setProcessedVideoBlob(file);
    setVideoPreview(URL.createObjectURL(file));
    toast({ title: 'Vídeo adicionado!', description: 'Pronto para publicar.' });
  };

  const handleTrimComplete = (blob: Blob, skipCompression?: boolean) => {
    setProcessedVideoBlob(blob);
    setVideoPreview(URL.createObjectURL(blob));
    const ext = skipCompression ? 'mp4' : 'webm';
    const type = skipCompression ? 'video/mp4' : 'video/webm';
    setVideoFile(new File([blob], `video.${ext}`, { type }));
    setShowVideoTrimmer(false);
    setRawVideoFile(null);
    toast({ title: 'Vídeo processado!', description: 'Pronto para publicar.' });
  };

  const handleTrimCancel = () => {
    setShowVideoTrimmer(false);
    setRawVideoFile(null);
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeVideo = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(null);
    setVideoPreview(null);
    setProcessedVideoBlob(null);
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if ((!content.trim() && !imageFile && !processedVideoBlob) || !user) return;
    setIsLoading(true);

    let imageUrl: string | null = null;
    let videoUrl: string | null = null;

    // Upload de imagem
    if (imageFile) {
      const ext = imageFile.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { data, error: uploadError } = await supabase.storage.from('posts').upload(path, imageFile, { cacheControl: '3600', upsert: false });
      if (uploadError) {
        toast({ title: 'Erro', description: 'Falha ao enviar imagem.', variant: 'destructive' });
        setIsLoading(false);
        return;
      }
      const { data: publicData } = supabase.storage.from('posts').getPublicUrl(data.path);
      imageUrl = publicData.publicUrl;
    }

    // Upload de vídeo - preservar formato original
    if (processedVideoBlob) {
      // Detectar extensão e tipo corretos baseado no blob/arquivo
      const isOriginalFormat = videoFile?.type?.startsWith('video/') && !videoFile.name.endsWith('.webm');
      const ext = isOriginalFormat ? (videoFile?.name.split('.').pop() || 'mp4') : 'webm';
      const contentType = isOriginalFormat ? (videoFile?.type || 'video/mp4') : 'video/webm';
      
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { data, error: uploadError } = await supabase.storage.from('videos').upload(path, processedVideoBlob, { 
        cacheControl: '3600', 
        upsert: false,
        contentType: contentType
      });
      if (uploadError) {
        toast({ title: 'Erro', description: 'Falha ao enviar vídeo.', variant: 'destructive' });
        setIsLoading(false);
        return;
      }
      const { data: publicData } = supabase.storage.from('videos').getPublicUrl(data.path);
      videoUrl = publicData.publicUrl;
    }

    const { error } = await supabase.from('posts').insert({ 
      content: content.trim(), 
      user_id: user.id, 
      image_url: imageUrl,
      video_url: videoUrl
    });
    
    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível publicar.', variant: 'destructive' });
    } else { 
      setContent(''); 
      removeImage(); 
      removeVideo();
      toast({ title: 'Publicado!' }); 
      onPostCreated(); 
    }
    setIsLoading(false);
  };

  return (
    <>
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <Avatar><AvatarImage src={profile?.avatar_url || undefined} /><AvatarFallback>{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback></Avatar>
            <div className="flex-1 space-y-3">
              <Textarea placeholder="O que está acontecendo?" value={content} onChange={(e) => setContent(e.target.value)} className="resize-none" />
              
              {/* Image Preview */}
              {imagePreview && (
                <div className="relative inline-block">
                  <img src={imagePreview} alt="Preview" className="max-h-48 rounded-xl object-cover border border-white/10" />
                  <button onClick={removeImage} className="absolute top-2 right-2 w-7 h-7 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-black">
                    <span className="material-symbols-rounded text-lg">close</span>
                  </button>
                </div>
              )}

              {/* Video Preview */}
              {videoPreview && (
                <div className="relative inline-block">
                  <video 
                    src={videoPreview} 
                    className="max-h-48 rounded-xl object-cover border border-white/10" 
                    controls
                    playsInline
                    muted
                  />
                  <button onClick={removeVideo} className="absolute top-2 right-2 w-7 h-7 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-black z-10">
                    <span className="material-symbols-rounded text-lg">close</span>
                  </button>
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded-lg text-white text-xs font-bold flex items-center gap-1">
                    <span className="material-symbols-rounded text-sm">videocam</span>
                    Vídeo
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  {/* Image Button */}
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    disabled={!!videoPreview}
                    className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-rounded">image</span>
                  </button>

                  {/* Video Button */}
                  <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoSelect} className="hidden" />
                  <button 
                    onClick={() => videoInputRef.current?.click()} 
                    disabled={!!imagePreview}
                    className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent hover:bg-accent/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-rounded">videocam</span>
                  </button>
                </div>

                <Button onClick={handleSubmit} disabled={(!content.trim() && !imageFile && !processedVideoBlob) || isLoading}>
                  {isLoading ? '...' : 'Publicar'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Trimmer Modal */}
      {showVideoTrimmer && rawVideoFile && (
        <VideoTrimmer
          videoFile={rawVideoFile}
          maxDuration={MAX_VIDEO_DURATION}
          onTrimComplete={handleTrimComplete}
          onCancel={handleTrimCancel}
        />
      )}
    </>
  );
}
