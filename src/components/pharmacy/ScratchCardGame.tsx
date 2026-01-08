import { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { SCRATCH_PRIZES } from '@/src/types/pharmacy';
import type { ScratchSlot } from '@/src/types/pharmacy';

interface ScratchCardGameProps {
  onScratch: () => Promise<{
    success: boolean;
    slots: ScratchSlot[];
    won: boolean;
    prizeType: 'money' | 'food_voucher' | 'nothing' | null;
    prizeAmount: number;
  }>;
  onComplete: (won: boolean, prizeType: string | null, prizeAmount: number) => void;
}

export function ScratchCardGame({ onScratch, onComplete }: ScratchCardGameProps) {
  const [slots, setSlots] = useState<ScratchSlot[]>([]);
  const [revealed, setRevealed] = useState<boolean[]>([false, false, false]);
  const [isScratching, setIsScratching] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [result, setResult] = useState<{ won: boolean; prizeType: string | null; prizeAmount: number } | null>(null);

  const startGame = async () => {
    setIsScratching(true);
    const res = await onScratch();
    if (res.success) {
      setSlots(res.slots);
      setGameStarted(true);
      setResult({ won: res.won, prizeType: res.prizeType, prizeAmount: res.prizeAmount });
    }
    setIsScratching(false);
  };

  const revealSlot = (index: number) => {
    if (revealed[index]) return;
    
    const newRevealed = [...revealed];
    newRevealed[index] = true;
    setRevealed(newRevealed);

    if (newRevealed.every(r => r) && result) {
      setTimeout(() => {
        onComplete(result.won, result.prizeType, result.prizeAmount);
      }, 1000);
    }
  };

  const revealAll = () => {
    setRevealed([true, true, true]);
    if (result) {
      setTimeout(() => {
        onComplete(result.won, result.prizeType, result.prizeAmount);
      }, 1000);
    }
  };

  if (!gameStarted) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">🎰 Raspadinha da Sorte</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Raspe os 3 campos. Se conseguir 3 símbolos iguais, você ganha!
          </p>
          <div className="text-sm space-y-1">
            <p>💰💰💰 = ₭5.000</p>
            <p>💎💎💎 = ₭3.000</p>
            <p>⭐⭐⭐ = ₭1.000</p>
            <p>🍀🍀🍀 = Vale ₭500</p>
          </div>
          <Button onClick={startGame} disabled={isScratching} className="gold-shimmer text-foreground">
            {isScratching ? 'Preparando...' : 'Começar a Raspar!'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">🎰 Raspadinha</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center gap-4">
          {slots.map((slot, index) => (
            <button
              key={index}
              onClick={() => revealSlot(index)}
              className={`w-20 h-20 rounded-lg text-4xl flex items-center justify-center transition-all ${
                revealed[index] 
                  ? 'bg-card border-2 border-primary' 
                  : 'scratch-card-surface cursor-pointer hover:opacity-80'
              }`}
            >
              {revealed[index] ? slot.symbol : '?'}
            </button>
          ))}
        </div>

        <Button variant="outline" onClick={revealAll} className="w-full">
          Revelar Todos
        </Button>

        {revealed.every(r => r) && result && (
          <div className={`text-center p-4 rounded-lg ${result.won ? 'bg-pharmacy-muted' : 'bg-muted'}`}>
            {result.won ? (
              <p className="text-lg font-bold text-pharmacy">
                🎉 Parabéns! Você ganhou {result.prizeType === 'money' ? `₭${result.prizeAmount}` : `Vale ₭${result.prizeAmount}`}!
              </p>
            ) : (
              <p className="text-muted-foreground">Não foi dessa vez... Tente novamente!</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
