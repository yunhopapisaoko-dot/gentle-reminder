-- Criar tabela para reservas VIP
CREATE TABLE public.vip_reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location TEXT NOT NULL,
  reserver_id UUID NOT NULL,
  reserver_name TEXT NOT NULL,
  price INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para convidados da reserva VIP
CREATE TABLE public.vip_reservation_guests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID NOT NULL REFERENCES public.vip_reservations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.vip_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_reservation_guests ENABLE ROW LEVEL SECURITY;

-- Políticas para vip_reservations
CREATE POLICY "Anyone can view reservations"
  ON public.vip_reservations FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create reservations"
  ON public.vip_reservations FOR INSERT
  WITH CHECK (auth.uid() = reserver_id);

CREATE POLICY "Workers can update reservations"
  ON public.vip_reservations FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their pending reservations"
  ON public.vip_reservations FOR DELETE
  USING (auth.uid() = reserver_id AND status = 'pending');

-- Políticas para vip_reservation_guests
CREATE POLICY "Anyone can view guests"
  ON public.vip_reservation_guests FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can add guests"
  ON public.vip_reservation_guests FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Índices
CREATE INDEX idx_vip_reservations_location ON public.vip_reservations(location);
CREATE INDEX idx_vip_reservations_status ON public.vip_reservations(status);
CREATE INDEX idx_vip_reservation_guests_reservation ON public.vip_reservation_guests(reservation_id);