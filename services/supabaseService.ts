import { supabase } from '../supabase';
import { Post, User, JobApplication, MenuItem, FoodOrder, OrderItem } from '../types';

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
      const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
      
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
            health: 100,
            hunger: 100,
            energy: 100,
            alcoholism: 0,
            bio: '',
            is_active_rp: true
          };
          
          const { data: insertedProfile, error: insertError } = await supabase
            .from('profiles')
            .insert([newProfile])
            .select()
            .single();
            
          if (insertError) {
            console.error("Erro ao criar perfil:", insertError);
            return { id: userId, name: newProfile.full_name, username: newProfile.username, avatar: newProfile.avatar_url, race: newProfile.race as any, is_active_rp: true };
          }
          
          return { 
            id: insertedProfile.user_id, 
            name: insertedProfile.full_name, 
            username: insertedProfile.username,
            avatar: insertedProfile.avatar_url, 
            race: insertedProfile.race as any,
            money: insertedProfile.money,
            bio: insertedProfile.bio,
            isActiveRP: insertedProfile.is_active_rp
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
        hp: data.health ?? 100,
        maxHp: 100,
        hunger: data.hunger ?? 100,
        thirst: data.energy ?? 100,
        alcohol: data.alcoholism ?? 0,
        last_spin_at: data.last_spin_at,
        isActiveRP: data.is_active_rp ?? true
      };
    } catch (e) { 
      console.error("Erro no getProfile:", e);
      return null; 
    }
  },

  async updateRoleplayStatus(userId: string, isActive: boolean): Promise<void> {
    const { error } = await supabase.from('profiles').update({ is_active_rp: isActive }).eq('user_id', userId);
    if (error) throw error;
  },

  async updateMoney(userId: string, newBalance: number): Promise<void> {
    const { error } = await supabase.from('profiles').update({ money: newBalance }).eq('user_id', userId);
    if (error) throw error;
  },

  async updateVitalStatus(userId: string, updates: { health?: number; hunger?: number; energy?: number; alcoholism?: number }): Promise<void> {
    const { error } = await supabase.from('profiles').update(updates).eq('user_id', userId);
    if (error) console.error("Erro ao atualizar status vitais:", error);
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
      .select('*')
      .eq('location', location)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error || !data) return [];
    
    // Buscar profiles separadamente
    const userIds = [...new Set(data.map(app => app.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url, username')
      .in('user_id', userIds);
    
    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
    
    return data.map(app => ({
      ...app,
      profiles: profileMap.get(app.user_id) || null
    }));
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
    const updateData: any = {
      full_name: updates.full_name,
      username: updates.username,
      bio: updates.bio,
      avatar_url: updates.avatar_url,
      updated_at: new Date().toISOString()
    };
    
    if (updates.banner_url !== undefined) {
      updateData.banner_url = updates.banner_url;
    }
    if (updates.race !== undefined) {
      updateData.race = updates.race;
    }
    
    const result = await withTimeout(supabase.from('profiles').update(updateData).eq('user_id', userId)) as { error: any };
    if (result.error) throw result.error;
  },

  async uploadBanner(userId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop() || 'png';
    const filePath = `${userId}/banner_${Date.now()}.${fileExt}`;

    const result = await withTimeout(supabase.storage
      .from('avatars')
      .upload(filePath, file, { cacheControl: '3600', upsert: true })) as { error: any };

    if (result.error) throw result.error;
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data.publicUrl;
  },

  async getPosts(): Promise<Post[]> {
    try {
      const { data: postsData, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar posts:', error);
        return [];
      }

      const userIds = [...new Set((postsData || []).map((p: any) => p.user_id).filter(Boolean))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url, race, is_leader')
        .in('user_id', userIds);

      const profileMap = new Map<string, any>((profilesData || []).map((p: any) => [p.user_id, p]));

      return (postsData || []).map((post: any) => {
        const profile = profileMap.get(post.user_id);
        return {
          id: post.id,
          title: post.title || 'Sem título',
          excerpt: post.content,
          imageUrl: post.image_url,
          timestamp: new Date(post.created_at).toLocaleDateString(),
          likes: '0',
          author: {
            id: post.user_id,
            name: profile?.full_name || 'Membro',
            username: profile?.username || 'user',
            avatar: profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_id}`,
            race: profile?.race,
            isLeader: profile?.is_leader || false,
          },
        };
      });
    } catch (e) {
      console.error('Erro getPosts:', e);
      return [];
    }
  },

  async getPostsByUser(userId: string): Promise<Post[]> {
    try {
      const { data: postsData, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar posts do usuário:', error);
        return [];
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url, race, is_leader')
        .eq('user_id', userId)
        .maybeSingle();

      const profileAny: any = profile;

      return (postsData || []).map((post: any) => ({
        id: post.id,
        title: post.title || 'Sem título',
        excerpt: post.content,
        imageUrl: post.image_url,
        timestamp: new Date(post.created_at).toLocaleDateString(),
        likes: '0',
        author: {
          id: userId,
          name: profileAny?.full_name || 'Membro',
          username: profileAny?.username || 'user',
          avatar: profileAny?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
          race: profileAny?.race,
          isLeader: profileAny?.is_leader || false,
        },
      }));
    } catch (e) {
      console.error('Erro getPostsByUser:', e);
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
        id: p.user_id,
        name: p.full_name || 'Usuário',
        username: p.username || 'user',
        avatar: p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.user_id}`,
        banner: p.banner_url,
        race: p.race,
        isLeader: p.is_leader || false,
        bio: p.bio,
        money: p.money || 0,
        last_spin_at: p.last_spin_at,
        isActiveRP: p.is_active_rp ?? true
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
    // Query sem join - buscar profiles separadamente porque não há FK
    let query = supabase
      .from('chat_messages')
      .select('*')
      .eq('location', location)
      .order('created_at', { ascending: true })
      .limit(100);
    
    if (subLocation) {
      query = query.eq('sub_location', subLocation);
    } else {
      query = query.is('sub_location', null);
    }
    
    const { data, error } = await query;
    if (error) {
      console.error("Erro ao buscar mensagens:", error);
      return [];
    }
    
    if (!data || data.length === 0) return [];
    
    // Buscar profiles separadamente
    const userIds = [...new Set(data.filter(m => m.user_id !== 'jyp-bandit').map(m => m.user_id))];
    let profileMap = new Map();
    
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url')
        .in('user_id', userIds);
      
      profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
    }
    
    return data.map(msg => ({
      ...msg,
      profiles: profileMap.get(msg.user_id) || null
    }));
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

  async getAllCharacters(): Promise<any[]> {
    console.log("Buscando todos os personagens...");
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .order('created_at', { ascending: false });
    
    console.log("Resultado getAllCharacters:", { data, error });
    
    if (error) {
      console.error("Erro ao buscar todos os personagens:", error);
      return [];
    }
    
    // Buscar profiles separadamente para evitar problemas de join
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url')
        .in('user_id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      return data.map(char => ({
        ...char,
        profiles: profileMap.get(char.user_id) || null
      }));
    }
    
    return data || [];
  },

  async getUserCharacter(userId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) return null;
    return data;
  },

  async createCharacter(character: any): Promise<void> {
    // Verifica se usuário já tem personagem
    const existing = await this.getUserCharacter(character.user_id);
    if (existing) {
      throw new Error("Você já possui um personagem. Cada usuário só pode ter um.");
    }
    
    const { data, error } = await supabase.from('characters').insert([character]).select();
    if (error) throw error;
  },

  async updateCharacter(characterId: string, updates: any): Promise<void> {
    const { error } = await supabase.from('characters').update(updates).eq('id', characterId);
    if (error) throw error;
  },

  async deleteCharacter(characterId: string): Promise<void> {
    const { error } = await supabase.from('characters').delete().eq('id', characterId);
    if (error) throw error;
  },

  // ============ HOUSES ============
  async getUserHouse(userId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('houses')
      .select('*')
      .eq('owner_id', userId)
      .maybeSingle();
    
    if (error) return null;
    return data;
  },

  async buyHouse(userId: string, ownerName: string): Promise<void> {
    // Verifica se já tem casa
    const existing = await this.getUserHouse(userId);
    if (existing) {
      throw new Error("Você já possui uma casa.");
    }
    
    // Verifica se tem dinheiro suficiente
    const { data: profile } = await supabase
      .from('profiles')
      .select('money')
      .eq('user_id', userId)
      .single();
    
    if (!profile || profile.money < 100000) {
      throw new Error("Você não tem dinheiro suficiente. A casa custa 100.000.");
    }
    
    // Deduz o dinheiro
    const { error: moneyError } = await supabase
      .from('profiles')
      .update({ money: profile.money - 100000 })
      .eq('user_id', userId);
    
    if (moneyError) throw moneyError;
    
    // Cria a casa
    const { error } = await supabase.from('houses').insert([{
      owner_id: userId,
      owner_name: ownerName
    }]);
    
    if (error) {
      // Devolve o dinheiro se der erro
      await supabase.from('profiles').update({ money: profile.money }).eq('user_id', userId);
      throw error;
    }
  },

  async getHouseInvites(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('house_invites')
      .select('*, houses!inner(owner_id, owner_name)')
      .eq('invited_user_id', userId);
    
    if (error) return [];
    return data || [];
  },

  async inviteToHouse(houseId: string, invitedUserId: string, invitedBy: string): Promise<void> {
    const { error } = await supabase.from('house_invites').insert([{
      house_id: houseId,
      invited_user_id: invitedUserId,
      invited_by: invitedBy
    }]);
    if (error) throw error;
  },

  async removeHouseInvite(houseId: string, invitedUserId: string): Promise<void> {
    const { error } = await supabase
      .from('house_invites')
      .delete()
      .eq('house_id', houseId)
      .eq('invited_user_id', invitedUserId);
    if (error) throw error;
  },

  async canAccessHouse(userId: string, houseOwnerId: string): Promise<boolean> {
    // Dono sempre pode acessar
    if (userId === houseOwnerId) return true;
    
    // Verifica se tem convite
    const { data: house } = await supabase
      .from('houses')
      .select('id')
      .eq('owner_id', houseOwnerId)
      .single();
    
    if (!house) return false;
    
    const { data: invite } = await supabase
      .from('house_invites')
      .select('id')
      .eq('house_id', house.id)
      .eq('invited_user_id', userId)
      .maybeSingle();
    
    return !!invite;
  },

  // ============ TREATMENT REQUESTS ============
  async createTreatmentRequest(patientId: string, diseaseId: string, diseaseName: string, treatmentCost: number, cureTimeMinutes: number): Promise<void> {
    const { error } = await supabase.from('treatment_requests').insert([{
      patient_id: patientId,
      disease_id: diseaseId,
      disease_name: diseaseName,
      treatment_cost: treatmentCost,
      cure_time_minutes: cureTimeMinutes,
      status: 'pending'
    }]);
    if (error) throw error;
  },

  async getPendingTreatments(location: string = 'hospital'): Promise<any[]> {
    const { data, error } = await supabase
      .from('treatment_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    
    if (error || !data) return [];
    
    // Buscar profiles dos pacientes
    const patientIds = [...new Set(data.map(t => t.patient_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url, username, money')
      .in('user_id', patientIds);
    
    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
    
    return data.map(t => ({
      ...t,
      patient: profileMap.get(t.patient_id) || null
    }));
  },

  async getUserPendingTreatment(userId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('treatment_requests')
      .select('*')
      .eq('patient_id', userId)
      .eq('status', 'pending')
      .maybeSingle();
    
    if (error || !data) return null;
    return data;
  },

  async getUserActiveTreatment(userId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('treatment_requests')
      .select('*')
      .eq('patient_id', userId)
      .eq('status', 'approved')
      .maybeSingle();
    
    if (error || !data) return null;
    return data;
  },

  async approveTreatment(requestId: string, approverId: string): Promise<void> {
    // Buscar dados do tratamento
    const { data: treatment, error: fetchError } = await supabase
      .from('treatment_requests')
      .select('*')
      .eq('id', requestId)
      .single();
    
    if (fetchError || !treatment) throw new Error('Tratamento não encontrado');
    
    // Descontar dinheiro do paciente
    const { data: patientProfile } = await supabase
      .from('profiles')
      .select('money')
      .eq('user_id', treatment.patient_id)
      .single();
    
    if (!patientProfile || patientProfile.money < treatment.treatment_cost) {
      throw new Error('Paciente sem saldo suficiente');
    }
    
    const newBalance = patientProfile.money - treatment.treatment_cost;
    
    // Atualizar saldo do paciente
    const { error: moneyError } = await supabase
      .from('profiles')
      .update({ money: newBalance })
      .eq('user_id', treatment.patient_id);
    
    if (moneyError) throw moneyError;
    
    // Aprovar tratamento
    const { error: approveError } = await supabase
      .from('treatment_requests')
      .update({ 
        status: 'approved', 
        approved_by: approverId,
        approved_at: new Date().toISOString()
      })
      .eq('id', requestId);
    
    if (approveError) throw approveError;
    
    // Definir doença no perfil do paciente
    const { error: diseaseError } = await supabase
      .from('profiles')
      .update({ 
        current_disease: treatment.disease_id,
        disease_started_at: new Date().toISOString()
      })
      .eq('user_id', treatment.patient_id);
    
    if (diseaseError) throw diseaseError;
  },

  async rejectTreatment(requestId: string): Promise<void> {
    const { error } = await supabase
      .from('treatment_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);
    if (error) throw error;
  },

  async completeTreatment(requestId: string, patientId: string): Promise<void> {
    // Marcar tratamento como completo
    const { error: treatmentError } = await supabase
      .from('treatment_requests')
      .update({ status: 'completed' })
      .eq('id', requestId);
    
    if (treatmentError) throw treatmentError;
    
    // Limpar doença do perfil
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        current_disease: null,
        disease_started_at: null,
        health: 100
      })
      .eq('user_id', patientId);
    
    if (profileError) throw profileError;
  },

  async cancelTreatmentRequest(requestId: string): Promise<void> {
    const { error } = await supabase
      .from('treatment_requests')
      .delete()
      .eq('id', requestId);
    if (error) throw error;
  },

  // ============ FOOD ORDERS ============
  async createFoodOrder(customerId: string, customerName: string, location: string, items: OrderItem[], totalPrice: number, preparationTime: number): Promise<void> {
    const { error } = await supabase.from('food_orders').insert([{
      customer_id: customerId,
      customer_name: customerName,
      location,
      items,
      total_price: totalPrice,
      preparation_time: preparationTime,
      status: 'pending'
    }]);
    if (error) throw error;
  },

  async getPendingFoodOrders(location: string): Promise<FoodOrder[]> {
    const { data, error } = await supabase
      .from('food_orders')
      .select('*')
      .eq('location', location)
      .in('status', ['pending', 'preparing'])
      .order('created_at', { ascending: true });
    
    if (error || !data) return [];
    return data as FoodOrder[];
  },

  async approveFoodOrder(orderId: string, approverId: string): Promise<void> {
    const { error } = await supabase
      .from('food_orders')
      .update({ 
        status: 'preparing', 
        approved_by: approverId, 
        approved_at: new Date().toISOString()
      })
      .eq('id', orderId);
    
    if (error) throw error;
  },

  async completeFoodOrder(orderId: string): Promise<void> {
    // Buscar dados do pedido
    const { data: order, error: fetchError } = await supabase
      .from('food_orders')
      .select('*')
      .eq('id', orderId)
      .single();
    
    if (fetchError || !order) throw new Error('Pedido não encontrado');
    
    // Descontar dinheiro do cliente
    const { data: customerProfile } = await supabase
      .from('profiles')
      .select('money')
      .eq('user_id', order.customer_id)
      .single();
    
    if (!customerProfile || customerProfile.money < order.total_price) {
      throw new Error('Cliente sem saldo suficiente');
    }
    
    const newBalance = customerProfile.money - order.total_price;
    
    // Atualizar saldo do cliente
    const { error: moneyError } = await supabase
      .from('profiles')
      .update({ money: newBalance })
      .eq('user_id', order.customer_id);
    
    if (moneyError) throw moneyError;
    
    // Adicionar itens ao inventário
    const items = order.items as OrderItem[];
    console.log('Adicionando itens ao inventário:', items, 'para usuário:', order.customer_id);
    
    for (const item of items) {
      // Verificar se já existe este item no inventário do usuário
      const { data: existing, error: selectError } = await supabase
        .from('inventory')
        .select('id, quantity')
        .eq('user_id', order.customer_id)
        .eq('item_id', item.id)
        .maybeSingle();

      if (selectError) {
        console.error('Erro ao verificar inventário existente:', selectError);
      }

      if (existing) {
        // Atualizar quantidade
        const newQuantity = (existing.quantity || 1) + item.quantity;
        const { error: updateError } = await supabase
          .from('inventory')
          .update({ quantity: newQuantity })
          .eq('id', existing.id);
        
        if (updateError) {
          console.error('Erro ao atualizar inventário:', updateError);
          throw updateError;
        }
        console.log('Inventário atualizado:', item.name, 'nova quantidade:', newQuantity);
      } else {
        // Inserir novo item
        const { error: insertError } = await supabase.from('inventory').insert([{
          user_id: order.customer_id,
          item_id: item.id,
          item_name: item.name,
          item_image: item.image,
          category: 'Comida',
          quantity: item.quantity,
          attributes: {
            hunger: item.hungerRestore,
            thirst: item.thirstRestore,
            alcohol: item.alcoholLevel
          }
        }]);
        
        if (insertError) {
          console.error('Erro ao inserir no inventário:', insertError);
          throw insertError;
        }
        console.log('Item inserido no inventário:', item.name, 'quantidade:', item.quantity);
      }
    }
    
    // Marcar pedido como entregue
    const { error: orderError } = await supabase
      .from('food_orders')
      .update({ 
        status: 'delivered',
        ready_at: new Date().toISOString()
      })
      .eq('id', orderId);
    
    if (orderError) throw orderError;
  },

  async cancelFoodOrder(orderId: string): Promise<void> {
    const { error } = await supabase
      .from('food_orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId);
    if (error) throw error;
  },

  async getUserPendingOrders(userId: string): Promise<FoodOrder[]> {
    const { data, error } = await supabase
      .from('food_orders')
      .select('*')
      .eq('customer_id', userId)
      .in('status', ['pending', 'preparing'])
      .order('created_at', { ascending: false });
    
    if (error || !data) return [];
    return data as FoodOrder[];
  },

  // ============ JYP BANDIT SYSTEM ============
  async getLastJYPAppearance(): Promise<any | null> {
    const { data, error } = await supabase
      .from('jyp_appearances')
      .select('*')
      .order('appeared_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.error("Erro ao buscar última aparição do JYP:", error);
      return null;
    }
    return data;
  },

  async recordJYPAppearance(
    location: string,
    subLocation: string | undefined,
    victimId: string,
    victimName: string,
    stolenAmount: number,
    message: string
  ): Promise<void> {
    const { error } = await supabase
      .from('jyp_appearances')
      .insert([{
        location,
        sub_location: subLocation,
        victim_id: victimId,
        victim_name: victimName,
        stolen_amount: stolenAmount,
        message
      }]);
    
    if (error) {
      console.error("Erro ao registrar aparição do JYP:", error);
      throw error;
    }
  },

  async getJYPAppearances(limit: number = 10): Promise<any[]> {
    const { data, error } = await supabase
      .from('jyp_appearances')
      .select('*')
      .order('appeared_at', { ascending: false })
      .limit(limit);
    
    if (error) return [];
    return data || [];
  },

  async tryTriggerJYPRobbery(minIntervalMs: number): Promise<boolean> {
    const { data, error } = await supabase.rpc('try_trigger_jyp_robbery', {
      min_interval_ms: minIntervalMs
    });
    
    if (error) {
      console.error("Erro ao tentar trigger JYP:", error);
      return false;
    }
    return data === true;
  },

  // ============ VIP RESERVATIONS ============
  async createVIPReservation(
    location: string,
    reserverId: string,
    reserverName: string,
    price: number,
    guests: { id: string; name: string }[]
  ): Promise<string> {
    // Criar reserva
    const { data: reservation, error: reservationError } = await supabase
      .from('vip_reservations')
      .insert([{
        location,
        reserver_id: reserverId,
        reserver_name: reserverName,
        price,
        status: 'pending'
      }])
      .select()
      .single();
    
    if (reservationError) throw reservationError;
    
    // Adicionar convidados
    const guestInserts = guests.map(guest => ({
      reservation_id: reservation.id,
      user_id: guest.id,
      user_name: guest.name
    }));
    
    const { error: guestsError } = await supabase
      .from('vip_reservation_guests')
      .insert(guestInserts);
    
    if (guestsError) throw guestsError;
    
    return reservation.id;
  },

  async getPendingVIPReservations(location: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('vip_reservations')
      .select('*')
      .eq('location', location)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    
    if (error || !data) return [];
    
    // Buscar convidados para cada reserva
    const reservationsWithGuests = await Promise.all(data.map(async (res) => {
      const { data: guests } = await supabase
        .from('vip_reservation_guests')
        .select('*')
        .eq('reservation_id', res.id);
      
      return { ...res, guests: guests || [] };
    }));
    
    return reservationsWithGuests;
  },

  async approveVIPReservation(reservationId: string, approverId: string): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    
    const { error } = await supabase
      .from('vip_reservations')
      .update({
        status: 'approved',
        approved_by: approverId,
        approved_at: now.toISOString(),
        expires_at: expiresAt.toISOString()
      })
      .eq('id', reservationId);
    
    if (error) throw error;
  },

  async rejectVIPReservation(reservationId: string, reserverId: string, price: number): Promise<void> {
    // Devolver dinheiro ao usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('money')
      .eq('user_id', reserverId)
      .single();
    
    if (profile) {
      await supabase
        .from('profiles')
        .update({ money: profile.money + price })
        .eq('user_id', reserverId);
    }
    
    // Deletar a reserva
    const { error } = await supabase
      .from('vip_reservations')
      .delete()
      .eq('id', reservationId);
    
    if (error) throw error;
  },

  async checkVIPAccess(userId: string, location: string): Promise<boolean> {
    const now = new Date().toISOString();
    
    // Verificar se o usuário é o reservador ou convidado de uma reserva ativa
    const { data: reservations } = await supabase
      .from('vip_reservations')
      .select('id, reserver_id')
      .eq('location', location)
      .eq('status', 'approved')
      .gt('expires_at', now);
    
    if (!reservations || reservations.length === 0) return false;
    
    // Verificar se é o reservador
    const isReserver = reservations.some(r => r.reserver_id === userId);
    if (isReserver) return true;
    
    // Verificar se é convidado
    const reservationIds = reservations.map(r => r.id);
    const { data: guestEntry } = await supabase
      .from('vip_reservation_guests')
      .select('id')
      .eq('user_id', userId)
      .in('reservation_id', reservationIds)
      .maybeSingle();
    
    return !!guestEntry;
  },

  async getActiveVIPReservation(location: string): Promise<any | null> {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('vip_reservations')
      .select('*')
      .eq('location', location)
      .eq('status', 'approved')
      .gt('expires_at', now)
      .order('expires_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    
    if (error || !data) return null;
    
    // Buscar convidados
    const { data: guests } = await supabase
      .from('vip_reservation_guests')
      .select('*')
      .eq('reservation_id', data.id);
    
    return { ...data, guests: guests || [] };
  },

  // ============ SUPERMARKET ============
  async getSupermarketItems(): Promise<any[]> {
    const { data, error } = await supabase
      .from('supermarket_items')
      .select('*')
      .gt('stock', 0)
      .order('category');
    
    if (error) {
      console.error("Erro ao buscar itens do supermercado:", error);
      return [];
    }
    return data || [];
  },

  async getUserPurchasesThisWeek(userId: string): Promise<string[]> {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    const year = now.getFullYear();

    const { data, error } = await supabase
      .from('supermarket_purchases')
      .select('item_id')
      .eq('user_id', userId)
      .eq('week_number', weekNumber)
      .eq('year', year);
    
    if (error) return [];
    return data.map(p => p.item_id);
  },

  async purchaseSupermarketItem(userId: string, userName: string, item: any): Promise<void> {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    const year = now.getFullYear();

    // Verificar se já comprou este item nesta semana
    const { data: existingPurchase } = await supabase
      .from('supermarket_purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('item_id', item.item_id)
      .eq('week_number', weekNumber)
      .eq('year', year)
      .maybeSingle();
    
    if (existingPurchase) {
      throw new Error("Você já comprou este item esta semana!");
    }

    // Verificar estoque
    const { data: itemData } = await supabase
      .from('supermarket_items')
      .select('stock')
      .eq('id', item.id)
      .single();
    
    if (!itemData || itemData.stock <= 0) {
      throw new Error("Item esgotado!");
    }

    // Reduzir estoque
    await supabase
      .from('supermarket_items')
      .update({ stock: itemData.stock - 1 })
      .eq('id', item.id);

    // Registrar compra
    await supabase
      .from('supermarket_purchases')
      .insert([{
        user_id: userId,
        item_id: item.item_id,
        week_number: weekNumber,
        year: year
      }]);

    // Adicionar ao inventário
    const { data: existingInv } = await supabase
      .from('inventory')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('item_id', item.item_id)
      .maybeSingle();

    if (existingInv) {
      await supabase
        .from('inventory')
        .update({ quantity: (existingInv.quantity || 1) + 1 })
        .eq('id', existingInv.id);
    } else {
      await supabase.from('inventory').insert([{
        user_id: userId,
        item_id: item.item_id,
        item_name: item.item_name,
        item_image: item.item_image,
        category: item.category,
        attributes: item.attributes
      }]);
    }
  },

  isSupermarketOpen(): boolean {
    // Verifica se é domingo no fuso horário do Brasil (UTC-3)
    const now = new Date();
    const brazilOffset = -3 * 60; // -3 horas em minutos
    const brazilTime = new Date(now.getTime() + (now.getTimezoneOffset() + brazilOffset) * 60000);
    return brazilTime.getDay() === 0; // 0 = domingo
  },

  // ============ FRIDGE (GELADEIRA COMPARTILHADA) ============
  async getFridgeItems(): Promise<any[]> {
    const { data, error } = await supabase
      .from('fridge_items')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Erro ao buscar itens da geladeira:", error);
      return [];
    }
    return data || [];
  },

  async addToFridge(userId: string, userName: string, item: any): Promise<void> {
    // Verificar se já existe este item na geladeira
    const { data: existing } = await supabase
      .from('fridge_items')
      .select('id, quantity')
      .eq('item_id', item.item_id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('fridge_items')
        .update({ quantity: (existing.quantity || 1) + 1 })
        .eq('id', existing.id);
    } else {
      await supabase.from('fridge_items').insert([{
        added_by: userId,
        added_by_name: userName,
        item_id: item.item_id,
        item_name: item.item_name,
        item_image: item.item_image,
        category: item.category,
        attributes: item.attributes
      }]);
    }
  },

  async takeFromFridge(userId: string, fridgeItemId: string, quantity: number): Promise<any> {
    // Buscar item da geladeira
    const { data: fridgeItem, error: fetchError } = await supabase
      .from('fridge_items')
      .select('*')
      .eq('id', fridgeItemId)
      .single();
    
    if (fetchError || !fridgeItem) throw new Error('Item não encontrado na geladeira');

    // Reduzir quantidade na geladeira
    if (quantity > 1) {
      await supabase.from('fridge_items').update({ quantity: quantity - 1 }).eq('id', fridgeItemId);
    } else {
      await supabase.from('fridge_items').delete().eq('id', fridgeItemId);
    }

    // Adicionar ao inventário do usuário
    const { data: existingInv } = await supabase
      .from('inventory')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('item_id', fridgeItem.item_id)
      .maybeSingle();

    if (existingInv) {
      await supabase
        .from('inventory')
        .update({ quantity: (existingInv.quantity || 1) + 1 })
        .eq('id', existingInv.id);
    } else {
      await supabase.from('inventory').insert([{
        user_id: userId,
        item_id: fridgeItem.item_id,
        item_name: fridgeItem.item_name,
        item_image: fridgeItem.item_image,
        category: fridgeItem.category,
        attributes: fridgeItem.attributes
      }]);
    }

    return fridgeItem;
  },

  async moveToFridge(userId: string, userName: string, inventoryItemId: string, quantity: number): Promise<void> {
    // Buscar item do inventário
    const { data: invItem, error: fetchError } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', inventoryItemId)
      .single();
    
    if (fetchError || !invItem) throw new Error('Item não encontrado no inventário');

    // Adicionar à geladeira
    await this.addToFridge(userId, userName, invItem);

    // Reduzir quantidade do inventário
    if (quantity > 1) {
      await supabase.from('inventory').update({ quantity: quantity - 1 }).eq('id', inventoryItemId);
    } else {
      await supabase.from('inventory').delete().eq('id', inventoryItemId);
    }
  },

  // ============ RECIPES (RECEITAS) ============
  async getRecipes(): Promise<any[]> {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('name');
    
    if (error) {
      console.error("Erro ao buscar receitas:", error);
      return [];
    }
    return data || [];
  },

  async prepareRecipe(userId: string, userName: string, recipe: any): Promise<void> {
    // Buscar inventário do usuário
    const inventory = await this.getInventory(userId);
    
    // Verificar se tem todos os ingredientes
    const ingredients = recipe.ingredients as Array<{ item_id: string; item_name: string; quantity: number }>;
    
    for (const ingredient of ingredients) {
      const invItem = inventory.find(i => i.item_id === ingredient.item_id);
      if (!invItem || invItem.quantity < ingredient.quantity) {
        throw new Error(`Falta ingrediente: ${ingredient.item_name}`);
      }
    }

    // Consumir ingredientes do inventário
    for (const ingredient of ingredients) {
      const invItem = inventory.find(i => i.item_id === ingredient.item_id);
      if (invItem) {
        const newQty = invItem.quantity - ingredient.quantity;
        if (newQty <= 0) {
          await supabase.from('inventory').delete().eq('id', invItem.id);
        } else {
          await supabase.from('inventory').update({ quantity: newQty }).eq('id', invItem.id);
        }
      }
    }

    // Adicionar resultado da receita ao inventário
    const { data: existing } = await supabase
      .from('inventory')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('item_id', recipe.result_item_id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('inventory')
        .update({ quantity: (existing.quantity || 1) + 1 })
        .eq('id', existing.id);
    } else {
      await supabase.from('inventory').insert([{
        user_id: userId,
        item_id: recipe.result_item_id,
        item_name: recipe.result_item_name,
        item_image: recipe.result_item_image,
        category: recipe.result_category,
        attributes: recipe.result_attributes
      }]);
    }
  },

  checkRecipeIngredients(recipe: any, inventory: any[]): { hasAll: boolean; missing: string[] } {
    const ingredients = recipe.ingredients as Array<{ item_id: string; item_name: string; quantity: number }>;
    const missing: string[] = [];

    for (const ingredient of ingredients) {
      const invItem = inventory.find(i => i.item_id === ingredient.item_id);
      if (!invItem || invItem.quantity < ingredient.quantity) {
        missing.push(ingredient.item_name);
      }
    }

    return { hasAll: missing.length === 0, missing };
  }
};