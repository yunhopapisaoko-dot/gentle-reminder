import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../integrations/supabase/client';
import { useToast } from '../hooks/use-toast';
import { useState } from 'react';

export function CreatePost({ onPostCreated }: { onPostCreated: () => void }) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!content.trim() || !user) return;
    setIsLoading(true);
    const { error } = await supabase.from('posts').insert({ content: content.trim(), user_id: user.id });
    if (error) toast({ title: 'Erro', description: 'Não foi possível publicar.', variant: 'destructive' });
    else { setContent(''); toast({ title: 'Publicado!' }); onPostCreated(); }
    setIsLoading(false);
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex gap-3">
          <Avatar><AvatarImage src={profile?.avatar_url || undefined} /><AvatarFallback>{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback></Avatar>
          <div className="flex-1 space-y-3">
            <Textarea placeholder="O que está acontecendo?" value={content} onChange={(e) => setContent(e.target.value)} className="resize-none" />
            <div className="flex justify-end"><Button onClick={handleSubmit} disabled={!content.trim() || isLoading}>{isLoading ? '...' : 'Publicar'}</Button></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
