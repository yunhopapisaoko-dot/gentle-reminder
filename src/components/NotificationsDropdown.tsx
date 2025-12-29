import React from 'react';
import { Heart, MessageCircle, X, Check, CheckCheck } from 'lucide-react';
import { Notification } from '../hooks/useNotifications';

interface NotificationsDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onNotificationClick?: (postId: string | null) => void;
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClose,
  onNotificationClick
}) => {
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Agora';
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 max-h-[70vh] bg-background-dark/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[300]">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-white">Notificações</h3>
          {unreadCount > 0 && (
            <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button 
              onClick={onMarkAllAsRead}
              className="text-[10px] text-primary hover:text-primary/80 font-bold flex items-center gap-1"
            >
              <CheckCheck className="w-3 h-3" />
              Ler todas
            </button>
          )}
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto max-h-[50vh]">
        {notifications.length === 0 ? (
          <div className="py-12 text-center">
            <span className="material-symbols-rounded text-4xl text-white/20">notifications_off</span>
            <p className="text-white/30 text-xs mt-2">Nenhuma notificação</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div 
              key={notif.id}
              className={`p-3 border-b border-white/5 flex items-start gap-3 hover:bg-white/5 transition-colors cursor-pointer ${!notif.read ? 'bg-primary/5' : ''}`}
              onClick={() => {
                if (!notif.read) onMarkAsRead(notif.id);
                onNotificationClick?.(notif.post_id);
                onClose();
              }}
            >
              {/* Avatar with icon */}
              <div className="relative">
                <img 
                  src={notif.actor_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${notif.actor_id}`}
                  className="w-10 h-10 rounded-full object-cover border border-white/10"
                  alt=""
                />
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${
                  notif.type === 'like' ? 'bg-red-500' : 'bg-primary'
                }`}>
                  {notif.type === 'like' ? (
                    <Heart className="w-2.5 h-2.5 text-white fill-current" />
                  ) : (
                    <MessageCircle className="w-2.5 h-2.5 text-white" />
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white">
                  <span className="font-bold">{notif.actor_name}</span>
                  {notif.type === 'like' ? ' curtiu seu post' : ' comentou no seu post'}
                </p>
                {notif.content && (
                  <p className="text-[11px] text-white/50 mt-0.5 truncate">"{notif.content}"</p>
                )}
                <p className="text-[10px] text-white/30 mt-1">{formatTime(notif.created_at)}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {!notif.read && (
                  <div className="w-2 h-2 bg-primary rounded-full" />
                )}
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(notif.id); }}
                  className="p-1 text-white/20 hover:text-red-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
