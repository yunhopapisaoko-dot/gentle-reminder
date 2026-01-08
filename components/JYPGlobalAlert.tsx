import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const JYP_AVATAR = '/jyp-avatar.jpg';

interface JYPAppearance {
  id: string;
  location: string;
  sub_location: string | null;
  appeared_at: string;
  victim_id: string | null;
  victim_name: string | null;
  stolen_amount: number;
  message: string | null;
}

export const JYPGlobalAlert: React.FC = () => {
  const [appearance, setAppearance] = useState<JYPAppearance | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState<string | null>(null);

  useEffect(() => {
    // Buscar última aparição do JYP (nas últimas 24 horas)
    const fetchLatestAppearance = async () => {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('jyp_appearances')
        .select('*')
        .gte('appeared_at', twentyFourHoursAgo)
        .order('appeared_at', { ascending: false })
        .limit(1)
        .single();
      
      if (data && !error) {
        // Verificar se já foi dispensada
        const dismissedId = localStorage.getItem('jyp_dismissed');
        if (dismissedId !== data.id) {
          setAppearance(data);
          setIsVisible(true);
        }
      }
    };

    fetchLatestAppearance();

    // Escutar novas aparições em tempo real
    const channel = supabase
      .channel('jyp_appearances_global')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'jyp_appearances' },
        (payload) => {
          const newAppearance = payload.new as JYPAppearance;
          setAppearance(newAppearance);
          setIsVisible(true);
          localStorage.removeItem('jyp_dismissed'); // Reset dismissed on new appearance
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDismiss = () => {
    if (appearance) {
      localStorage.setItem('jyp_dismissed', appearance.id);
      setDismissed(appearance.id);
    }
    setIsVisible(false);
  };

  if (!isVisible || !appearance || dismissed === appearance.id) {
    return null;
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'agora mesmo';
    if (diffMins < 60) return `há ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    return date.toLocaleDateString('pt-BR');
  };

  const locationNames: Record<string, string> = {
    pousada: 'Pousada',
    praia: 'Praia',
    hospital: 'Hospital',
    restaurante: 'Restaurante',
    padaria: 'Padaria',
    farmacia: 'Farmácia',
    creche: 'Creche',
    supermercado: 'Supermercado'
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 rounded-2xl max-w-md w-full shadow-2xl border border-purple-500/30 overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900/50 to-purple-600/30 px-4 py-3 flex items-center gap-3">
          <div className="relative">
            <img 
              src={JYP_AVATAR} 
              alt="JYP" 
              className="w-12 h-12 rounded-full object-cover border-2 border-purple-400 shadow-lg"
            />
            <span className="absolute -bottom-1 -right-1 text-lg">🎭</span>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white flex items-center gap-2">
              JYP - O Bandido Dançarino
              <span className="material-icons text-purple-400 text-sm">verified</span>
            </h3>
            <p className="text-xs text-purple-300">
              {locationNames[appearance.location] || appearance.location} • {formatTime(appearance.appeared_at)}
            </p>
          </div>
          <button 
            onClick={handleDismiss}
            className="text-zinc-400 hover:text-white transition-colors p-1"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Victim info */}
          {appearance.victim_name && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 mb-3 flex items-center gap-2">
              <span className="material-icons text-red-400 text-lg">warning</span>
              <p className="text-red-300 text-sm">
                <span className="font-bold">{appearance.victim_name}</span> foi roubado em{' '}
                <span className="font-bold text-yellow-400">{appearance.stolen_amount} MKC</span>
              </p>
            </div>
          )}

          {/* Scene */}
          <div className="bg-zinc-800/50 rounded-lg p-3 max-h-[200px] overflow-y-auto">
            <p className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">
              {appearance.message}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 pb-4">
          <button
            onClick={handleDismiss}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white font-medium py-2.5 rounded-lg hover:from-purple-500 hover:to-purple-400 transition-all"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default JYPGlobalAlert;
