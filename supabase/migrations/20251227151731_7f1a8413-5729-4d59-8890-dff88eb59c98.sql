-- Adiciona coluna de profissão aos personagens
ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS profession text;