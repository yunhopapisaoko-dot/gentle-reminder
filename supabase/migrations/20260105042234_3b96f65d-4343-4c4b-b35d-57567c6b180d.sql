-- Allow post owner to delete comments on their posts
CREATE POLICY "Post owner can delete comments on their post" 
ON public.comments 
FOR DELETE 
USING (
  auth.uid() = user_id OR 
  auth.uid() IN (SELECT user_id FROM public.posts WHERE id = post_id)
);

-- Allow post owner to delete notifications related to their posts
CREATE POLICY "Post owner can delete notifications on their post" 
ON public.notifications 
FOR DELETE 
USING (
  auth.uid() = user_id OR 
  auth.uid() IN (SELECT user_id FROM public.posts WHERE id = post_id)
);