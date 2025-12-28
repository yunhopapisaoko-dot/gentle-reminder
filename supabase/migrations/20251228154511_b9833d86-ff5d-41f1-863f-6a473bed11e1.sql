-- Tabela para testes de gravidez usados
CREATE TABLE public.pregnancy_tests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  result text NOT NULL CHECK (result IN ('positive', 'negative')),
  used_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '3 days'),
  announced boolean NOT NULL DEFAULT false
);

-- Tabela para gravidez ativa
CREATE TABLE public.pregnancies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ends_at timestamp with time zone NOT NULL,
  baby_gender text NOT NULL CHECK (baby_gender IN ('male', 'female')),
  announced boolean NOT NULL DEFAULT false,
  delivered boolean NOT NULL DEFAULT false,
  created_from_test_id uuid REFERENCES public.pregnancy_tests(id) ON DELETE SET NULL
);

-- Tabela para raspadinhas
CREATE TABLE public.scratch_cards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slots jsonb NOT NULL DEFAULT '[]'::jsonb,
  prize_type text CHECK (prize_type IN ('money', 'food_voucher', 'nothing')),
  prize_amount integer DEFAULT 0,
  won boolean NOT NULL DEFAULT false,
  scratched_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela para pedidos da farmácia
CREATE TABLE public.pharmacy_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  item_type text NOT NULL CHECK (item_type IN ('pregnancy_test', 'scratch_card', 'contraceptive', 'medicine')),
  item_name text NOT NULL,
  item_price integer NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'delivered', 'cancelled')),
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela para efeito de anticoncepcional
CREATE TABLE public.contraceptive_effects (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  UNIQUE(user_id)
);

-- Tabela para bebês entregues (notificação para hospital)
CREATE TABLE public.baby_deliveries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mother_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mother_name text NOT NULL,
  baby_gender text NOT NULL CHECK (baby_gender IN ('male', 'female')),
  pregnancy_id uuid REFERENCES public.pregnancies(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed')),
  processed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  processed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pregnancy_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pregnancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scratch_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contraceptive_effects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.baby_deliveries ENABLE ROW LEVEL SECURITY;

-- Policies para pregnancy_tests
CREATE POLICY "Users can view their own pregnancy tests" ON public.pregnancy_tests 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own pregnancy tests" ON public.pregnancy_tests 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own pregnancy tests" ON public.pregnancy_tests 
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies para pregnancies
CREATE POLICY "Users can view their own pregnancies" ON public.pregnancies 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view announced pregnancies" ON public.pregnancies 
  FOR SELECT USING (announced = true);
CREATE POLICY "Users can insert their own pregnancies" ON public.pregnancies 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own pregnancies" ON public.pregnancies 
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies para scratch_cards
CREATE POLICY "Users can view their own scratch cards" ON public.scratch_cards 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own scratch cards" ON public.scratch_cards 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies para pharmacy_orders
CREATE POLICY "Users can view their own orders" ON public.pharmacy_orders 
  FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Workers can view all orders" ON public.pharmacy_orders 
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create their own orders" ON public.pharmacy_orders 
  FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Workers can update orders" ON public.pharmacy_orders 
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete their pending orders" ON public.pharmacy_orders 
  FOR DELETE USING (auth.uid() = customer_id AND status = 'pending');

-- Policies para contraceptive_effects
CREATE POLICY "Users can view their own contraceptive effects" ON public.contraceptive_effects 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own contraceptive effects" ON public.contraceptive_effects 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own contraceptive effects" ON public.contraceptive_effects 
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies para baby_deliveries
CREATE POLICY "Mothers can view their own deliveries" ON public.baby_deliveries 
  FOR SELECT USING (auth.uid() = mother_id);
CREATE POLICY "Hospital workers can view all deliveries" ON public.baby_deliveries 
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "System can insert deliveries" ON public.baby_deliveries 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Hospital workers can update deliveries" ON public.baby_deliveries 
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Enable realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.pharmacy_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.baby_deliveries;