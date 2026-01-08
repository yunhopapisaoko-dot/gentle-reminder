import { Heart, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';

interface PostCardProps {
  post: { 
    id: string; 
    content: string; 
    title?: string | null; 
    image_url?: string | null; 
    video_url?: string | null;
    created_at: string; 
    profile?: { full_name: string; username: string; avatar_url?: string | null } | null 
  };
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  onLike: () => void;
}

export function PostCard({ post, likesCount, commentsCount, isLiked, onLike }: PostCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <Avatar><AvatarImage src={post.profile?.avatar_url || undefined} /><AvatarFallback>{post.profile?.full_name?.charAt(0) || 'U'}</AvatarFallback></Avatar>
        <div className="flex-1">
          <div className="font-medium">{post.profile?.full_name || 'Usuário'}</div>
          <div className="text-sm text-muted-foreground">@{post.profile?.username || 'usuario'}</div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {post.title && <h3 className="font-semibold text-lg">{post.title}</h3>}
        <p className="whitespace-pre-wrap">{post.content}</p>
        
        {/* Image */}
        {post.image_url && (
          <img src={post.image_url} alt="" className="rounded-lg max-h-96 w-full object-cover" />
        )}
        
        {/* Video */}
        {post.video_url && (
          <div className="relative rounded-lg overflow-hidden bg-black">
            <video 
              src={post.video_url} 
              className="w-full max-h-96 object-contain"
              controls
              playsInline
              preload="metadata"
            />
          </div>
        )}
        
        <div className="flex gap-4 pt-2">
          <Button variant="ghost" size="sm" onClick={onLike} className={isLiked ? 'text-red-500' : ''}>
            <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />{likesCount}
          </Button>
          <Button variant="ghost" size="sm">
            <MessageCircle className="w-4 h-4 mr-1" />{commentsCount}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
