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
            health: 100,
            hunger: 100,
            energy: 100,
            alcoholism: 0,
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
        hp: data.health ?? 100,
        maxHp: 100,
        hunger: data.hunger ?? 100,
        thirst: data.energy ?? 100,
        alcohol: data.alcoholism ?? 0,
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
        id: p.user_id,
        name: p.full_name || 'Usuário',
        username: p.username || 'user',
        avatar: p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.user_id}`,
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
  }
};