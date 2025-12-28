-- Permitir que usuários autenticados insiram itens no inventário de outros usuários (para entregas)
CREATE POLICY "Authenticated users can insert inventory items" 
ON public.inventory 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Permitir que usuários autenticados atualizem quantidade no inventário de outros usuários (para entregas)
CREATE POLICY "Authenticated users can update inventory quantity" 
ON public.inventory 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);