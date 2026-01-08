import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { X, MapPin, Clock, Sparkles, AlertTriangle, Coins } from 'lucide-react';

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
        const dismissedId = localStorage.getItem('jyp_dismissed');
        if (dismissedId !== data.id) {
          setAppearance(data);
          setIsVisible(true);
        }
      }
    };

    fetchLatestAppearance();

    const channel = supabase
      .channel('jyp_appearances_global')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'jyp_appearances' },
        (payload) => {
          const newAppearance = payload.new as JYPAppearance;
          setAppearance(newAppearance);
          setIsVisible(true);
          localStorage.removeItem('jyp_dismissed');
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
    if (diffMins < 60) return `há ${diffMins} min`;
    if (diffHours < 24) return `há ${diffHours}h`;
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Animated background */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-black/90 via-purple-950/40 to-black/90 backdrop-blur-md"
        onClick={handleDismiss}
      />
      
      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-purple-400/60 rounded-full animate-pulse"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${2 + i * 0.5}s`
            }}
          />
        ))}
      </div>

      {/* Modal */}
      <div className="relative max-w-sm w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/30 via-fuchsia-500/20 to-purple-600/30 rounded-3xl blur-xl" />
        
        <div className="relative bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl border border-purple-500/20 shadow-2xl overflow-hidden">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
          
          {/* Close button */}
          <button 
            onClick={handleDismiss}
            className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
          >
            <X size={16} />
          </button>

          {/* Avatar section */}
          <div className="relative pt-6 pb-4 flex flex-col items-center">
            {/* Avatar glow */}
            <div className="absolute top-4 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl" />
            
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-br from-purple-400 via-fuchsia-500 to-purple-600 rounded-full animate-pulse opacity-60" />
              <img 
                src={JYP_AVATAR} 
                alt="JYP" 
                className="relative w-20 h-20 rounded-full object-cover border-2 border-purple-400/50"
              />
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-zinc-900 rounded-full flex items-center justify-center border border-purple-500/30">
                <span className="text-base">🎭</span>
              </div>
            </div>

            <h2 className="mt-3 text-lg font-bold text-white tracking-wide">
              JYP
            </h2>
            <p className="text-xs text-purple-300/80 flex items-center gap-1">
              <Sparkles size={10} />
              O Bandido Dançarino
              <Sparkles size={10} />
            </p>

            {/* Location & time badges */}
            <div className="flex items-center gap-2 mt-3">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-300">
                <MapPin size={10} />
                {locationNames[appearance.location] || appearance.location}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800/50 border border-zinc-700/50 text-[10px] text-zinc-400">
                <Clock size={10} />
                {formatTime(appearance.appeared_at)}
              </span>
            </div>
          </div>

          {/* Victim alert */}
          {appearance.victim_name && (
            <div className="mx-4 mb-3 p-2.5 rounded-xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={14} className="text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-red-300/90 truncate">
                    <span className="font-semibold">{appearance.victim_name}</span> foi roubado!
                  </p>
                  <p className="text-sm font-bold text-amber-400 flex items-center gap-1">
                    <Coins size={12} />
                    -{appearance.stolen_amount} MKC
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Scene content */}
          <div className="mx-4 mb-4 p-3 rounded-xl bg-zinc-800/30 border border-zinc-700/30 max-h-36 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent">
            <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap italic">
              {appearance.message}
            </p>
          </div>

          {/* Action button */}
          <div className="px-4 pb-4">
            <button
              onClick={handleDismiss}
              className="w-full relative group overflow-hidden rounded-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-600 opacity-90 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-600 blur-md opacity-50 group-hover:opacity-70 transition-opacity" />
              <span className="relative block py-2.5 text-sm font-semibold text-white">
                Entendido
              </span>
            </button>
          </div>

          {/* Bottom accent */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
        </div>
      </div>
    </div>
  );
};

export default JYPGlobalAlert;