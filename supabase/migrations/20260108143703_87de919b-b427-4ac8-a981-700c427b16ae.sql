-- Add started_at column to treatment_requests
-- This tracks when the patient actually enters the treatment room and the timer begins
ALTER TABLE public.treatment_requests 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add required_room column to store which room the patient needs to enter
ALTER TABLE public.treatment_requests 
ADD COLUMN IF NOT EXISTS required_room TEXT DEFAULT NULL;

COMMENT ON COLUMN public.treatment_requests.started_at IS 'When the patient entered the treatment room and timer began';
COMMENT ON COLUMN public.treatment_requests.required_room IS 'The room the patient must enter for treatment to begin';