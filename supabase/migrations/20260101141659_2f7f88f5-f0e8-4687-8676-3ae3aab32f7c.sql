-- Create a more permissive insert policy that allows system messages
CREATE POLICY "Users and system can post messages" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  OR user_id::text = 'abby-ai' 
  OR user_id::text = 'jyp-bandit'
);