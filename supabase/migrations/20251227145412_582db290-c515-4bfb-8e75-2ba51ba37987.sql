-- Tabela de pedidos de comida
CREATE TABLE public.food_orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid NOT NULL,
  customer_name text NOT NULL,
  location text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_price integer NOT NULL DEFAULT 0,
  preparation_time integer NOT NULL DEFAULT 5,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  approved_at timestamp with time zone,
  approved_by uuid,
  ready_at timestamp with time zone
);

-- Índices para performance
CREATE INDEX idx_food_orders_location ON public.food_orders(location);
CREATE INDEX idx_food_orders_status ON public.food_orders(status);
CREATE INDEX idx_food_orders_customer ON public.food_orders(customer_id);

-- Habilitar RLS
ALTER TABLE public.food_orders ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Anyone can view food orders" 
ON public.food_orders 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own orders" 
ON public.food_orders 
FOR INSERT 
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Workers can update orders" 
ON public.food_orders 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their pending orders" 
ON public.food_orders 
FOR DELETE 
USING (auth.uid() = customer_id AND status = 'pending');

-- Adicionar tabela ao realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.food_orders;