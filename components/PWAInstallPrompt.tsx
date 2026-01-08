"use client";

import React, { useState, useEffect } from 'react';

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('Usuário aceitou a instalação');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-32 left-6 right-6 z-[1000] animate-in slide-in-bottom duration-700">
      <div className="bg-primary/20 backdrop-blur-3xl border border-primary/30 rounded-[32px] p-6 shadow-[0_20px_50px_rgba(139,92,246,0.3)] flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white mb-4 shadow-xl">
          <span className="material-symbols-rounded text-4xl">install_mobile</span>
        </div>
        <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2 italic">MagicTalk no seu celular</h3>
        <p className="text-xs text-white/60 font-medium mb-6">Instale nosso Web App para ter acesso rápido e uma experiência em tela cheia!</p>
        
        <div className="flex w-full space-x-3">
          <button 
            onClick={() => setShowPrompt(false)}
            className="flex-1 py-4 rounded-2xl bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest border border-white/5"
          >
            Agora não
          </button>
          <button 
            onClick={handleInstall}
            className="flex-1 py-4 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
          >
            Instalar App
          </button>
        </div>
      </div>
    </div>
  );
};