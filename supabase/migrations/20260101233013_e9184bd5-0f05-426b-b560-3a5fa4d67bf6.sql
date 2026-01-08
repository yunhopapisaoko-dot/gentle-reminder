-- Allow participants to update their conversations (for updated_at sorting)
CREATE POLICY "Participants can update conversations"
ON public.private_conversations
FOR UPDATE
USING ((auth.uid() = participant_1) OR (auth.uid() = participant_2))
WITH CHECK ((auth.uid() = participant_1) OR (auth.uid() = participant_2));