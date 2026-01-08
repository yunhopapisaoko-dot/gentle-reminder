"use client";

import React, { useState, useEffect } from 'react';

export const ConnectivityMonitor: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[1000] animate-in slide-in-top">
      <div className="bg-rose-500 text-white px-6 py-3 flex items-center justify-center space-x-3 shadow-2xl">
        <span className="material-symbols-rounded animate-pulse">signal_wifi_off</span>
        <span className="text-[10px] font-black uppercase tracking-widest">
          Você está offline. Algumas funções podem estar limitadas.
        </span>
      </div>
    </div>
  );
};