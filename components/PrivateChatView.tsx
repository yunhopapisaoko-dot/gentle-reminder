"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabase';
import { PrivateMessage } from '../src/hooks/usePrivateConversations';
import { ImageCropper } from './ImageCropper';

// Wallpapers disponíveis
const CHAT_WALLPAPERS = [
  { id: 'none', name: 'Sem papel', preview: null },
  { id: 'gradient-1', name: 'Gradiente Roxo', preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'gradient-2', name: 'Gradiente Azul', preview: 'linear-gradient(135deg, #0093E9 0%, #80D0C7 100%)' },
  { id: 'gradient-3', name: 'Gradiente Rosa', preview: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: 'gradient-4', name: 'Gradiente Verde', preview: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { id: 'gradient-5', name: 'Gradiente Dourado', preview: 'linear-gradient(135deg, #f2994a 0%, #f2c94c 100%)' },
  { id: 'custom', name: 'Foto Personalizada', preview: null },
];

interface PrivateChatViewProps {
  conversationId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar: string;
  otherUser: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
  onClose: () => void;
  onMarkAsRead: () => void;
}

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedWallpaper = localStorage.getItem(`chat-wallpaper-${conversationId}`);
    if (savedWallpaper) {
      setWallpaper(savedWallpaper);
    }
  }, [conversationId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from('private_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data as PrivateMessage[]);
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
          setMessages(prev => [...prev, newMsg]);
          if (newMsg.sender_id !== currentUserId) {
            onMarkAsRead();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId, fetchMessages, onMarkAsRead]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    const { error } = await supabase
      .from('private_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: messageContent
      });

    if (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageContent);
    }

    await supabase
      .from('private_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    setSending(false);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 400);
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

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    }
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const handleSelectWallpaper = (wp: typeof CHAT_WALLPAPERS[0]) => {
    if (wp.id === 'none') {
      setWallpaper(null);
      localStorage.removeItem(`chat-wallpaper-${conversationId}`);
      setShowWallpaperModal(false);
    } else if (wp.id === 'custom') {
      fileInputRef.current?.click();
    } else if (wp.preview) {
      setWallpaper(wp.preview);
      localStorage.setItem(`chat-wallpaper-${conversationId}`, wp.preview);
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
      localStorage.setItem(`chat-wallpaper-${conversationId}`, base64);
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

  const getBackgroundStyle = (): React.CSSProperties => {
    if (!wallpaper) return { backgroundColor: '#070210' };
    if (wallpaper.startsWith('linear-gradient')) {
      return { background: wallpaper };
    }
    return { 
      backgroundImage: `url(${wallpaper})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    };
  };

  return (
    <div className={`fixed inset-0 z-[600] bg-background-dark flex flex-col h-[100dvh] overflow-hidden ${isClosing ? 'animate-out slide-out-right' : 'animate-in slide-in-right'}`}>
      
      {/* BACKGROUND LAYER (Full screen wallpaper) */}
      <div className="absolute inset-0 z-0" style={getBackgroundStyle()}>
        {wallpaper && <div className="absolute inset-0 bg-black/40" />}
      </div>

      {/* HEADER (Sticky Glassmorphism) */}
      <div className="pt-12 px-6 pb-6 bg-black/60 backdrop-blur-3xl border-b border-white/5 relative z-20">
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleClose}
            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all"
          >
            <span className="material-symbols-rounded">arrow_back</span>
          </button>
          
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative">
              <img 
                src={otherUser.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} 
                className="w-12 h-12 rounded-2xl object-cover border-2 border-primary/30"
                alt={otherUser.full_name}
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background-dark"></div>
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">{otherUser.full_name}</h3>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">@{otherUser.username}</p>
            </div>
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowOptionsMenu(!showOptionsMenu)}
              className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all"
            >
              <span className="material-symbols-rounded">more_vert</span>
            </button>

            {showOptionsMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowOptionsMenu(false)} />
                <div className="absolute right-0 top-14 w-56 bg-[#1a1a1a] rounded-2xl border border-white/10 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    onClick={() => {
                      setShowOptionsMenu(false);
                      setShowWallpaperModal(true);
                    }}
                    className="w-full px-5 py-4 flex items-center space-x-4 text-left hover:bg-white/5 transition-colors"
                  >
                    <span className="material-symbols-rounded text-primary">wallpaper</span>
                    <span className="text-sm font-bold text-white">Papel de Parede</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-8 relative z-10">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center opacity-40">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <span className="material-symbols-rounded text-4xl text-white/30">chat</span>
            </div>
            <p className="text-sm font-black uppercase tracking-widest mb-2">Nenhuma mensagem</p>
            <p className="text-xs text-white/50">Diga olá para {otherUser.full_name}!</p>
          </div>
        ) : (
          groupedMessages.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-6">
              <div className="flex items-center justify-center py-2">
                <span className="px-4 py-1.5 rounded-full bg-zinc-900/60 backdrop-blur-xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/50 shadow-lg">
                  {group.date}
                </span>
              </div>
              
              {group.messages.map((msg) => {
                const isOwn = msg.sender_id === currentUserId;
                return (
                  <div 
                    key={msg.id}
                    className={`flex items-end space-x-2 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}
                  >
                    <img 
                      src={isOwn ? currentUserAvatar : (otherUser.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default')}
                      className="w-7 h-7 rounded-lg object-cover border border-white/10 shadow-md"
                      alt=""
                    />
                    <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
                      <div className={`px-5 py-3 rounded-2xl shadow-xl border border-white/5 ${
                        isOwn 
                          ? 'bg-primary text-white rounded-br-none' 
                          : 'bg-zinc-800 text-white/90 rounded-bl-none'
                      }`}>
                        <p className="text-sm font-bold leading-relaxed">{msg.content}</p>
                      </div>
                      <span className={`text-[9px] font-black text-white/30 mt-1.5 block uppercase tracking-tighter ${isOwn ? 'text-right' : 'text-left'}`}>
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA (Sticky Glassmorphism) */}
      <div className="px-6 py-8 bg-black/60 backdrop-blur-3xl border-t border-white/5 pb-12 relative z-20">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Sua mensagem..."
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white font-bold placeholder:text-white/10 focus:ring-1 focus:ring-primary transition-all shadow-inner"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-90 transition-all shadow-xl shadow-primary/20"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span className="material-symbols-rounded text-2xl">send</span>
            )}
          </button>
        </div>
      </div>

      {/* WALLPAPER SELECTION MODAL */}
      {showWallpaperModal && (
        <div className="fixed inset-0 z-[700] flex items-end justify-center bg-black/80 backdrop-blur-xl animate-in fade-in">
          <div className="fixed inset-0" onClick={() => setShowWallpaperModal(false)} />
          <div className="relative w-full max-w-lg bg-[#121212] rounded-t-[40px] border-t border-white/10 p-8 animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-8" />
            <h3 className="text-xl font-black text-white uppercase tracking-tight text-center mb-8">Personalizar Chat</h3>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {CHAT_WALLPAPERS.map((wp) => (
                <button
                  key={wp.id}
                  onClick={() => handleSelectWallpaper(wp)}
                  className={`aspect-[3/4] rounded-2xl border-2 overflow-hidden transition-all active:scale-95 ${
                    (wp.id === 'none' && !wallpaper) || 
                    (wp.preview && wallpaper === wp.preview)
                      ? 'border-primary ring-4 ring-primary/20' 
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  {wp.id === 'none' ? (
                    <div className="w-full h-full bg-background-dark flex items-center justify-center">
                      <span className="material-symbols-rounded text-2xl text-white/30">block</span>
                    </div>
                  ) : wp.id === 'custom' ? (
                    <div className="w-full h-full bg-white/5 flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-rounded text-2xl text-white/50">add_photo_alternate</span>
                      <span className="text-[8px] font-black uppercase tracking-wider text-white/30">Mídia</span>
                    </div>
                  ) : (
                    <div className="w-full h-full" style={{ background: wp.preview || undefined }} />
                  )}
                </button>
              ))}
            </div>
            <button onClick={() => setShowWallpaperModal(false)} className="w-full py-4 rounded-2xl bg-white/5 text-white/50 text-sm font-black uppercase tracking-widest active:scale-95 transition-all">Fechar</button>
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
  );
};