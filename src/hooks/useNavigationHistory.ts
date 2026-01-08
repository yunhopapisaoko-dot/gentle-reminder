import { useEffect, useRef, useCallback } from 'react';

export type NavigationState = {
  type: 'tab' | 'chat' | 'houseChat' | 'profile' | 'inventory' | 'roulette' | 'supermarket' | 'allchats' | 'privateChat' | 'createModal' | 'createCharacter' | 'postDetail' | 'subLocation';
  data?: any;
  fromAllChats?: boolean; // Track if opened from AllChatsView
  subLocationName?: string; // Track sub-location name for back navigation
};

export const useNavigationHistory = (
  onBack: (state: NavigationState | null) => boolean // returns true if handled, false if should do default behavior
) => {
  const isInitialized = useRef(false);
  const historyStack = useRef<NavigationState[]>([]);

  const pushState = useCallback((state: NavigationState) => {
    historyStack.current.push(state);
    window.history.pushState(state, '');
  }, []);

  const popState = useCallback(() => {
    historyStack.current.pop();
  }, []);

  const getCurrentState = useCallback((): NavigationState | null => {
    const stack = historyStack.current;
    return stack.length > 0 ? stack[stack.length - 1] : null;
  }, []);

  const getPreviousState = useCallback((): NavigationState | null => {
    const stack = historyStack.current;
    return stack.length > 1 ? stack[stack.length - 2] : null;
  }, []);

  const clearStack = useCallback(() => {
    historyStack.current = [];
  }, []);

  useEffect(() => {
    // Push initial state only once
    if (!isInitialized.current) {
      window.history.pushState({ type: 'tab', data: 'initial' }, '');
      isInitialized.current = true;
    }

    const handlePopState = (event: PopStateEvent) => {
      const currentState = historyStack.current.pop() || null;
      const handled = onBack(currentState);
      if (handled) {
        // Push a new state to keep history available for next back press
        window.history.pushState({ type: 'tab' }, '');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [onBack]);

  return { pushState, popState, getCurrentState, getPreviousState, clearStack };
};
