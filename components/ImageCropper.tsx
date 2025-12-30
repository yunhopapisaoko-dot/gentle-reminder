import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropperProps {
  imageSrc: string;
  aspectRatio?: number;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 100,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
  imageSrc,
  aspectRatio = 16 / 9,
  onCropComplete,
  onCancel
}) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, aspectRatio));
  }, [aspectRatio]);

  const getCroppedImg = useCallback(async (): Promise<Blob | null> => {
    const image = imgRef.current;
    if (!image || !completedCrop) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // HD Quality Scaling
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;

    // Configurações para suavização máxima de imagem
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    return new Promise((resolve) => {
      // Exportação em alta qualidade (0.95)
      canvas.toBlob(
        (blob) => resolve(blob),
        'image/jpeg',
        0.95
      );
    });
  }, [completedCrop]);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImg();
      if (croppedBlob) {
        onCropComplete(croppedBlob);
      }
    } catch (error) {
      console.error('Erro ao recortar imagem:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[800] flex items-center justify-center bg-black/98 backdrop-blur-3xl p-6">
      <div className="w-full max-w-2xl bg-[#0a0a0a] rounded-[50px] border border-white/10 p-8 shadow-[0_0_100px_rgba(139,92,246,0.15)] flex flex-col max-h-[90vh]">
        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter text-center mb-8">
          Ajuste de Imagem HD
        </h3>
        
        <div className="relative flex-1 overflow-auto rounded-[32px] bg-black/50 border border-white/5 flex items-center justify-center scrollbar-hide">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspectRatio}
            className="max-w-full"
          >
            <img
              ref={imgRef}
              alt="Crop"
              src={imageSrc}
              onLoad={onImageLoad}
              className="max-w-full max-h-[60vh] object-contain"
              crossOrigin="anonymous"
            />
          </ReactCrop>
        </div>

        <div className="flex space-x-4 mt-10">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 py-5 rounded-[28px] bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-[0.4em] active:scale-95 transition-all border border-white/5 disabled:opacity-30"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing || !completedCrop}
            className="flex-1 py-5 rounded-[28px] bg-primary text-white text-[10px] font-black uppercase tracking-[0.4em] shadow-[0_15px_30px_rgba(139,92,246,0.3)] active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center space-x-3"
          >
            {isProcessing ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span className="material-symbols-rounded text-lg">check_circle</span>
                <span>Confirmar HD</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};