-- Remover políticas potencialmente conflitantes
DROP POLICY IF EXISTS "Users can manage own inventory" ON public.inventory;

-- Remover e recriar para garantir consistência
DROP POLICY IF EXISTS "Users can view own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Users can update own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Users can delete own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Authenticated users can insert inventory items" ON public.inventory;
DROP POLICY IF EXISTS "Authenticated users can update inventory quantity" ON public.inventory;

-- Políticas para o próprio usuário visualizar
CREATE POLICY "Users can view own inventory"
ON public.inventory
FOR SELECT
USING (auth.uid() = user_id);

-- Permitir que usuários autenticados (workers) insiram itens no inventário de outros
CREATE POLICY "Authenticated users can insert inventory items"
ON public.inventory
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Permitir que usuários autenticados (workers) atualizem quantidade de itens
CREATE POLICY "Authenticated users can update inventory quantity"
ON public.inventory
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Permitir que usuários deletem itens do próprio inventário
CREATE POLICY "Users can delete own inventory"
ON public.inventory
FOR DELETE
USING (auth.uid() = user_id);