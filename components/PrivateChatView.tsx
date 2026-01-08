"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabase';
import { PrivateMessage } from '../src/hooks/usePrivateConversations';
import { sendPushNotification } from '../src/utils/pushNotifications';
import { ImageCropper } from './ImageCropper';

// Wallpapers modernos pré-definidos
const CHAT_WALLPAPERS = [
  { id: 'none', name: 'Original', preview: null },
  { id: 'gradient-1', name: 'Nebula', preview: 'linear-gradient(135deg, #2D1B69 0%, #120B2E 100%)' },
  { id: 'gradient-2', name: 'Ocean', preview: 'linear-gradient(135deg, #004E92 0%, #000428 100%)' },
  { id: 'gradient-3', name: 'Cyber', preview: 'linear-gradient(135deg, #D946EF 0%, #4C1D95 100%)' },
  { id: 'custom', name: 'Sua Galeria', preview: null },
];

interface PrivateChatViewProps {
  conversationId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar: string;
  currentUserRace?: 'draeven' | 'sylven' | 'lunari';
  otherUser: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
    race?: 'draeven' | 'sylven' | 'lunari';
  };
  onClose: () => void;
  onMarkAsRead: () => void;
}

const RACE_THEMES: Record<string, { color: string, icon: string, bg: string }> = {
  'draeven': { color: 'text-rose-500', icon: 'local_fire_department', bg: 'bg-rose-500/10' },
  'sylven': { color: 'text-emerald-500', icon: 'eco', bg: 'bg-emerald-500/10' },
  'lunari': { color: 'text-cyan-400', icon: 'dark_mode', bg: 'bg-cyan-400/10' },
};

const getRaceTheme = (race?: string) => {
  const key = (race || 'draeven').toLowerCase();
  return RACE_THEMES[key] || RACE_THEMES['draeven'];
};

export const PrivateChatView: React.FC<PrivateChatViewProps> = ({
  conversationId,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  otherUser,
  onClose,
  onMarkAsRead
}) => {
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  const [wallpaper, setWallpaper] = useState<string | null>(null);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<PrivateMessage | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    const savedWallpaper = localStorage.getItem(`chat-hd-wp-${conversationId}`);
    if (savedWallpaper) {
      setWallpaper(savedWallpaper);
    }
  }, [conversationId]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    setShowScrollBottom(!isNearBottom);
  };

  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from('private_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data as PrivateMessage[]);
      
      if (isInitialLoad.current) {
        setTimeout(() => {
          scrollToBottom('auto');
          isInitialLoad.current = false;
        }, 30);
      }
    }
    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
    onMarkAsRead();

    const channel = supabase
      .channel(`private-chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const newMsg = payload.new as PrivateMessage;
          
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          
          if (newMsg.sender_id !== currentUserId) {
            onMarkAsRead();
            if (!showScrollBottom) {
              setTimeout(() => scrollToBottom('smooth'), 50);
            }
          } else {
            setTimeout(() => scrollToBottom('smooth'), 50);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId, fetchMessages, onMarkAsRead, showScrollBottom]);

  const handleLongPressStart = (msg: PrivateMessage) => {
    longPressTimerRef.current = setTimeout(() => {
      setReplyTo(msg);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    const replyData = replyTo ? {
      reply_to_id: replyTo.id,
      reply_to_name: replyTo.sender_id === currentUserId ? currentUserName : otherUser.full_name,
      // Limpa metadados de outras respostas no texto original para evitar replicação de headers
      reply_to_text: (() => {
        const cleanContent = replyTo.content.replace(/^\[reply:@[^|]+\|[^\]]+\]\n/, '');
        return cleanContent.length > 50 ? cleanContent.slice(0, 50) + '...' : cleanContent;
      })()
    } : {};

    const { error } = await supabase
      .from('private_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: messageContent,
        ...replyData
      });

    if (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageContent);
    } else {
      // Send push notification to the other user
      sendPushNotification({
        userId: otherUser.id,
        title: `💬 ${currentUserName}`,
        body: messageContent.length > 100 ? messageContent.slice(0, 100) + '...' : messageContent,
        type: 'private_message',
        conversationId: conversationId,
        url: '/'
      });
    }

    await supabase
      .from('private_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    setReplyTo(null);
    setSending(false);
  };

  const handleClose = () => {
    // Use browser back to return to previous screen
    window.history.back();
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'HOJE';
    if (date.toDateString() === yesterday.toDateString()) return 'ONTEM';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase();
  };

  const handleSelectWallpaper = (wp: typeof CHAT_WALLPAPERS[0]) => {
    if (wp.id === 'none') {
      setWallpaper(null);
      localStorage.removeItem(`chat-hd-wp-${conversationId}`);
      setShowWallpaperModal(false);
    } else if (wp.id === 'custom') {
      fileInputRef.current?.click();
    } else if (wp.preview) {
      setWallpaper(wp.preview);
      localStorage.setItem(`chat-hd-wp-${conversationId}`, wp.preview);
      setShowWallpaperModal(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageToCrop(event.target?.result as string);
        setShowWallpaperModal(false);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setWallpaper(base64);
      localStorage.setItem(`chat-hd-wp-${conversationId}`, base64);
      setImageToCrop(null);
    };
    reader.readAsDataURL(croppedBlob);
  };

  const groupedMessages: { date: string; messages: PrivateMessage[] }[] = [];
  messages.forEach(msg => {
    const dateStr = formatDate(msg.created_at);
    const lastGroup = groupedMessages[groupedMessages.length - 1];
    if (lastGroup && lastGroup.date === dateStr) {
      lastGroup.messages.push(msg);
    } else {
      groupedMessages.push({ date: dateStr, messages: [msg] });
    }
  });

  return (
    <div className="fixed inset-0 z-[700] bg-[#070210] overflow-hidden">
      {/* Painel animado: o fundo fica fixo para evitar mostrar a tela de Destaque durante o slide */}
      <div className={`relative flex flex-col h-[100dvh] overflow-hidden will-change-transform shadow-[-20px_0_60px_rgba(0,0,0,0.8)] ${isClosing ? 'animate-out slide-out-right duration-300' : 'animate-in slide-in-right duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)]'}`}>

        {/* BACKGROUND HD */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {wallpaper ? (
            wallpaper.startsWith('linear-gradient') ? (
              <div className="w-full h-full" style={{ background: wallpaper }} />
            ) : (
              <img src={wallpaper} className="w-full h-full object-cover" alt="BG" />
            )
          ) : (
            <div className="w-full h-full bg-[#070210]" />
          )}
          <div className="absolute inset-0 bg-black/40 backdrop-brightness-[0.8]" />
        </div>

        {/* HEADER */}
        <div className="pt-14 px-6 pb-6 bg-black/40 backdrop-blur-3xl border-b border-white/10 relative z-20 animate-in fade-in slide-in-from-top-4 duration-500 delay-100 fill-mode-both">
          <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={handleClose} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all">
              <span className="material-symbols-rounded">arrow_back</span>
            </button>
            <div className="flex items-center space-x-4">
              <img src={otherUser.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} className="w-12 h-12 rounded-2xl object-cover border-2 border-primary/40 shadow-2xl" alt="" />
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-black text-white leading-none tracking-tight">{otherUser.full_name}</h3>
                  {otherUser.race && (
                    <div className={`flex items-center space-x-1 px-1.5 py-0.5 rounded-md ${getRaceTheme(otherUser.race).bg} border border-white/10`}>
                      <span className={`material-symbols-rounded text-[10px] ${getRaceTheme(otherUser.race).icon}`}>{getRaceTheme(otherUser.race).icon}</span>
                      <span className={`text-[7px] font-black uppercase tracking-widest ${getRaceTheme(otherUser.race).color}`}>{otherUser.race}</span>
                    </div>
                  )}
                </div>
                <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mt-1">Mensagens Privadas</span>
              </div>
            </div>
          </div>
          <button onClick={() => setShowOptionsMenu(!showOptionsMenu)} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 relative">
            <span className="material-symbols-rounded">settings</span>
            {showOptionsMenu && (
              <div className="absolute right-0 top-14 w-60 bg-[#121212]/95 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden animate-in zoom-in duration-200">
                <button onClick={() => { setShowOptionsMenu(false); setShowWallpaperModal(true); }} className="w-full px-6 py-5 flex items-center space-x-4 text-left hover:bg-white/5 border-b border-white/5 transition-colors">
                  <span className="material-symbols-rounded text-primary">wallpaper</span>
                  <span className="text-xs font-black uppercase tracking-widest text-white">Papel de Parede</span>
                </button>
                <button className="w-full px-6 py-5 flex items-center space-x-4 text-left hover:bg-white/5 transition-colors">
                  <span className="material-symbols-rounded text-rose-500">block</span>
                  <span className="text-xs font-black uppercase tracking-widest text-rose-500">Bloquear</span>
                </button>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* CHAT CONTENT */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={`flex-1 overflow-y-auto scrollbar-hide p-6 space-y-10 relative z-10 overscroll-contain ${!loading ? 'messages-fade-in' : 'opacity-0'}`}
      >
        {loading ? (
          <div className="flex items-center justify-center py-32"><div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          groupedMessages.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-8">
              <div className="flex items-center justify-center py-2">
                <span className="px-5 py-2 rounded-2xl bg-black/50 backdrop-blur-md border border-white/5 text-[9px] font-black uppercase tracking-[0.3em] text-white/40 shadow-xl">{group.date}</span>
              </div>
              {group.messages.map((msg) => {
                const isOwn = msg.sender_id === currentUserId;
                return (
                  <div key={msg.id} className={`flex items-end space-x-3 ${isOwn ? 'flex-row-reverse space-x-reverse' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`} onTouchStart={() => handleLongPressStart(msg)} onTouchEnd={handleLongPressEnd} onMouseDown={() => handleLongPressStart(msg)} onMouseUp={handleLongPressEnd} onMouseLeave={handleLongPressEnd}>
                    <div className="flex-shrink-0 mb-1"><img src={isOwn ? currentUserAvatar : (otherUser.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default')} className="w-8 h-8 rounded-xl object-cover border border-white/10 shadow-lg" alt="" /></div>
                    <div className={`max-w-[78%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                      <div className={`px-5 py-3.5 rounded-[26px] shadow-[0_10px_25px_rgba(0,0,0,0.4)] border border-white bg-white text-black transition-transform active:scale-[0.98] ${isOwn ? 'rounded-br-none' : 'rounded-bl-none'} ${replyTo?.id === msg.id ? 'ring-2 ring-primary' : ''}`}>
                        {msg.reply_to_text && (
                          <div className={`mb-3 pl-3 py-1.5 border-l-4 rounded-r-xl bg-black/5 text-[11px] text-black/60 italic overflow-hidden ${isOwn ? 'border-primary' : 'border-zinc-400'}`}>
                            <span className="font-black block not-italic uppercase text-[9px] mb-0.5 opacity-70">@{msg.reply_to_name}</span>
                            <span className="truncate block opacity-80 leading-tight">"{msg.reply_to_text}"</span>
                          </div>
                        )}
                        <p className="text-[14px] font-bold leading-relaxed break-words [overflow-wrap:anywhere] [word-break:break-word]">{msg.content.split('\n').map((line, i) => <span key={i} className="block">{line || '\u00A0'}</span>)}</p>
                      </div>
                      <span className={`text-[8px] font-black text-white/20 mt-2 uppercase tracking-widest ${isOwn ? 'mr-1' : 'ml-1'}`}>{formatTime(msg.created_at)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* SCROLL BUTTON */}
      {showScrollBottom && (
        <button onClick={() => scrollToBottom('smooth')} className="absolute bottom-36 right-6 w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-2xl animate-in zoom-in z-30 active:scale-90 transition-all">
          <span className="material-symbols-rounded">keyboard_double_arrow_down</span>
        </button>
      )}

      {/* INPUT */}
      <div className="px-6 py-8 bg-black/60 backdrop-blur-3xl border-t border-white/10 pb-12 relative z-20 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 fill-mode-both">
        {replyTo && (
          <div className="mb-4 mx-auto max-w-lg animate-in slide-in-from-bottom duration-300">
            <div className="bg-white/10 backdrop-blur-3xl border border-white/20 rounded-[28px] overflow-hidden shadow-2xl flex items-stretch">
              <div className="w-1.5 bg-primary shadow-[0_0_15px_rgba(139,92,246,0.5)]"></div>
              <div className="flex-1 p-4 pr-12 relative">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 text-primary">Respondendo para {replyTo.sender_id === currentUserId ? currentUserName : otherUser.full_name}</p>
                <p className="text-[13px] text-white/60 truncate italic leading-none">
                  "{(() => {
                    // Limpa metadados de outras respostas no texto original para evitar replicação de headers
                    const cleanContent = replyTo.content.replace(/^\[reply:@[^|]+\|[^\]]+\]\n/, '');
                    return cleanContent.length > 60 ? cleanContent.slice(0, 60) + '...' : cleanContent;
                  })()}"
                </p>
                <button onClick={() => setReplyTo(null)} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white/40 active:scale-90 transition-all"><span className="material-symbols-rounded text-xl">close</span></button>
              </div>
            </div>
          </div>
        )}
        <div className="flex items-end space-x-4 max-w-lg mx-auto">
          <textarea 
            value={newMessage} 
            onChange={(e) => setNewMessage(e.target.value)} 
            onKeyDown={(e) => {
              // On mobile (touch devices), Enter creates new line. On desktop, Enter sends (Shift+Enter for new line)
              const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
              if (e.key === 'Enter' && !isMobile && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={replyTo ? "Sua resposta..." : "Digite uma mensagem..."} 
            rows={1}
            style={{ maxHeight: '120px' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 120) + 'px';
            }}
            className="flex-1 bg-white/[0.05] border border-white/10 rounded-[28px] pl-6 pr-6 py-5 text-sm text-white font-bold placeholder:text-white/10 focus:ring-2 focus:ring-primary/40 outline-none transition-all resize-none scrollbar-hide" />
          <button onClick={handleSend} disabled={!newMessage.trim() || sending} className="w-14 h-14 rounded-[22px] bg-primary text-white flex items-center justify-center disabled:opacity-50 active:scale-90 shadow-lg transition-all">
            {sending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <span className="material-symbols-rounded text-2xl">send</span>}
          </button>
        </div>
      </div>

      {/* MODALS */}
      {showWallpaperModal && (
        <div className="fixed inset-0 z-[700] flex items-end justify-center bg-black/80 backdrop-blur-xl animate-in fade-in">
          <div className="fixed inset-0" onClick={() => setShowWallpaperModal(false)} />
          <div className="relative w-full max-w-lg bg-[#0a0a0a] rounded-t-[50px] border-t border-white/10 p-10 animate-in slide-in-from-bottom duration-400">
            <div className="w-16 h-1.5 bg-white/10 rounded-full mx-auto mb-10" />
            <h3 className="text-xl font-black text-white uppercase tracking-tighter text-center mb-10 italic">Personalizar Chat</h3>
            <div className="grid grid-cols-3 gap-5 mb-10">
              {CHAT_WALLPAPERS.map((wp) => (
                <button key={wp.id} onClick={() => handleSelectWallpaper(wp)} className={`relative aspect-[4/6] rounded-3xl border-2 overflow-hidden transition-all active:scale-95 group ${(wp.id === 'none' && !wallpaper) || (wp.preview && wallpaper === wp.preview) ? 'border-primary shadow-[0_0_25px_rgba(139,92,246,0.4)] scale-105' : 'border-white/5 grayscale hover:grayscale-0'}`}>
                  {wp.id === 'none' ? <div className="w-full h-full bg-[#070210] flex items-center justify-center"><span className="material-symbols-rounded text-2xl text-white/20">close</span></div> : wp.id === 'custom' ? <div className="w-full h-full bg-primary/10 flex flex-col items-center justify-center gap-2"><span className="material-symbols-rounded text-3xl text-primary animate-bounce">add_photo_alternate</span><span className="text-[7px] font-black uppercase tracking-widest text-primary">Mídia</span></div> : <div className="w-full h-full" style={{ background: wp.preview || undefined }} />}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
            <button onClick={() => setShowWallpaperModal(false)} className="w-full py-5 rounded-[28px] bg-white text-black text-[10px] font-black uppercase tracking-[0.4em] active:scale-95 shadow-2xl">Confirmar</button>
          </div>
        </div>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
      {imageToCrop && (
        <ImageCropper
          imageSrc={imageToCrop}
          aspectRatio={9 / 16}
          onCropComplete={handleCropComplete}
          onCancel={() => setImageToCrop(null)}
        />
      )}
    </div>
  </div>
  );
};
