-- Adicionar política para usuários verem autorizações que eles concederam
CREATE POLICY "Grantors can view authorizations they granted"
ON public.room_authorizations
FOR SELECT
USING (auth.uid() = granted_by);

-- Atualizar política de insert para workers
DROP POLICY IF EXISTS "Workers can grant access" ON public.room_authorizations;

CREATE POLICY "Authenticated users can grant access"
ON public.room_authorizations
FOR INSERT
WITH CHECK (auth.uid() = granted_by);