-- Criar nova política que permite usuários autenticados E o sistema ABBY
-- O UUID fixo da ABBY é '00000000-0000-0000-0000-000000000001'

CREATE POLICY "Users and ABBY can post messages" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  OR user_id = '00000000-0000-0000-0000-000000000001'::uuid
);