-- Drop the restrictive policy that forces user_id = auth.uid()
DROP POLICY IF EXISTS "Authenticated users can post messages" ON public.chat_messages;

-- Create a new policy that allows system users (with UUIDs starting with 00000000) to post with any user_id
-- while still allowing regular users to post as themselves
CREATE POLICY "System and authenticated users can post messages"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  -- Allow service role (no auth context) to insert anything
  auth.uid() IS NULL
  OR
  -- Allow authenticated users to post as themselves
  auth.uid() = user_id
  OR
  -- Allow system UUIDs (MonkeyDoctor, ABBY, etc.)
  user_id IN (
    '00000000-0000-0000-0000-000000000001'::uuid,  -- ABBY
    '00000000-0000-0000-0000-000000000002'::uuid   -- MonkeyDoctor
  )
);