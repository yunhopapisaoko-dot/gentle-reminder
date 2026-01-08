-- Track per-user read timestamps across devices
CREATE TABLE IF NOT EXISTS public.chat_read_receipts (
  user_id uuid NOT NULL,
  location text NOT NULL,
  sub_location text NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, location, sub_location)
);

-- Enable RLS
ALTER TABLE public.chat_read_receipts ENABLE ROW LEVEL SECURITY;

-- Policies: users can manage only their own receipts
CREATE POLICY "Users can view own chat read receipts"
ON public.chat_read_receipts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat read receipts"
ON public.chat_read_receipts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat read receipts"
ON public.chat_read_receipts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat read receipts"
ON public.chat_read_receipts
FOR DELETE
USING (auth.uid() = user_id);

-- updated_at trigger helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_chat_read_receipts_updated_at ON public.chat_read_receipts;
CREATE TRIGGER set_chat_read_receipts_updated_at
BEFORE UPDATE ON public.chat_read_receipts
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Helpful index for queries
CREATE INDEX IF NOT EXISTS idx_chat_read_receipts_user
ON public.chat_read_receipts (user_id, location);
