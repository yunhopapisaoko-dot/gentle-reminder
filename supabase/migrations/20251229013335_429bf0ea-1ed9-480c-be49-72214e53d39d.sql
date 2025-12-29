-- Enable REPLICA IDENTITY FULL on notifications, comments, likes tables for better real-time updates
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.comments REPLICA IDENTITY FULL;
ALTER TABLE public.likes REPLICA IDENTITY FULL;