-- Create posts storage bucket for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('posts', 'posts', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for posts bucket
CREATE POLICY "Post images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'posts');

CREATE POLICY "Authenticated users can upload post images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'posts' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own post images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own post images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);