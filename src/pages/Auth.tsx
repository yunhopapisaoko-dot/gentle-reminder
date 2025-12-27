import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';

type Race = 'draeven' | 'sylven' | 'lunari';

const RACES: { value: Race; label: string; description: string }[] = [
  { value: 'draeven', label: 'Draeven', description: 'Guerreiros ancestrais com força sobrenatural' },
  { value: 'sylven', label: 'Sylven', description: 'Seres conectados à natureza e magia' },
  { value: 'lunari', label: 'Lunari', description: 'Místicos guiados pela luz da lua' },
];

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [race, setRace] = useState<Race>('draeven');
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({ title: 'Erro ao entrar', description: error.message === 'Invalid login credentials' ? 'Email ou senha incorretos' : error.message, variant: 'destructive' });
        } else {
          navigate('/');
        }
      } else {
        if (!fullName.trim() || !username.trim()) {
          toast({ title: 'Campos obrigatórios', description: 'Preencha todos os campos.', variant: 'destructive' });
          setIsLoading(false);
          return;
        }
        const { error } = await signUp(email, password, { full_name: fullName, username, race });
        if (error) {
          toast({ title: 'Erro ao criar conta', description: error.message, variant: 'destructive' });
        } else {
          toast({ title: 'Conta criada!', description: 'Verifique seu email para confirmar.' });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>{isLogin ? 'Entrar' : 'Criar Conta'}</CardTitle>
          <CardDescription>{isLogin ? 'Entre com sua conta' : 'Preencha os dados'}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Nome de Usuário</Label>
                  <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Raça</Label>
                  <div className="grid gap-2">
                    {RACES.map((r) => (
                      <button key={r.value} type="button" onClick={() => setRace(r.value)}
                        className={`p-3 rounded-lg border text-left ${race === r.value ? 'border-primary bg-primary/10' : 'border-border'}`}>
                        <div className="font-medium">{r.label}</div>
                        <div className="text-sm text-muted-foreground">{r.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Carregando...' : isLogin ? 'Entrar' : 'Criar Conta'}</Button>
          </form>
          <button type="button" onClick={() => setIsLogin(!isLogin)} className="mt-4 w-full text-sm text-muted-foreground hover:text-primary">
            {isLogin ? 'Não tem conta? Criar agora' : 'Já tem conta? Entrar'}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
