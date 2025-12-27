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
      // Busca o perfil pelo user_id (não pelo id da tabela profiles)
      const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
      
      // Se o perfil não existir, vamos criá-lo com os dados do signup
      if (!data) {
        console.log("Perfil não encontrado, criando novo perfil...");
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const meta = userData.user.user_metadata;
          const newProfile = {
            user_id: userId,
            full_name: meta?.full_name || meta?.name || 'Usuário Magic',
            username: meta?.username || `user_${userId.substring(0, 5)}`,
            avatar_url: meta?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
            race: (meta?.race?.toLowerCase() || 'draeven') as 'draeven' | 'sylven' | 'lunari',
            money: 3000,
            bio: ''
          };
          
          const { data: insertedProfile, error: insertError } = await supabase
            .from('profiles')
            .insert([newProfile])
            .select()
            .single();
            
          if (insertError) {
            console.error("Erro ao criar perfil:", insertError);
            return { id: userId, name: newProfile.full_name, username: newProfile.username, avatar: newProfile.avatar_url, race: newProfile.race as any };
          }
          
          return { 
            id: insertedProfile.user_id, 
            name: insertedProfile.full_name, 
            username: insertedProfile.username,
            avatar: insertedProfile.avatar_url, 
            race: insertedProfile.race as any,
            money: insertedProfile.money,
            bio: insertedProfile.bio
          };
        }
        return null;
      }

      if (error) {
        console.error("Erro ao buscar perfil:", error);
        return null;
      }
      
      return {
        id: data.user_id,
        name: data.full_name || 'Usuário Magic',
        username: data.username || 'anonimo',
        avatar: data.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user_id}`,
        race: data.race,
        bio: data.bio || '',
        banner: data.banner_url,
        isLeader: data.is_leader || false,
        money: data.money || 0,
        last_spin_at: data.last_spin_at
      };
    } catch (e) { 
      console.error("Erro no getProfile:", e);
      return null; 
    }
  },

  async updateMoney(userId: string, newBalance: number): Promise<void> {
    const { error } = await supabase.from('profiles').update({ money: newBalance }).eq('user_id', userId);
    if (error) throw error;
  },

  async updateLastSpin(userId: string): Promise<void> {
    const { error } = await supabase.from('profiles').update({ last_spin_at: new Date().toISOString() }).eq('user_id', userId);
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
      await supabase
        .from('inventory')
        .update({ quantity: (existing.quantity || 1) + 1 })
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
    const { data } = await supabase
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
      .maybeSingle();
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
    const result = await withTimeout(supabase.from('profiles').update({
      full_name: updates.full_name,
      username: updates.username,
      bio: updates.bio,
      avatar_url: updates.avatar_url,
      race: updates.race,
      updated_at: new Date().toISOString()
    }).eq('user_id', userId)) as { error: any };
    if (result.error) throw result.error;
  },

  async getPosts(): Promise<Post[]> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`*, profiles!posts_user_id_fkey (*)`)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Erro ao buscar posts:", error);
        return [];
      }
      
      return data.map((post: any) => ({
        id: post.id,
        title: post.title || 'Sem título',
        excerpt: post.content,
        imageUrl: post.image_url,
        timestamp: new Date(post.created_at).toLocaleDateString(),
        likes: '0',
        author: {
          id: post.profiles?.user_id || post.user_id,
          name: post.profiles?.full_name || 'Membro',
          username: post.profiles?.username || 'user',
          avatar: post.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_id}`,
          race: post.profiles?.race,
          isLeader: post.profiles?.is_leader || false
        }
      }));
    } catch (e) { 
      console.error("Erro getPosts:", e);
      return []; 
    }
  },

  async createPost(userId: string, title: string, content: string, imageUrl?: string) {
    const { error } = await supabase.from('posts').insert([{
      user_id: userId,
      title,
      content,
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
    const { error } = await supabase.from('profiles').update({ is_leader: isLeader }).eq('user_id', userId);
    if (error) throw error;
  },

  async uploadFile(bucket: string, path: string, file: File): Promise<string> {
    const result = await withTimeout(supabase.storage
      .from(bucket)
      .upload(path, file, { cacheControl: '3600', upsert: true })) as { error: any };

    if (result.error) throw result.error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  async uploadAvatar(userId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop() || 'png';
    const filePath = `${userId}/avatar_${Date.now()}.${fileExt}`;

    const result = await withTimeout(supabase.storage
      .from('avatars')
      .upload(filePath, file, { cacheControl: '3600', upsert: true })) as { error: any };

    if (result.error) throw result.error;
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data.publicUrl;
  },

  // ============ CHAT MESSAGES ============
  async getChatMessages(location: string, subLocation?: string): Promise<any[]> {
    let query = supabase
      .from('chat_messages')
      .select('*, profiles:user_id (full_name, username, avatar_url)')
      .eq('location', location)
      .order('created_at', { ascending: true })
      .limit(100);
    
    if (subLocation) {
      query = query.eq('sub_location', subLocation);
    }
    
    const { data, error } = await query;
    if (error) {
      console.error("Erro ao buscar mensagens:", error);
      return [];
    }
    return data || [];
  },

  async sendChatMessage(userId: string, location: string, content: string, characterName?: string, characterAvatar?: string, subLocation?: string): Promise<void> {
    const { error } = await supabase.from('chat_messages').insert([{
      user_id: userId,
      location,
      sub_location: subLocation,
      content,
      character_name: characterName,
      character_avatar: characterAvatar
    }]);
    if (error) throw error;
  },

  // ============ LIKES ============
  async toggleLike(userId: string, postId: string): Promise<boolean> {
    // Check if already liked
    const { data: existing } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .maybeSingle();
    
    if (existing) {
      // Unlike
      await supabase.from('likes').delete().eq('id', existing.id);
      return false;
    } else {
      // Like
      await supabase.from('likes').insert([{ user_id: userId, post_id: postId }]);
      return true;
    }
  },

  async getLikeCount(postId: string): Promise<number> {
    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);
    return count || 0;
  },

  async isLikedByUser(userId: string, postId: string): Promise<boolean> {
    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .maybeSingle();
    return !!data;
  },

  // ============ COMMENTS ============
  async getComments(postId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles:user_id (full_name, username, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    
    if (error) return [];
    return data || [];
  },

  async addComment(userId: string, postId: string, content: string, parentId?: string): Promise<void> {
    const { error } = await supabase.from('comments').insert([{
      user_id: userId,
      post_id: postId,
      content,
      parent_id: parentId
    }]);
    if (error) throw error;
  },

  // ============ CHARACTERS ============
  async getCharacters(): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) return [];
    return data || [];
  },

  async createCharacter(character: any): Promise<void> {
    const { error } = await supabase.from('characters').insert([character]);
    if (error) throw error;
  }
};