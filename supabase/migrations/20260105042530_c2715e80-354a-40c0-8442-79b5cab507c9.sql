-- Allow post owner to delete likes on their posts
CREATE POLICY "Post owner can delete likes on their post" 
ON public.likes 
FOR DELETE 
USING (
  auth.uid() = user_id OR 
  auth.uid() IN (SELECT user_id FROM public.posts WHERE id = post_id)
);