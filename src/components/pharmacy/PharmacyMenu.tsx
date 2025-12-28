import { useState } from 'react';
import { useAuth } from '@/src/hooks/useAuth';
import { usePharmacy } from '@/src/hooks/usePharmacy';
import { PHARMACY_ITEMS } from '@/src/types/pharmacy';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { toast } from 'sonner';
import { Loader2, ShoppingCart, Pill, Baby, Ticket } from 'lucide-react';

export function PharmacyMenu() {
  const { user, profile, updateMoney, isLunari } = useAuth();
  const { createOrder, pregnancy } = usePharmacy(user?.id);
  const [loading, setLoading] = useState<string | null>(null);

  const handlePurchase = async (item: typeof PHARMACY_ITEMS[0]) => {
    if (!user || !profile) {
      toast.error('Você precisa estar logado');
      return;
    }

    if (item.restrictedTo === 'lunari' && !isLunari) {
      toast.error('Apenas Lunari podem comprar este item');
      return;
    }

    if (profile.money < item.price) {
      toast.error('Dinheiro insuficiente');
      return;
    }

    setLoading(item.id);

    const success = await updateMoney(-item.price);
    if (success) {
      await createOrder(user.id, profile.full_name, item.type, item.name, item.price);
      toast.success(`${item.name} comprado! Aguarde aprovação.`);
    } else {
      toast.error('Erro ao processar compra');
    }

    setLoading(null);
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'pregnancy_test': return <Baby className="h-5 w-5" />;
      case 'scratch_card': return <Ticket className="h-5 w-5" />;
      default: return <Pill className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Menu da Farmácia</h2>
        {profile && (
          <span className="text-money font-semibold">₭{profile.money.toLocaleString()}</span>
        )}
      </div>

      {pregnancy && pregnancy.announced && (
        <div className="pregnancy-tag text-sm">
          🤰 Gravidez - {pregnancy.baby_gender === 'male' ? '♂️' : '♀️'}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {PHARMACY_ITEMS.map((item) => {
          const isRestricted = item.restrictedTo === 'lunari' && !isLunari;
          const cantAfford = profile && profile.money < item.price;

          return (
            <Card key={item.id} className={isRestricted ? 'opacity-50' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-money">₭{item.price}</span>
                  <Button
                    onClick={() => handlePurchase(item)}
                    disabled={loading !== null || isRestricted || !!cantAfford}
                    className="bg-pharmacy hover:bg-pharmacy/90"
                  >
                    {loading === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Comprar
                      </>
                    )}
                  </Button>
                </div>
                {isRestricted && (
                  <p className="text-xs text-muted-foreground mt-2">Apenas para Lunari</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
