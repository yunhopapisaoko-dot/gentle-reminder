-- Adicionar coluna para armazenar a cena narrativa gerada pela IA
ALTER TABLE public.treatment_requests 
ADD COLUMN ai_scene TEXT NULL;

-- Habilitar realtime para a tabela treatment_requests
ALTER TABLE public.treatment_requests REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.treatment_requests;