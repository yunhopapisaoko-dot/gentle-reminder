-- Drop the restrictive policy and recreate as permissive
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view all profiles"
ON public.profiles
FOR SELECT
TO public
USING (true);