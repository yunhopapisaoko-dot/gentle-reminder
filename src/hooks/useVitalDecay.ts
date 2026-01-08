import { useEffect, useRef, useCallback } from 'react';

interface VitalDecayOptions {
  userId: string | null;
  onHungerDecay: (amount: number) => void;
  onThirstDecay: (amount: number) => void;
  hungerIntervalMs?: number; // Default: 30 minutes
  thirstIntervalMs?: number; // Default: 20 minutes
  hungerDecayAmount?: number; // Default: -2
  thirstDecayAmount?: number; // Default: -3
}

/**
 * Hook that periodically decreases hunger and thirst with separate intervals
 * - Hunger decreases by 2 every 30 minutes
 * - Thirst decreases by 3 every 20 minutes
 * - Persists last decay times to prevent exploit on refresh
 */
export function useVitalDecay({
  userId,
  onHungerDecay,
  onThirstDecay,
  hungerIntervalMs = 30 * 60 * 1000, // 30 minutes
  thirstIntervalMs = 20 * 60 * 1000, // 20 minutes
  hungerDecayAmount = -2,
  thirstDecayAmount = -3
}: VitalDecayOptions) {
  const hungerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const thirstIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const performHungerDecay = useCallback(() => {
    if (!userId) return;
    onHungerDecay(hungerDecayAmount);
    localStorage.setItem(`hunger_decay_${userId}`, Date.now().toString());
  }, [userId, onHungerDecay, hungerDecayAmount]);

  const performThirstDecay = useCallback(() => {
    if (!userId) return;
    onThirstDecay(thirstDecayAmount);
    localStorage.setItem(`thirst_decay_${userId}`, Date.now().toString());
  }, [userId, onThirstDecay, thirstDecayAmount]);

  useEffect(() => {
    if (!userId) return;

    // Check for missed hunger decays while offline
    const storedHungerDecay = localStorage.getItem(`hunger_decay_${userId}`);
    if (storedHungerDecay) {
      const lastDecayTime = parseInt(storedHungerDecay, 10);
      const timeSinceLastDecay = Date.now() - lastDecayTime;
      const missedCycles = Math.min(Math.floor(timeSinceLastDecay / hungerIntervalMs), 6); // Cap at 3 hours
      
      if (missedCycles > 0) {
        onHungerDecay(hungerDecayAmount * missedCycles);
        localStorage.setItem(`hunger_decay_${userId}`, Date.now().toString());
      }
    } else {
      localStorage.setItem(`hunger_decay_${userId}`, Date.now().toString());
    }

    // Check for missed thirst decays while offline
    const storedThirstDecay = localStorage.getItem(`thirst_decay_${userId}`);
    if (storedThirstDecay) {
      const lastDecayTime = parseInt(storedThirstDecay, 10);
      const timeSinceLastDecay = Date.now() - lastDecayTime;
      const missedCycles = Math.min(Math.floor(timeSinceLastDecay / thirstIntervalMs), 9); // Cap at 3 hours
      
      if (missedCycles > 0) {
        onThirstDecay(thirstDecayAmount * missedCycles);
        localStorage.setItem(`thirst_decay_${userId}`, Date.now().toString());
      }
    } else {
      localStorage.setItem(`thirst_decay_${userId}`, Date.now().toString());
    }

    // Start separate intervals
    hungerIntervalRef.current = setInterval(performHungerDecay, hungerIntervalMs);
    thirstIntervalRef.current = setInterval(performThirstDecay, thirstIntervalMs);

    return () => {
      if (hungerIntervalRef.current) clearInterval(hungerIntervalRef.current);
      if (thirstIntervalRef.current) clearInterval(thirstIntervalRef.current);
    };
  }, [userId, hungerIntervalMs, thirstIntervalMs, performHungerDecay, performThirstDecay, onHungerDecay, onThirstDecay, hungerDecayAmount, thirstDecayAmount]);
}
