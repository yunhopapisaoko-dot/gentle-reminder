import React, { useState } from 'react';
import { Heart, MessageCircle, X, CheckCheck, Trash2, Bell, BellOff, Smartphone } from 'lucide-react';
import { Notification } from '../hooks/useNotifications';
import { usePushNotifications } from '../hooks/usePushNotifications';

interface NotificationsDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onNotificationClick?: (postId: string | null) => void;
  userId?: string | null;
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClose,
  onNotificationClick,
  userId
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const { isSupported, isEnabled, isLoading, permission, togglePushNotifications } = usePushNotifications(userId || null);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 400);
  };

  const handleEnablePush = async () => {
    await togglePushNotifications();
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'AGORA';
    if (mins < 60) return `${mins}M`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}H`;
    const days = Math.floor(hours / 24);
    return `${days}D`;
  };

  return (
    <div className={`fixed inset-0 z-[600] flex flex-col bg-background-dark/95 backdrop-blur-3xl overflow-hidden ${isClosing ? 'animate-out fade-out' : 'animate-in fade-in'}`}>
      
      {/* Header do Painel */}
      <div className={`px-6 pt-16 pb-8 bg-black/40 border-b border-white/10 relative z-20 ${isClosing ? 'animate-out slide-out-top' : 'animate-in slide-in-top duration-500'}`}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleClose}
              className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">Notificações</h2>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mt-2">Suas interações recentes</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
             {unreadCount > 0 && (
               <button 
                onClick={onMarkAllAsRead}
                className="px-5 py-3 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-90 transition-all flex items-center gap-2"
               >
                 <CheckCheck className="w-4 h-4" />
                 Lidas
               </button>
             )}
          </div>
        </div>
      </div>

      {/* Banner para ativar notificações push */}
      {isSupported && !isEnabled && (
        <div className={`mx-6 mt-4 ${isClosing ? 'animate-out slide-out-top' : 'animate-in slide-in-top duration-600'}`}>
          <div 
            onClick={handleEnablePush}
            className="relative overflow-hidden rounded-[24px] p-5 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 cursor-pointer active:scale-[0.98] transition-all group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/20">
                <Smartphone className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  Ativar Notificações
                </h3>
                <p className="text-[10px] font-medium text-white/50 mt-1 leading-relaxed">
                  Receba alertas mesmo com a tela bloqueada
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 group-active:scale-90 transition-all">
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-rounded text-white text-lg">chevron_right</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Banner quando notificações estão ativadas */}
      {isSupported && isEnabled && (
        <div className={`mx-6 mt-4 ${isClosing ? 'animate-out slide-out-top' : 'animate-in slide-in-top duration-600'}`}>
          <div className="flex items-center justify-between p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Bell className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs font-black text-green-400 uppercase tracking-tight">Notificações Ativadas</p>
                <p className="text-[9px] font-medium text-white/40 mt-0.5">Você receberá alertas no celular</p>
              </div>
            </div>
            <button 
              onClick={handleEnablePush}
              disabled={isLoading}
              className="px-3 py-2 rounded-xl bg-white/5 text-[9px] font-black text-white/40 uppercase tracking-wider hover:bg-red-500/10 hover:text-red-400 transition-all"
            >
              {isLoading ? '...' : 'Desativar'}
            </button>
          </div>
        </div>
      )}

      {/* Banner quando permissão foi negada */}
      {isSupported && permission === 'denied' && (
        <div className={`mx-6 mt-4 ${isClosing ? 'animate-out slide-out-top' : 'animate-in slide-in-top duration-600'}`}>
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <BellOff className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-xs font-black text-red-400 uppercase tracking-tight">Bloqueado pelo Navegador</p>
              <p className="text-[9px] font-medium text-white/40 mt-0.5">Permita notificações nas configurações do navegador</p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Notificações */}
      <div className={`flex-1 overflow-y-auto scrollbar-hide p-6 space-y-4 pb-32 ${isClosing ? 'animate-out slide-out-top' : 'animate-in slide-in-top duration-700'}`}>
        {notifications.length === 0 ? (
          <div className="py-32 text-center opacity-30 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/5">
              <span className="material-symbols-rounded text-5xl">notifications_off</span>
            </div>
            <p className="text-sm font-black uppercase tracking-[0.3em]">Nada por aqui</p>
            <p className="text-[10px] font-bold mt-2">Novas interações aparecerão aqui</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div 
              key={notif.id}
              className={`group relative flex items-start gap-5 p-5 rounded-[32px] border transition-all duration-300 cursor-pointer active:scale-[0.98] ${
                !notif.read 
                  ? 'bg-white/[0.04] border-primary/30 shadow-[0_10px_30px_rgba(139,92,246,0.1)]' 
                  : 'bg-white/[0.02] border-white/5 opacity-70 hover:opacity-100'
              }`}
              onClick={() => {
                if (!notif.read) onMarkAsRead(notif.id);
                onNotificationClick?.(notif.post_id);
                handleClose();
              }}
            >
              {/* Avatar com indicador de tipo */}
              <div className="relative flex-shrink-0">
                <img 
                  src={notif.actor_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${notif.actor_id}`}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-white/10 shadow-xl"
                  alt=""
                />
                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center shadow-lg border-2 border-background-dark ${
                  notif.type === 'like' ? 'bg-red-500' : 'bg-primary'
                }`}>
                  {notif.type === 'like' ? (
                    <Heart className="w-3 h-3 text-white fill-current" />
                  ) : (
                    <MessageCircle className="w-3 h-3 text-white" />
                  )}
                </div>
              </div>

              {/* Conteúdo */}
              <div className="flex-1 min-w-0 pr-8">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-black text-white truncate">
                    {notif.actor_name}
                  </p>
                  <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{formatTime(notif.created_at)}</span>
                </div>
                <p className="text-xs font-bold text-white/60 leading-relaxed">
                  {notif.type === 'like' ? 'Curtiu sua publicação' : 'Comentou na sua publicação'}
                </p>
                {notif.content && (
                  <div className="mt-3 p-3 rounded-xl bg-black/40 border border-white/5">
                    <p className="text-[11px] font-medium text-white/40 truncate">"{notif.content}"</p>
                  </div>
                )}
              </div>

              {/* Botão Deletar */}
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(notif.id); }}
                className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 text-white/10 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* Indicador não lido */}
              {!notif.read && (
                <div className="absolute top-6 right-2 w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_#8B5CF6]"></div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Dica no rodapé */}
      <div className={`p-10 text-center ${isClosing ? 'animate-out slide-out-top' : 'animate-in slide-in-top duration-1000'}`}>
         <p className="text-[9px] font-black text-white/10 uppercase tracking-[0.4em]">Toque para ver a publicação</p>
      </div>
    </div>
  );
};