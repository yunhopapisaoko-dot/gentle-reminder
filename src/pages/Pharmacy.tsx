import { useState } from 'react';
import { PharmacyMenu } from '@/src/components/pharmacy/PharmacyMenu';
import { ScratchCardGame } from '@/src/components/pharmacy/ScratchCardGame';
import { useAuth } from '@/src/hooks/useAuth';
import { usePharmacy } from '@/src/hooks/usePharmacy';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { toast } from 'sonner';
import { Pill, LogIn } from 'lucide-react';

type View = 'menu' | 'scratch';

export default function Pharmacy() {
  const { user, profile, signIn, signUp, updateMoney, isLunari } = useAuth();
  const { scratchCard, usePregnancyTest, announcePregnancy, pregnancy, pregnancyTests, hasActiveContraceptive } = usePharmacy(user?.id);
  const [view, setView] = useState<View>('menu');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = isSignUp 
      ? await signUp(email, password, { full_name: 'Novo Usuário', race: 'lunari' })
      : await signIn(email, password);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(isSignUp ? 'Conta criada!' : 'Login realizado!');
    }
  };

  const handleScratchComplete = async (won: boolean, prizeType: string | null, prizeAmount: number) => {
    if (won && prizeType === 'money') {
      await updateMoney(prizeAmount);
      toast.success(`₭${prizeAmount} adicionados à sua carteira!`);
    } else if (won && prizeType === 'food_voucher') {
      toast.success(`Vale Alimentação de ₭${prizeAmount} adicionado ao inventário!`);
    }
    setView('menu');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full pharmacy-gradient flex items-center justify-center mb-4">
              <Pill className="h-8 w-8 text-pharmacy-foreground" />
            </div>
            <CardTitle>Farmácia</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 rounded-lg border bg-background"
              />
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 rounded-lg border bg-background"
              />
              <Button type="submit" className="w-full bg-pharmacy">
                <LogIn className="h-4 w-4 mr-2" />
                {isSignUp ? 'Criar Conta' : 'Entrar'}
              </Button>
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="w-full text-sm text-muted-foreground"
              >
                {isSignUp ? 'Já tenho conta' : 'Criar nova conta'}
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="pharmacy-gradient p-4 text-pharmacy-foreground">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="h-6 w-6" />
            <h1 className="text-xl font-bold">Farmácia</h1>
          </div>
          <span className="font-medium">₭{profile?.money.toLocaleString() || 0}</span>
        </div>
      </header>

      <main className="container mx-auto p-4">
        {view === 'menu' && <PharmacyMenu />}
        {view === 'scratch' && (
          <ScratchCardGame onScratch={scratchCard} onComplete={handleScratchComplete} />
        )}

        {view === 'menu' && (
          <div className="mt-6">
            <Button variant="outline" onClick={() => setView('scratch')}>
              🎰 Jogar Raspadinha
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
