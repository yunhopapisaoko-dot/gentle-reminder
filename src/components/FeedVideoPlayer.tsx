"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';

interface FeedVideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
}

export const FeedVideoPlayer: React.FC<FeedVideoPlayerProps> = ({ src, poster, autoPlay = true }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.5,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && autoPlay && !hasError) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    }, options);

    observer.observe(video);
    return () => observer.disconnect();
  }, [autoPlay, hasError]);

  const handleCanPlay = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    console.error('[FeedVideoPlayer] Error loading video:', src);
  }, [src]);

  const handleWaiting = useCallback(() => {
    setIsLoading(true);
  }, []);

  const handlePlaying = useCallback(() => {
    setIsLoading(false);
    setIsPlaying(true);
  }, []);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(isNaN(p) ? 0 : p);
    }
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasError(false);
    setIsLoading(true);
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  if (hasError) {
    return (
      <div className="relative w-full aspect-video bg-black/40 flex flex-col items-center justify-center gap-3">
        <span className="material-symbols-rounded text-white/40 text-4xl">error</span>
        <p className="text-white/50 text-xs">Erro ao carregar vídeo</p>
        <button
          onClick={handleRetry}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white/70 text-xs transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-black/40 overflow-hidden group/video">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain cursor-pointer"
        loop
        muted={isMuted}
        playsInline
        preload="metadata"
        onCanPlay={handleCanPlay}
        onCanPlayThrough={handleCanPlay}
        onError={handleError}
        onWaiting={handleWaiting}
        onPlaying={handlePlaying}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onClick={togglePlay}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
          <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Overlay de Pausa */}
      {!isPlaying && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none transition-opacity duration-300">
           <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center animate-in zoom-in">
              <span className="material-symbols-rounded text-white text-4xl ml-1">play_arrow</span>
           </div>
        </div>
      )}

      {/* Controles Customizados */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover/video:opacity-100 transition-opacity duration-300">
        <div className="flex items-center justify-between gap-4">
          <button 
            onClick={toggleMute}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all"
          >
            <span className="material-symbols-rounded text-xl">
              {isMuted ? 'volume_off' : 'volume_up'}
            </span>
          </button>

          {/* Barra de Progresso */}
          <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary shadow-[0_0_10px_#8B5CF6] transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="px-2 py-1 rounded-lg bg-black/40 backdrop-blur-md">
             <span className="text-[10px] font-black text-white/60 tracking-widest uppercase">HD</span>
          </div>
        </div>
      </div>
    </div>
  );
};