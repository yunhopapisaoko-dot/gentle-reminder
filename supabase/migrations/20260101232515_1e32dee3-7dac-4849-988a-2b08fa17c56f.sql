-- Posts table policies
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view posts" ON public.posts;
DROP POLICY IF EXISTS "Users can create their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;

CREATE POLICY "Authenticated can view posts"
ON public.posts
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create their own posts"
ON public.posts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
ON public.posts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
ON public.posts
FOR DELETE
USING (auth.uid() = user_id);


-- Storage policies for posts bucket (upload images)
DROP POLICY IF EXISTS "Public read posts images" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own post images" ON storage.objects;
DROP POLICY IF EXISTS "Users update own post images" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own post images" ON storage.objects;

CREATE POLICY "Public read posts images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'posts');

CREATE POLICY "Users upload own post images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'posts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users update own post images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'posts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users delete own post images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'posts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
