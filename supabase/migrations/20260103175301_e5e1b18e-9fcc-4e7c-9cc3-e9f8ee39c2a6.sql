-- Reset JYP state to allow immediate robbery
UPDATE public.jyp_state SET last_robbery_at = NULL, updated_at = now() WHERE id = 1;

-- Create a function to force reset JYP for testing
CREATE OR REPLACE FUNCTION public.reset_jyp_for_test()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.jyp_state SET last_robbery_at = NULL, updated_at = now() WHERE id = 1;
END;
$$;