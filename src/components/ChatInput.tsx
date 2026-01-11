import React, { useRef, useCallback, memo, useEffect } from 'react';

interface ChatInputProps {
  onSend: (text: string) => void;
  onTypingChange?: (isTyping: boolean) => void;
  isLoading: boolean;
  placeholder: string;
  isOffChatMode: boolean;
  showActionButton: boolean;
  unreadCount: number;
  onActionClick: () => void;
}

export const ChatInput = memo(function ChatInput({
  onSend,
  onTypingChange,
  isLoading,
  placeholder,
  isOffChatMode,
  showActionButton,
  unreadCount,
  onActionClick
}: ChatInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastTypingUpdateRef = useRef<number>(0);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const notifyTyping = useCallback((typing: boolean) => {
    if (isTypingRef.current !== typing) {
      isTypingRef.current = typing;
      onTypingChange?.(typing);
    }
  }, [onTypingChange]);

  const handleInput = useCallback(() => {
    const hasText = !!inputRef.current?.value.trim();
    
    // Throttle typing indicator updates to max once per 1000ms
    const now = Date.now();
    if (now - lastTypingUpdateRef.current < 1000) return;
    lastTypingUpdateRef.current = now;
    
    if (hasText) {
      notifyTyping(true);
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Stop typing indicator after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        notifyTyping(false);
      }, 3000);
    } else {
      notifyTyping(false);
    }
  }, [notifyTyping]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // On mobile, Enter creates new line. On desktop, Enter sends.
    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (e.key === 'Enter' && !isMobile && !e.shiftKey) {
      e.preventDefault();
      handleSendClick();
    }
  }, []);

  const handleSendClick = useCallback(() => {
    const text = inputRef.current?.value.trim();
    if (text && !isLoading) {
      onSend(text);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
      notifyTyping(false);
    }
  }, [isLoading, onSend, notifyTyping]);

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
        ref={inputRef}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="flex-1 bg-transparent border-none text-[15px] focus:ring-0 focus:outline-none placeholder:text-white/20 text-white font-bold py-4 px-2 resize-none min-h-[52px] max-h-[120px] overflow-y-auto"
        rows={1}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        enterKeyHint="send"
      />
      <button 
        onClick={handleSendClick} 
        disabled={isLoading}
        className={`w-13 h-13 rounded-full flex items-center justify-center transition-all ${isLoading ? 'bg-white/5 text-white/10' : isOffChatMode ? 'bg-amber-500 text-white active:scale-90' : 'bg-primary text-white active:scale-90'}`}
      >
        <span className="material-symbols-rounded text-3xl">send</span>
      </button>
    </div>
  );
});
