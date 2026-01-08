-- Fix inventory.user_id foreign key to reference profiles.user_id (auth user id), not profiles.id

ALTER TABLE public.inventory
  DROP CONSTRAINT IF EXISTS inventory_user_id_fkey;

ALTER TABLE public.inventory
  ADD CONSTRAINT inventory_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id)
  ON DELETE CASCADE;