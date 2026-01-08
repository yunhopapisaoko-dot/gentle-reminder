import React, { useState, useRef, useEffect, useCallback } from 'react';

interface VideoTrimmerProps {
  videoFile: File;
  maxDuration: number; // em segundos
  onTrimComplete: (trimmedBlob: Blob, skipCompression?: boolean) => void;
  onCancel: () => void;
}

export function VideoTrimmer({ videoFile, maxDuration, onTrimComplete, onCancel }: VideoTrimmerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const url = URL.createObjectURL(videoFile);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);
      if (dur <= maxDuration) {
        setStartTime(0);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setStartTime(value);
    if (videoRef.current) {
      videoRef.current.currentTime = value;
    }
  };

  const handleTouchStart = () => setIsDragging(true);
  const handleTouchEnd = () => setIsDragging(false);

  const playPreview = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = startTime;
      videoRef.current.play();
      
      const checkEnd = setInterval(() => {
        if (videoRef.current && videoRef.current.currentTime >= startTime + maxDuration) {
          videoRef.current.pause();
          videoRef.current.currentTime = startTime;
          clearInterval(checkEnd);
        }
      }, 100);
    }
  };

  const endTime = Math.min(startTime + maxDuration, duration);
  const needsTrim = duration > maxDuration;

  const processVideo = useCallback(async () => {
    if (!videoRef.current) return;
    
    setIsProcessing(true);
    
    try {
      const video = videoRef.current;
      const videoNeedsTrim = video.duration > maxDuration;
      
      if (!videoNeedsTrim) {
        onTrimComplete(videoFile, true);
        return;
      }
      
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      const width = video.videoWidth;
      const height = video.videoHeight;
      
      canvas.width = width;
      canvas.height = height;
      
      const stream = canvas.captureStream(30);
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaElementSource(video);
      const dest = audioCtx.createMediaStreamDestination();
      source.connect(dest);
      source.connect(audioCtx.destination);
      
      const combinedStream = new MediaStream([
        ...stream.getVideoTracks(),
        ...dest.stream.getAudioTracks()
      ]);
      
      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 8000000
      });
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      const recordingPromise = new Promise<Blob>((resolve) => {
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          resolve(blob);
        };
      });
      
      video.currentTime = startTime;
      await new Promise(r => video.addEventListener('seeked', r, { once: true }));
      
      mediaRecorder.start();
      video.play();
      
      const renderFrame = () => {
        if (video.currentTime < startTime + maxDuration && !video.paused) {
          ctx.drawImage(video, 0, 0, width, height);
          requestAnimationFrame(renderFrame);
        } else {
          video.pause();
          mediaRecorder.stop();
          audioCtx.close();
        }
      };
      
      renderFrame();
      const blob = await recordingPromise;
      onTrimComplete(blob, false);
      
    } catch (error) {
      console.error('Erro ao processar vídeo:', error);
      onTrimComplete(videoFile, true);
    } finally {
      setIsProcessing(false);
    }
  }, [startTime, maxDuration, onTrimComplete, videoFile]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[800] flex items-start sm:items-center justify-center p-0 sm:p-8 overflow-hidden bg-black">
      {/* Background Dimmer with Blur */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-500" onClick={onCancel} />
      
      <div className="relative w-full max-w-xl bg-[#0a0a0a] border-x border-white/10 sm:rounded-[48px] sm:border overflow-hidden shadow-[0_0_80px_rgba(139,92,246,0.15)] flex flex-col animate-in zoom-in duration-500 h-[100dvh] sm:h-auto sm:max-h-[90vh]">
        
        {/* Glow Decorativo superior */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>

        {/* Header Moderno */}
        <div className="flex items-center justify-between px-8 py-8 sm:py-6 border-b border-white/5 bg-white/[0.02] shrink-0 pt-12 sm:pt-6">
          <button 
            onClick={onCancel} 
            className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all active:scale-90"
          >
            <span className="material-symbols-rounded">close</span>
          </button>
          
          <div className="text-center">
            <h3 className="text-lg font-black text-white italic uppercase tracking-tighter leading-none">Editor de Vídeo</h3>
            <div className="flex items-center justify-center gap-2 mt-1.5">
               <div className="w-1 h-1 bg-primary rounded-full animate-pulse shadow-[0_0_5px_#8B5CF6]"></div>
               <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em]">Corte Arcano</p>
            </div>
          </div>
          
          <button 
            onClick={processVideo} 
            disabled={isProcessing}
            className="px-6 py-3 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest disabled:opacity-50 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            {isProcessing ? (
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span className="material-symbols-rounded text-base">check</span>
                <span>Salvar</span>
              </>
            )}
          </button>
        </div>

        {/* Área de Preview Centralizada */}
        <div className="relative flex-1 min-h-0 bg-black/40 flex items-center justify-center overflow-hidden p-4 sm:p-6">
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              src={videoUrl}
              className="max-w-full max-h-full sm:rounded-[32px] shadow-2xl border border-white/5 object-contain"
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              playsInline
              muted={isDragging}
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Play Button Overlay se pausado */}
            <button 
              onClick={playPreview}
              className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity"
            >
              <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
                <span className="material-symbols-rounded text-5xl">play_arrow</span>
              </div>
            </button>
          </div>
          
          {/* Badge de Duração Original */}
          <div className="absolute top-8 right-8 px-4 py-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl text-white text-[10px] font-black flex items-center gap-2">
            <span className="material-symbols-rounded text-primary text-base">movie</span>
            {formatTime(duration)}
          </div>
        </div>

        {/* Controles de Corte Premium */}
        <div className="px-8 py-10 bg-white/[0.03] border-t border-white/5 shrink-0 pb-16 sm:pb-10">
          {needsTrim ? (
            <div className="space-y-8">
              {/* Display de Tempos */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="text-left">
                    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Início</p>
                    <p className="text-xl font-black text-white tracking-tighter italic">{formatTime(startTime)}</p>
                  </div>
                  <span className="material-symbols-rounded text-white/10">arrow_forward</span>
                  <div className="text-left">
                    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Fim</p>
                    <p className="text-xl font-black text-white tracking-tighter italic">{formatTime(endTime)}</p>
                  </div>
                </div>
                
                <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-2xl">
                  <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-0.5">Duração Final</p>
                  <p className="text-base font-black text-primary tracking-tighter">{maxDuration}s</p>
                </div>
              </div>

              {/* Slider de Timeline Minimalista */}
              <div className="relative pt-2">
                {/* Track de fundo */}
                <div className="h-16 w-full bg-white/5 rounded-[24px] border border-white/10 relative overflow-hidden">
                  {/* Zona selecionada com glow */}
                  <div 
                    className="absolute h-full bg-gradient-to-r from-primary/30 via-primary/10 to-primary/30 border-x-4 border-primary shadow-[0_0_30px_rgba(139,92,246,0.3)] transition-all duration-75"
                    style={{
                      left: `${(startTime / duration) * 100}%`,
                      width: `${(maxDuration / duration) * 100}%`
                    }}
                  >
                    {/* Indicadores de Drag */}
                    <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-4 h-8 bg-primary rounded-full shadow-lg"></div>
                    <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-4 h-8 bg-primary rounded-full shadow-lg"></div>
                  </div>
                  
                  {/* Cursor de Play atual */}
                  {currentTime >= startTime && currentTime <= endTime && (
                    <div 
                      className="absolute h-full w-0.5 bg-white shadow-[0_0_10px_white] z-10 transition-all"
                      style={{ left: `${(currentTime / duration) * 100}%` }}
                    />
                  )}
                </div>

                {/* Input nativo invisível para controle */}
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, duration - maxDuration)}
                  step={0.1}
                  value={startTime}
                  onChange={handleSliderChange}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  onMouseDown={handleTouchStart}
                  onMouseUp={handleTouchEnd}
                  className="absolute inset-x-0 top-2 h-16 opacity-0 cursor-ew-resize z-20"
                />
              </div>

              <button 
                onClick={playPreview}
                className="w-full py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[28px] text-white text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
              >
                <span className="material-symbols-rounded text-lg text-primary">play_circle</span>
                Pré-visualizar Trecho
              </button>
            </div>
          ) : (
            <div className="py-4 text-center">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[28px] p-6 inline-flex flex-col items-center">
                 <span className="material-symbols-rounded text-emerald-400 text-3xl mb-3">auto_awesome</span>
                 <p className="text-sm font-bold text-white mb-1">Vídeo Curto Detectado</p>
                 <p className="text-[10px] text-white/40 font-medium uppercase tracking-widest">
                   Sua mídia tem {formatTime(duration)} e já está pronta para o portal!
                 </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overlay de Processamento Global */}
      {isProcessing && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center gap-6 z-[900]">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-primary/20 rounded-[40px]" />
            <div className="absolute inset-0 w-24 h-24 border-4 border-primary border-t-transparent rounded-[40px] animate-spin shadow-[0_0_30px_rgba(139,92,246,0.3)]" />
            <div className="absolute inset-0 flex items-center justify-center">
               <span className="material-symbols-rounded text-primary text-3xl animate-pulse">magic_button</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xl font-black text-white italic uppercase tracking-tighter">Materializando Mídia</p>
            <p className="text-[9px] font-black text-primary uppercase tracking-[0.4em] mt-2 animate-pulse">Sincronizando com as estrelas...</p>
          </div>
        </div>
      )}
    </div>
  );
}