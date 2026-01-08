-- Add is_active_rp column to profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_active_rp'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_active_rp boolean NOT NULL DEFAULT true;
  END IF;
END $$;