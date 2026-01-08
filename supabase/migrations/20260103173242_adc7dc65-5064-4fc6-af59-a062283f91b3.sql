-- Enable realtime for chat_messages and private_messages tables
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.private_messages REPLICA IDENTITY FULL;

-- Add tables to realtime publication (if not already added)
DO $$
BEGIN
  -- Check and add chat_messages to realtime
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  END IF;
  
  -- Check and add private_messages to realtime
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'private_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.private_messages;
  END IF;
END $$;