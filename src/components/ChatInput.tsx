import React, { useState, useRef, useCallback, memo } from 'react';

interface ChatInputProps {
  onSend: (text: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  isLoading: boolean;
  placeholder: string;
  isOffChatMode: boolean;
  hasReply: boolean;
  showActionButton: boolean;
  unreadCount: number;
  onActionClick: () => void;
}

export const ChatInput = memo(function ChatInput({
  onSend,
  onTypingStart,
  onTypingStop,
  isLoading,
  placeholder,
  isOffChatMode,
  hasReply,
  showActionButton,
  unreadCount,
  onActionClick
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const lastTypingUpdateRef = useRef<number>(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInput(newValue);
    
    // Throttle typing indicator updates to max once per 800ms for mobile performance
    const now = Date.now();
    if (now - lastTypingUpdateRef.current < 800) return;
    lastTypingUpdateRef.current = now;
    
    if (newValue.trim()) {
      onTypingStart();
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to stop typing indicator after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        onTypingStop();
      }, 2000);
    } else {
      onTypingStop();
    }
  }, [onTypingStart, onTypingStop]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // On mobile (touch devices), Enter creates new line. On desktop, Enter sends (Shift+Enter for new line)
    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (e.key === 'Enter' && !isMobile && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        onSend(input);
        setInput('');
        onTypingStop();
      }
    }
  }, [input, isLoading, onSend, onTypingStop]);

  const handleSendClick = useCallback(() => {
    if (input.trim() && !isLoading) {
      onSend(input);
      setInput('');
      onTypingStop();
    }
  }, [input, isLoading, onSend, onTypingStop]);

  return (
    <div className={`flex items-center space-x-3 rounded-[40px] p-2.5 pl-5 border shadow-2xl ${isOffChatMode ? 'bg-amber-900/50 border-amber-500/30' : 'bg-zinc-900 border-white/10'}`}>
      {showActionButton && !isOffChatMode && (
        <button onClick={onActionClick} className="relative w-13 h-13 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all hover:bg-white/15">
          <span className="material-symbols-rounded text-3xl">add</span>
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center border-2 border-zinc-900 animate-pulse">
              <span className="text-[8px] font-black text-white">{unreadCount}</span>
            </div>
          )}
        </button>
      )}
      <textarea 
        value={input} 
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="flex-1 bg-transparent border-none text-[15px] focus:ring-0 focus:outline-none placeholder:text-white/20 text-white font-bold py-4 px-2 resize-none min-h-[52px] max-h-[120px] overflow-y-auto"
        rows={1}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />
      <button 
        onClick={handleSendClick} 
        disabled={isLoading || !input.trim()} 
        className={`w-13 h-13 rounded-full flex items-center justify-center transition-all ${isLoading || !input.trim() ? 'bg-white/5 text-white/10' : isOffChatMode ? 'bg-amber-500 text-white active:scale-90' : 'bg-primary text-white active:scale-90'}`}
      >
        <span className="material-symbols-rounded text-3xl">send</span>
      </button>
    </div>
  );
});
