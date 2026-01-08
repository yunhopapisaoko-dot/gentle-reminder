-- Adicionar coluna featured_at para controlar destaque de fotos por tempo
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS featured_at timestamp with time zone DEFAULT NULL;

-- Criar índice para buscar posts em destaque mais rapidamente
CREATE INDEX IF NOT EXISTS idx_posts_featured_at ON public.posts (featured_at DESC NULLS LAST);

-- Política para permitir que usuários atualizem o destaque dos próprios posts
CREATE POLICY "Users can update own posts featured status" 
ON public.posts 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);