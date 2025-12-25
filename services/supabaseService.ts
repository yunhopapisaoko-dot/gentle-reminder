import { supabase } from '../supabase';
import { Post, User } from '../types';

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 30000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`A operação excedeu o tempo limite.`)), timeoutMs)
    )
  ]);
};

export const supabaseService = {
  async getProfile(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error || !data) return null;
      return {
        id: data.id,
        name: data.full_name || 'Usuário Magic',
        username: data.username || 'anonimo',
        avatar: data.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.id}`,
        bio: data.bio || '',
        banner: data.banner_url,
        isLeader: data.is_leader || false
      };
    } catch { return null; }
  },

  async updateProfile(userId: string, updates: any): Promise<void> {
    const { error } = await withTimeout(supabase.from('profiles').update({
      full_name: updates.full_name,
      username: updates.username,
      bio: updates.bio,
      avatar_url: updates.avatar_url,
      updated_at: new Date().toISOString()
    }).eq('id', userId));
    if (error) throw error;
  },

  async uploadFile(bucket: string, path: string, file: File): Promise<string> {
    const { error: uploadError } = await withTimeout(supabase.storage
      .from(bucket)
      .upload(path, file, { cacheControl: '3600', upsert: true }));

    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  async getAllProfiles(): Promise<User[]> {
    const { data, error } = await supabase.from('profiles').select('*').order('updated_at', { ascending: false });
    if (error) return [];
    return data.map((p: any) => ({
      id: p.id,
      name: p.full_name || 'Usuário',
      username: p.username || 'user',
      avatar: p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`,
      isLeader: p.is_leader || false,
      bio: p.bio
    }));
  },

  async getPosts(): Promise<Post[]> {
    const { data, error } = await supabase.from('posts').select(`*, profiles:author_id (*)`).order('created_at', { ascending: false });
    if (error) return [];
    return data.map((post: any) => ({
      id: post.id,
      title: post.title,
      excerpt: post.excerpt,
      imageUrl: post.image_url,
      timestamp: new Date(post.created_at).toLocaleDateString(),
      likes: '0',
      author: {
        id: post.profiles?.id || post.author_id,
        name: post.profiles?.full_name || 'Membro',
        username: post.profiles?.username || 'user',
        avatar: post.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author_id}`,
        isLeader: post.profiles?.is_leader || false
      }
    }));
  },

  async createPost(userId: string, title: string, excerpt: string, imageUrl?: string) {
    const { error } = await supabase.from('posts').insert([{
      author_id: userId,
      title,
      excerpt,
      image_url: imageUrl
    }]);
    if (error) throw error;
  },

  subscribeToPosts(callback: () => void) {
    return supabase.channel('public:posts').on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, callback).subscribe();
  }
};