-- Tabela para controlar aparições do JYP (bandido) na Pousada
CREATE TABLE public.jyp_appearances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location TEXT NOT NULL DEFAULT 'pousada',
  sub_location TEXT,
  appeared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  victim_id UUID,
  victim_name TEXT,
  stolen_amount INTEGER NOT NULL DEFAULT 0,
  message TEXT
);

-- Enable RLS
ALTER TABLE public.jyp_appearances ENABLE ROW LEVEL SECURITY;

-- Políticas: todos podem ver (para exibir no chat), apenas sistema insere
CREATE POLICY "Anyone can view JYP appearances" 
ON public.jyp_appearances 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert JYP appearances" 
ON public.jyp_appearances 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Index para buscar última aparição
CREATE INDEX idx_jyp_appearances_appeared_at ON public.jyp_appearances(appeared_at DESC);