-- Tabela de casas
CREATE TABLE public.houses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  owner_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(owner_id) -- Cada usuário só pode ter uma casa
);

-- Habilita RLS
ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;

-- Políticas de casas
CREATE POLICY "Anyone can view houses" ON public.houses FOR SELECT USING (true);
CREATE POLICY "Users can create their own house" ON public.houses FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can delete their own house" ON public.houses FOR DELETE USING (auth.uid() = owner_id);

-- Tabela de convites para casas
CREATE TABLE public.house_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id uuid NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  invited_user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(house_id, invited_user_id) -- Cada usuário só pode ser convidado uma vez por casa
);

-- Habilita RLS
ALTER TABLE public.house_invites ENABLE ROW LEVEL SECURITY;

-- Políticas de convites
CREATE POLICY "Users can view invites for their house or to them" ON public.house_invites 
FOR SELECT USING (auth.uid() = invited_user_id OR auth.uid() = invited_by);

CREATE POLICY "House owners can invite" ON public.house_invites 
FOR INSERT WITH CHECK (
  auth.uid() = invited_by AND 
  EXISTS (SELECT 1 FROM public.houses WHERE id = house_id AND owner_id = auth.uid())
);

CREATE POLICY "House owners can revoke invites" ON public.house_invites 
FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.houses WHERE id = house_id AND owner_id = auth.uid())
);

-- Habilita realtime para mensagens de casa
ALTER PUBLICATION supabase_realtime ADD TABLE public.houses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.house_invites;