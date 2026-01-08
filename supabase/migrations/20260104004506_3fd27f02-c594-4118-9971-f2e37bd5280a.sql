-- Tabela para armazenar os chats públicos que o usuário entrou
CREATE TABLE public.user_visited_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  chat_id TEXT NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, chat_id)
);

-- Habilitar RLS
ALTER TABLE public.user_visited_chats ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Users can view their own visited chats"
ON public.user_visited_chats
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own visited chats"
ON public.user_visited_chats
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own visited chats"
ON public.user_visited_chats
FOR DELETE
USING (auth.uid() = user_id);

-- Índice para performance
CREATE INDEX idx_user_visited_chats_user_id ON public.user_visited_chats(user_id);