-- Global JYP cooldown state (single-row)
CREATE TABLE IF NOT EXISTS public.jyp_state (
  id integer PRIMARY KEY,
  last_robbery_at timestamptz NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure row exists
INSERT INTO public.jyp_state (id, last_robbery_at)
VALUES (1, NULL)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.jyp_state ENABLE ROW LEVEL SECURITY;

-- Readable by authenticated users (front-end needs to know state)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='jyp_state' AND policyname='Authenticated users can view jyp state'
  ) THEN
    CREATE POLICY "Authenticated users can view jyp state"
    ON public.jyp_state
    FOR SELECT
    USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- No direct updates from clients; updates happen via SECURITY DEFINER RPC

CREATE OR REPLACE FUNCTION public.try_trigger_jyp_robbery(min_interval_ms bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_row public.jyp_state;
BEGIN
  -- Update only if interval has passed; atomic gate.
  UPDATE public.jyp_state
  SET last_robbery_at = now(), updated_at = now()
  WHERE id = 1
    AND (
      last_robbery_at IS NULL
      OR (extract(epoch from (now() - last_robbery_at)) * 1000) >= min_interval_ms
    )
  RETURNING * INTO updated_row;

  IF FOUND THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.try_trigger_jyp_robbery(bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.try_trigger_jyp_robbery(bigint) TO anon, authenticated;

-- prevent direct UPDATE/INSERT/DELETE via RLS by simply not creating policies
