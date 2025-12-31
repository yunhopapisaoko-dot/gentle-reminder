import React, { useState } from 'react';
import { TabType, User } from '../types';
import { useNotifications } from '../src/hooks/useNotifications';
import { NotificationsDropdown } from '../src/components/NotificationsDropdown';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  currentUser: User;
  onProfileClick?: () => void;
  onMenuClick?: () => void;
  onPostClick?: (postId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, currentUser, onProfileClick, onMenuClick, onPostClick }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications(currentUser.id);

  return (
    <div className="relative w-full overflow-hidden bg-background-dark border-b border-white/5">
      <div className="absolute inset-0 h-64 pointer-events-none">
        <img
          alt="Night anime cityscape"
          className="w-full h-full object-cover scale-110 opacity-30 blur-[4px]"
          src="https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background-dark/10 via-background-dark/60 to-background-dark"></div>
      </div>
      
      <div className="relative z-10 px-6 pt-10">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <button 
              onClick={onMenuClick}
              className="w-12 h-12 bg-white/5 backdrop-blur-2xl rounded-[20px] flex items-center justify-center text-white border border-white/10 active:scale-90 transition-all hover:bg-white/10"
            >
              <span className="material-symbols-rounded text-2xl">menu</span>
            </button>
            <div className="flex flex-col cursor-pointer" onClick={() => setActiveTab(TabType.Destaque)}>
               <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none drop-shadow-[0_0_15px_rgba(139,92,246,0.3)]">MagicTalk</h1>
               <div className="flex items-center space-x-1.5 mt-1">
                 <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
                 <span className="text-[9px] font-black text-primary/80 uppercase tracking-[0.3em]">Rede Conectada</span>
                 {currentUser.isLeader && (
                   <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)] ml-2">Líder</span>
                 )}
               </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="relative">
              <button 
                onClick={() => {
                  if (!showNotifications && unreadCount > 0) {
                    markAllAsRead();
                  }
                  setShowNotifications(!showNotifications);
                }}
                className="w-11 h-11 bg-white/5 backdrop-blur-2xl rounded-[18px] border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all active:scale-90"
              >
                <span className="material-symbols-rounded">notifications</span>
              </button>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              
              {showNotifications && (
                <NotificationsDropdown
                  notifications={notifications}
                  unreadCount={unreadCount}
                  onMarkAsRead={markAsRead}
                  onMarkAllAsRead={markAllAsRead}
                  onDelete={deleteNotification}
                  onClose={() => setShowNotifications(false)}
                  onNotificationClick={(postId) => postId && onPostClick?.(postId)}
                />
              )}
            </div>
            
            <button 
              onClick={onProfileClick}
              className={`relative p-[1.5px] rounded-full bg-gradient-to-tr ${currentUser.isLeader ? 'from-amber-400 via-yellow-200 to-amber-600' : 'from-primary via-secondary to-primary'} transition-transform active:scale-90 hover:scale-105 shadow-lg shadow-primary/20`}
            >
              <div className="relative w-11 h-11 rounded-full border-2 border-background-dark overflow-hidden bg-surface-purple">
                <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
              </div>
            </button>
          </div>
        </div>

        <div className="flex space-x-2.5 pb-6 overflow-x-auto scrollbar-hide">
          {Object.values(TabType).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-7 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 border backdrop-blur-xl whitespace-nowrap ${
                activeTab === tab 
                  ? 'bg-primary text-white border-primary shadow-[0_10px_30px_rgba(139,92,246,0.4)] translate-y-[-2px]' 
                  : 'bg-white/[0.03] text-white/30 border-white/5 hover:border-white/20 hover:text-white/50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
