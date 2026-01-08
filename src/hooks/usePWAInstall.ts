import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

const isStandalone = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
};

export const usePWAInstall = () => {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (isStandalone()) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already captured
    if (deferredPrompt) {
      setCanInstall(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = useCallback(async () => {
    if (isInstalled) {
      alert('O app já está instalado! Abra pelo ícone na sua tela inicial.');
      return false;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('App instalado com sucesso');
      }
      
      deferredPrompt = null;
      setCanInstall(false);
      return outcome === 'accepted';
    }

    // iOS doesn't support beforeinstallprompt
    if (isIOS()) {
      alert('No iPhone/iPad:\n\n1. Toque no ícone de compartilhar (quadrado com seta)\n2. Role para baixo e toque em "Adicionar à Tela de Início"\n3. Toque em "Adicionar"');
    } else {
      // Android Chrome or other browsers
      alert('Para instalar:\n\n1. Toque no menu do navegador (⋮)\n2. Selecione "Instalar aplicativo" ou "Adicionar à tela inicial"');
    }
    
    return false;
  }, [isInstalled]);

  return { canInstall, isInstalled, install, isIOS: isIOS() };
};

// Global capture for early beforeinstallprompt events
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
  });
}
