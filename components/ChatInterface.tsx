"use client";

import React, { useState, useEffect, useRef } from 'react';
import { getCommunityChat } from '../services/geminiService';
import { ChatMessage, User } from '../types';
import { MENUS, SUB_LOCATIONS, SubLocation, CURRENT_USER } from '../constants';
import { MenuView } from './MenuView';
import { supabaseService } from '../services/supabaseService';
import { supabase } from '../supabase';

interface ChatInterfaceProps {
  locationContext?: string;
  onClose?: () => void;
}

const RACE_CONFIG: Record<string, { icon: string, color: string }> = {
  'Draeven': { icon: 'local_fire_department', color: 'bg-rose-500/20 text-rose-500 border-rose-500/30' },
  'Sylven': { icon: 'eco', color: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' },
  'Lunari': { icon: 'dark_mode', color: 'bg-cyan-400/20 text-cyan-400 border-cyan-400/30' },
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ locationContext, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentUser, setCurrentUser] = useState<User>(CURRENT_USER);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  const chatRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const profile = await supabaseService.getProfile(session.user.id);
        if (profile) setCurrentUser(profile);
      }
    };
    fetchUser();
    
    try { chatRef.current = getCommunityChat(); } catch (e) {}
    
    setMessages([{ 
      id: 'welcome', 
      role: 'model', 
      text: locationContext ? `[Cenário: ${locationContext}] Bem-vindo ao roleplay! ^_^` : "Olá! Como posso ajudar hoje?" 
    }]);
  }, [locationContext]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { 
      id: Date.now().toString(), 
      role: 'user', 
      text: input,
      author: currentUser 
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    if (chatRef.current) {
      setIsLoading(true);
      try {
        const response = await chatRef.current.sendMessage(input);
        const modelMsg: ChatMessage = { 
          id: (Date.now() + 1).toString(), 
          role: 'model', 
          text: response.response.text() 
        };
        setMessages(prev => [...prev, modelMsg]);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className={`fixed inset-0 z-[100] bg-background-dark flex flex-col h-[100dvh] ${isClosing ? 'animate-out slide-out-bottom' : 'animate-in slide-in-bottom'}`}>
      <div className="pt-12 px-6 pb-6 bg-black/40 backdrop-blur-3xl border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
            <span className="material-symbols-rounded">forum</span>
          </div>
          <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">{locationContext || 'Magic Chat'}</h3>
        </div>
        <button onClick={() => { setIsClosing(true); setTimeout(onClose!, 400); }} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white">
          <span className="material-symbols-rounded">close</span>
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide pb-32">
        {messages.map(msg => (
          <div key={msg.id} className={`flex items-start space-x-3 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
            {/* Avatar do Usuário */}
            <div className="flex-shrink-0">
              <img 
                src={msg.role === 'model' ? 'https://api.dicebear.com/7.x/bottts/svg?seed=miku' : (msg.author?.avatar || currentUser.avatar)} 
                className="w-10 h-10 rounded-xl border border-white/10 shadow-lg object-cover" 
                alt="avatar"
              />
            </div>

            <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              {/* Nome e Tag de Raça */}
              <div className="flex items-center space-x-2 mb-1.5">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                  {msg.role === 'model' ? 'Miku AI' : msg.author?.name}
                </span>
                {msg.role === 'user' && msg.author?.race && RACE_CONFIG[msg.author.race] && (
                  <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${RACE_CONFIG[msg.author.race].color}`}>
                    <span className="material-symbols-rounded text-[10px]">{RACE_CONFIG[msg.author.race].icon}</span>
                    <span>{msg.author.race}</span>
                  </div>
                )}
              </div>

              {/* Balão da Mensagem */}
              <div className={`px-5 py-3.5 rounded-[24px] text-sm font-medium leading-relaxed shadow-xl border border-white/5 ${
                msg.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-white/5 text-white/80 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isLoading && <div className="text-[10px] font-black text-primary uppercase animate-pulse">Miku está digitando...</div>}
      </div>

      <div className="p-6 bg-black/40 backdrop-blur-3xl border-t border-white/10 pb-10">
        <div className="flex items-center space-x-3 bg-white/5 rounded-2xl p-2 pl-5 border border-white/10">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Digite sua ação..."
            className="flex-1 bg-transparent border-none text-white text-sm focus:ring-0 placeholder:text-white/10 font-bold"
          />
          <button onClick={handleSend} className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg active:scale-90">
            <span className="material-symbols-rounded">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};