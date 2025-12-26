import { supabase } from '../supabase';
import { Post, User, JobApplication, MenuItem } from '../types';

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
      
      if (error && error.code === 'PGRST116') {
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
    } catch { return null; }
  },

  async updateMoney(userId: string, newBalance: number): Promise<void> {
    const { error } = await supabase.from('profiles').update({ money: newBalance }).eq('id', userId);
    if (error) throw error;
  },

  async updateLastSpin(userId: string): Promise<void> {
    const { error } = await supabase.from('profiles').update({ last_spin_at: new Date().toISOString() }).eq('id', userId);
    if (error) throw error;
  },

  async addToInventory(userId: string, item: MenuItem): Promise<void> {
    // Tenta encontrar se o item já existe para aumentar a quantidade
    const { data: existing } = await supabase
      .from('inventory')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('item_id', item.id)
      .single();

    if (existing) {
      await supabase
        .from('inventory')
        .update({ quantity: existing.quantity + 1 })
        .eq('id', existing.id);
    } else {
      await supabase.from('inventory').insert([{
        user_id: userId,
        item_id: item.id,
        item_name: item.name,
        item_image: item.image,
        category: item.category,
        attributes: {
          hunger: item.hungerRestore,
          thirst: item.thirstRestore,
          alcohol: item.alcoholLevel,
          description: item.description
        }
      }]);
    }
  },

  async getInventory(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
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
    const { error } = await supabase.from('job_applications').insert([application]);
    if (error) throw error;
  },

  async getJobApplications(location: string): Promise<JobApplication[]> {
    const { data, error } = await supabase
      .from('job_applications')
      .select('*, profiles(full_name, avatar_url, username)')
      .eq('location', location)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) return [];
    return data;
  },

  async approveApplication(applicationId: string, userId: string, location: string, role: string) {
    const { error: appError } = await supabase
      .from('job_applications')
      .update({ status: 'approved' })
      .eq('id', applicationId);
    if (appError) throw appError;

    const { error: workerError } = await supabase
      .from('establishment_workers')
      .insert([{ user_id: userId, location, role }]);
    if (workerError && !workerError.message.includes('unique')) throw workerError;
  },

  async rejectApplication(applicationId: string) {
    const { error } = await supabase
      .from('job_applications')
      .update({ status: 'rejected' })
      .eq('id', applicationId);
    if (error) throw error;
  },

  async checkWorkerStatus(userId: string, location: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('establishment_workers')
      .select('role')
      .eq('user_id', userId)
      .eq('location', location)
      .single();
    if (error || !data) return null;
    return data.role;
  },

  async grantRoomAccess(userId: string, location: string, roomName: string, grantedBy: string) {
    const { error } = await supabase
      .from('room_authorizations')
      .upsert([{ 
        user_id: userId, 
        location, 
        room_name: roomName, 
        granted_by: grantedBy 
      }], { onConflict: 'user_id,location,room_name' });
    if (error) throw error;
  },

  async checkRoomAccess(userId: string, location: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('room_authorizations')
      .select('room_name')
      .eq('user_id', userId)
      .eq('location', location);
    if (error) return [];
    return data.map(d => d.room_name);
  },

  async updateProfile(userId: string, updates: any): Promise<void> {
    const { error } = await withTimeout(supabase.from('profiles').update({
      full_name: updates.full_name,
      username: updates.username,
      bio: updates.bio,
      avatar_url: updates.avatar_url,
      race: updates.race,
      updated_at: new Date().toISOString()
    }).eq('id', userId));
    if (error) throw error;
  },

  async getPosts(): Promise<Post[]> {
    try {
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
          race: post.profiles?.race,
          isLeader: post.profiles?.is_leader || false
        }
      }));
    } catch { return []; }
  },

  async createPost(userId: string, title: string, excerpt: string, imageUrl?: string) {
    const { error } = await supabase.from('posts').insert([{
      author_id: userId,
      title,
      excerpt,
      image_url: imageUrl
    }]);
    if (error) throw new Error(error.message || "Falha ao inserir post.");
  },

  async getAllProfiles(): Promise<User[]> {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('updated_at', { ascending: false });
      if (error) return [];
      return data.map((p: any) => ({
        id: p.id,
        name: p.full_name || 'Usuário',
        username: p.username || 'user',
        avatar: p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`,
        race: p.race,
        isLeader: p.is_leader || false,
        bio: p.bio,
        money: p.money || 0,
        last_spin_at: p.last_spin_at
      }));
    } catch { return []; }
  },

  async updateLeaderStatus(userId: string, isLeader: boolean) {
    const { error } = await supabase.from('profiles').update({ is_leader: isLeader }).eq('id', userId);
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

  async uploadAvatar(userId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop() || 'png';
    const filePath = `${userId}/avatar_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await withTimeout(supabase.storage
      .from('avatars')
      .upload(filePath, file, { cacheControl: '3600', upsert: true }));

    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data.publicUrl;
  }
};