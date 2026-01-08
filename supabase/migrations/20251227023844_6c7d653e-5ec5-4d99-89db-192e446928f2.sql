-- Create chat messages table for location-based roleplay
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  sub_location TEXT,
  content TEXT NOT NULL,
  character_name TEXT,
  character_avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies: Everyone can read messages, authenticated users can post
CREATE POLICY "Anyone can view chat messages" 
ON public.chat_messages 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can post messages" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages" 
ON public.chat_messages 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for faster queries
CREATE INDEX idx_chat_messages_location ON public.chat_messages(location, created_at DESC);
CREATE INDEX idx_chat_messages_user ON public.chat_messages(user_id);