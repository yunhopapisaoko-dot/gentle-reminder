-- Create table for IP tracking
CREATE TABLE public.user_ip_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster IP lookups
CREATE INDEX idx_user_ip_logs_ip ON public.user_ip_logs(ip_address);
CREATE INDEX idx_user_ip_logs_user_id ON public.user_ip_logs(user_id);

-- Enable RLS
ALTER TABLE public.user_ip_logs ENABLE ROW LEVEL SECURITY;

-- Only leaders can view IP logs
CREATE POLICY "Leaders can view all IP logs"
ON public.user_ip_logs
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.is_leader = true
));

-- Any authenticated user can insert their own IP log (for tracking)
CREATE POLICY "Users can insert own IP logs"
ON public.user_ip_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);