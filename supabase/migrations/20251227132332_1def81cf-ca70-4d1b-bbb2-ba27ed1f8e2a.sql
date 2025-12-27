-- Criar tabela para pedidos de tratamento
CREATE TABLE public.treatment_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  disease_id TEXT NOT NULL,
  disease_name TEXT NOT NULL,
  treatment_cost INTEGER NOT NULL,
  cure_time_minutes INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.treatment_requests ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Patients can view their own requests"
ON public.treatment_requests
FOR SELECT
USING (auth.uid() = patient_id);

CREATE POLICY "Workers can view all pending requests"
ON public.treatment_requests
FOR SELECT
USING (true);

CREATE POLICY "Patients can create requests"
ON public.treatment_requests
FOR INSERT
WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Workers can update requests"
ON public.treatment_requests
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own pending requests"
ON public.treatment_requests
FOR DELETE
USING (auth.uid() = patient_id AND status = 'pending');

-- Habilitar Realtime para atualizações em tempo real
ALTER TABLE public.treatment_requests REPLICA IDENTITY FULL;