import { supabase } from '../supabase';
import { Post, User, JobApplication, MenuItem, Character } from '../types';

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
      
      if (error && (error.code === 'PGRST116' || error.message.includes('JSON'))) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const meta = userData.user.user_metadata;
          const newProfile = {
            id: userId,
            full_name: meta?.full_name || 'Usuário Magic',
            username: meta?.username || `user_${userId.substring(0, 5)}`,
            avatar_url: meta?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
            race: meta?.race || 'Draeven',
            money: 3000,
            bio: ''
          };
          
          await supabase.from('profiles').insert([newProfile]);
          return { ...newProfile, name: newProfile.full_name, avatar: newProfile.avatar_url, race: newProfile.race as any };
        }
      }

      if (error || !data) return null;
      return {
        id: data.id,
        name: data.full_name || 'Usuário Magic',
        username: data.username || 'anonimo',
        avatar: data.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.id}`,
        race: data.race,
        bio: data.bio || '',
        banner: data.banner_url,
        isLeader: data.is_leader || false,
        money: data.money || 0,
        last_spin_at: data.last_spin_at
      };
    } catch (e) { 
      return null; 
    }
  },

  async updateMoney(userId: string, newBalance: number): Promise<void> {
    await supabase.from('profiles').update({ money: newBalance }).eq('id', userId);
  },

  async updateLastSpin(userId: string): Promise<void> {
    await supabase.from('profiles').update({ last_spin_at: new Date().toISOString() }).eq('id', userId);
  },

  async getCharacters(): Promise<Character[]> {
    const { data } = await supabase.from('characters').select('*').order('created_at', { ascending: false });
    return data || [];
  },

  async createCharacter(character: Partial<Character>): Promise<void> {
    const { error } = await supabase.from('characters').insert([character]);
    if (error) throw error;
  },

  async addToInventory(userId: string, item: MenuItem): Promise<void> {
    const { data: existing } = await supabase
      .from('inventory')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('item_id', item.id)
      .maybeSingle();

    if (existing) {
      await supabase.from('inventory').update({ quantity: (existing.quantity || 1) + 1 }).eq('id', existing.id);
    } else {
      await supabase.from('inventory').insert([{
        user_id: userId,
        item_id: item.id,
        item_name: item.name,
        item_image: item.image,
        category: item.category,
        attributes: { hunger: item.hungerRestore, thirst: item.thirstRestore, alcohol: item.alcoholLevel, description: item.description },
        quantity: 1
      }]);
    }
  },

  async getInventory(userId: string): Promise<any[]> {
    const { data } = await supabase.from('inventory').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return data || [];
  },

  async consumeFromInventory(inventoryId: string, quantity: number): Promise<void> {
    if (quantity > 1) {
      await supabase.from('inventory').update({ quantity: quantity - 1 }).eq('id', inventoryId);
    } else {
      await supabase.from('inventory').delete().eq('id', inventoryId);
    }
  },

  async applyForJob(application: Partial<JobApplication>) {
    await supabase.from('job_applications').insert([application]);
  },

  async getJobApplications(location: string): Promise<JobApplication[]> {
    const { data } = await supabase.from('job_applications').select('*, profiles(full_name, avatar_url, username)').eq('location', location).eq('status', 'pending');
    return data || [];
  },

  async approveApplication(applicationId: string, userId: string, location: string, role: string) {
    await supabase.from('job_applications').update({ status: 'approved' }).eq('id', applicationId);
    await supabase.from('establishment_workers').insert([{ user_id: userId, location, role }]);
  },

  async rejectApplication(applicationId: string) {
    await supabase.from('job_applications').update({ status: 'rejected' }).eq('id', applicationId);
  },

  async checkWorkerStatus(userId: string, location: string): Promise<string | null> {
    const { data } = await supabase.from('establishment_workers').select('role').eq('user_id', userId).eq('location', location).maybeSingle();
    return data?.role || null;
  },

  async grantRoomAccess(userId: string, location: string, roomName: string, grantedBy: string) {
    await supabase.from('room_authorizations').upsert([{ user_id: userId, location, room_name: roomName, granted_by: grantedBy }], { onConflict: 'user_id,location,room_name' });
  },

  async checkRoomAccess(userId: string, location: string): Promise<string[]> {
    const { data } = await supabase.from('room_authorizations').select('room_name').eq('user_id', userId).eq('location', location);
    return data?.map(d => d.room_name) || [];
  },

  async updateProfile(userId: string, updates: any): Promise<void> {
    await withTimeout(supabase.from('profiles').update(updates).eq('id', userId));
  },

  async getPosts(): Promise<Post[]> {
    const { data } = await supabase.from('posts').select(`*, profiles:author_id (*)`).order('created_at', { ascending: false });
    return data?.map((post: any) => ({
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
        race: post.profiles?.race,
        isLeader: post.profiles?.is_leader || false
      }
    })) || [];
  },

  async createPost(userId: string, title: string, excerpt: string, imageUrl?: string) {
    await supabase.from('posts').insert([{ author_id: userId, title, excerpt, image_url: imageUrl }]);
  },

  async getAllProfiles(): Promise<User[]> {
    const { data } = await supabase.from('profiles').select('*').order('updated_at', { ascending: false });
    return data?.map((p: any) => ({
      id: p.id,
      name: p.full_name || 'Usuário',
      username: p.username || 'user',
      avatar: p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`,
      race: p.race,
      isLeader: p.is_leader || false,
      bio: p.bio,
      money: p.money || 0,
      last_spin_at: p.last_spin_at
    })) || [];
  },

  async updateLeaderStatus(userId: string, isLeader: boolean) {
    await supabase.from('profiles').update({ is_leader: isLeader }).eq('id', userId);
  },

  async uploadFile(bucket: string, path: string, file: File): Promise<string> {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { cacheControl: '3600', upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }
};