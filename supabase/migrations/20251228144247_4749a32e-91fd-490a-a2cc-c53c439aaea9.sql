-- Remove a foreign key antiga que aponta para profiles.id
ALTER TABLE public.characters DROP CONSTRAINT IF EXISTS characters_user_id_fkey;

-- Adiciona a foreign key correta apontando para profiles.user_id
ALTER TABLE public.characters 
ADD CONSTRAINT characters_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;