-- Add current_location field to profiles to persist chat location across sessions
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS current_location TEXT DEFAULT NULL;

-- Add current_sub_location for sub-room persistence
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS current_sub_location TEXT DEFAULT NULL;