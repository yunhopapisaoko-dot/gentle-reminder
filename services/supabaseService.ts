import { supabase } from '../supabase';
import { Post, User, JobApplication, MenuItem, FoodOrder, OrderItem, VIPReservation } from '../types';

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 30000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`A operação excedeu o tempo limite.`)), timeoutMs)
    )
  ]);
};

export const supabaseService = {
  // --- PERFIL E STATUS ---
  async getProfile(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
      if (error || !data) return null;
      
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
        currentDisease: data.current_disease || undefined,
        last_spin_at: data.last_spin_at,
        isActiveRP: data.is_active_rp ?? true
      };
    } catch { return null; }
  },

  async getAllProfiles(): Promise<User[]> {
    const { data } = await supabase.from('profiles').select('*').order('updated_at', { ascending: false });
    return (data || []).map((p: any) => ({
      id: p.user_id,
      name: p.full_name || 'Usuário',
      username: p.username || 'user',
      avatar: p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.user_id}`,
      race: p.race,
      bio: p.bio || '',
      banner: p.banner_url,
      money: p.money,
      isActiveRP: p.is_active_rp,
      isLeader: p.is_leader
    }));
  },

  async getProfilesByIds(userIds: string[]): Promise<any[]> {
    if (!userIds.length) return [];
    const { data, error } = await supabase.from('profiles').select('*').in('user_id', userIds);
    if (error) {
      console.error('[supabaseService] getProfilesByIds error:', error);
      return [];
    }
    return data || [];
  },

  async updateRoleplayStatus(userId: string, isActive: boolean) {
    await supabase.from('profiles').update({ is_active_rp: isActive }).eq('user_id', userId);
  },

  async updateCurrentLocation(userId: string, location: string | null, subLocation: string | null = null) {
    await supabase.from('profiles').update({ 
      current_location: location, 
      current_sub_location: subLocation 
    }).eq('user_id', userId);
  },

  async getCurrentLocation(userId: string): Promise<{ location: string | null, subLocation: string | null }> {
    const { data } = await supabase.from('profiles')
      .select('current_location, current_sub_location')
      .eq('user_id', userId)
      .maybeSingle();
    return {
      location: data?.current_location || null,
      subLocation: data?.current_sub_location || null
    };
  },

  async updateMoney(userId: string, newBalance: number) {
    await supabase.from('profiles').update({ money: newBalance }).eq('user_id', userId);
  },

  async updateVitalStatus(userId: string, updates: any) {
    await supabase.from('profiles').update(updates).eq('user_id', userId);
  },

  // --- CASAS E ACESSOS ---
  async getUserHouse(userId: string) {
    const { data } = await supabase.from('houses').select('*').eq('owner_id', userId).maybeSingle();
    return data;
  },

  async buyHouse(userId: string, userName: string) {
    const { error } = await supabase.from('houses').insert([{ owner_id: userId, owner_name: userName }]);
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

  // --- PERSONAGENS ---
  async getUserCharacterAge(userId: string): Promise<number | null> {
    const { data } = await supabase
      .from('characters')
      .select('age')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return data?.age ?? null;
  },

  async getAllCharacters() {
    const { data } = await supabase.from('characters').select('*, profiles(full_name, username, avatar_url)').order('created_at', { ascending: false });
    return data || [];
  },

  async createCharacter(charData: any) {
    const { error } = await supabase.from('characters').insert([charData]);
    if (error) throw error;
  },

  async updateCharacter(id: string, charData: any) {
    const { error } = await supabase.from('characters').update(charData).eq('id', id);
    if (error) throw error;
  },

  async deleteCharacter(id: string) {
    await supabase.from('characters').delete().eq('id', id);
  },

  // --- CHAT E MENSAGENS ---
  async getChatMessages(location: string, subLocation?: string | null) {
    const loc = (location || '').trim().toLowerCase();
    console.log('[getChatMessages] Loading messages for:', { location, loc, subLocation });

    // Supabase/PostgREST defaults to 1000 rows per request.
    // For chats with 1000+ mensagens (ex.: Pousada), precisamos paginar para não “sumir” mensagem ao reabrir o chat.
    const PAGE_SIZE = 1000;

    const fetchAll = async (
      build: (from: number, to: number) => any
    ): Promise<any[] | null> => {
      const rows: any[] = [];
      let from = 0;

      while (true) {
        const to = from + PAGE_SIZE - 1;
        const { data, error } = await (build(from, to) as any);

        if (error) {
          console.error('Error loading chat messages:', error);
          return null;
        }

        const batch = data || [];
        rows.push(...batch);

        if (batch.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }

      return rows;
    };

    const allData = subLocation
      ? await fetchAll((from, to) =>
          supabase
            .from('chat_messages')
            .select('*')
            .ilike('location', loc)
            .eq('sub_location', subLocation)
            .order('created_at', { ascending: true })
            .range(from, to)
        )
      : await fetchAll((from, to) =>
          supabase
            .from('chat_messages')
            .select('*')
            .ilike('location', loc)
            // Sala principal: sub_location NULL ou string vazia
            .or('sub_location.is.null,sub_location.eq.')
            .order('created_at', { ascending: true })
            .range(from, to)
        );

    if (!allData) return null;

    console.log('[getChatMessages] Query result:', {
      count: allData.length,
      location,
      subLocation,
      firstMsg: allData?.[0]?.content,
      lastMsg: allData?.[allData.length - 1]?.content,
    });

    if (allData.length === 0) return [];

    const userIds = [...new Set(allData.map((m: any) => m.user_id))];

    // Evita estourar limites do PostgREST em chats com muitos participantes.
    const profiles: any[] = [];
    const CHUNK = 500;
    for (let i = 0; i < userIds.length; i += CHUNK) {
      const chunk = userIds.slice(i, i + CHUNK);
      const { data: p, error: pError } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url, race, current_disease')
        .in('user_id', chunk);

      if (pError) {
        console.error('[getChatMessages] Error loading profiles:', pError);
        continue;
      }

      profiles.push(...(p || []));
    }

    const profileMap = new Map(profiles.map((p: any) => [p.user_id, p]));

    return allData.map((msg: any) => ({
      ...msg,
      profiles: profileMap.get(msg.user_id),
    }));
  },

  async sendChatMessage(
    userId: string,
    location: string,
    content: string,
    charName?: string,
    charAvatar?: string,
    subLoc?: string
  ) {
    await supabase.from('chat_messages').insert([
      {
        user_id: userId,
        location,
        content,
        character_name: charName,
        character_avatar: charAvatar,
        sub_location: subLoc,
      },
    ]);

    // Enviar push para todos os usuários (exceto remetente) com preview da mensagem.
    // Isso garante notificação mesmo quando o app está fechado (via Service Worker).
    try {
      const preview = (content || '').replace(/\s+/g, ' ').trim();
      const previewText = preview.length > 100 ? `${preview.slice(0, 100)}...` : preview;
      const locationLabel = subLoc ? `${location} - ${subLoc}` : location;

      await supabase.functions.invoke('send-push-notification', {
        body: {
          broadcastExcept: userId,
          title: `📍 ${locationLabel}`,
          body: `${charName || 'Alguém'}: ${previewText}`,
          type: 'chat_message',
          location,
          url: '/',
        },
      });
    } catch (e) {
      console.warn('[Push] Falha ao enviar push do chat:', e);
    }
  },

  // Mensagem de sistema (sem push notification) - para entrada/saída de usuários
  async sendSystemMessage(
    location: string,
    content: string,
    subLoc?: string
  ) {
    const SYSTEM_UUID = '00000000-0000-0000-0000-000000000000';
    await supabase.from('chat_messages').insert([
      {
        user_id: SYSTEM_UUID,
        location,
        content,
        character_name: 'Sistema',
        character_avatar: null,
        sub_location: subLoc,
      },
    ]);
  },

  // --- ECONOMIA E INVENTÁRIO ---
  async getInventory(userId: string) {
    const { data } = await supabase.from('inventory').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return data || [];
  },

  async addToInventory(userId: string, item: any) {
    const { data: existing } = await supabase.from('inventory').select('id, quantity').eq('user_id', userId).eq('item_id', item.id).maybeSingle();
    if (existing) {
      await supabase.from('inventory').update({ quantity: (existing.quantity || 1) + 1 }).eq('id', existing.id);
    } else {
      await supabase.from('inventory').insert([{
        user_id: userId,
        item_id: item.id,
        item_name: item.name,
        item_image: item.image,
        category: item.category,
        attributes: { hunger: item.hungerRestore, thirst: item.thirstRestore, alcohol: item.alcoholLevel }
      }]);
    }
  },

  async consumeFromInventory(id: string, qty: number) {
    if (qty > 1) await supabase.from('inventory').update({ quantity: qty - 1 }).eq('id', id);
    else await supabase.from('inventory').delete().eq('id', id);
  },

  // --- TRABALHO E GERÊNCIA ---
  async checkWorkerStatus(userId: string, location: string) {
    const { data } = await supabase.from('establishment_workers').select('role').eq('user_id', userId).eq('location', location).maybeSingle();
    return data?.role || null;
  },

  async applyForJob(app: any) {
    const payload = {
      ...app,
      location: typeof app?.location === 'string' ? app.location.toLowerCase() : app.location,
    };
    await supabase.from('job_applications').insert([payload]);
  },

  async getJobApplications(location: string): Promise<JobApplication[]> {
    const loc = (location || '').toLowerCase();

    // 1) Busca fichas pendentes (normalizando o location)
    const { data: apps, error: appsError } = await supabase
      .from('job_applications')
      .select('*')
      .eq('status', 'pending')
      .eq('location', loc);

    if (appsError) throw appsError;
    if (!apps || apps.length === 0) return [];

    // 2) Busca profiles separadamente (pra exibir username/avatar)
    const userIds = apps.map(a => a.user_id).filter(Boolean);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, username, avatar_url')
      .in('user_id', userIds);

    if (profilesError) throw profilesError;

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    return apps.map(app => ({
      ...app,
      profiles: profileMap.get(app.user_id) || null,
    })) as unknown as JobApplication[];
  },

  async approveApplication(id: string, userId: string, location: string, role: string) {
    await supabase.from('job_applications').update({ status: 'approved' }).eq('id', id);
    await supabase.from('establishment_workers').upsert([{ user_id: userId, location, role }]);
  },

  async rejectApplication(id: string) {
    await supabase.from('job_applications').update({ status: 'rejected' }).eq('id', id);
  },

  async getLocationWorkers(location: string) {
    const loc = (location || '').toLowerCase();
    const { data: workers, error } = await supabase
      .from('establishment_workers')
      .select('*')
      .eq('location', loc);
    
    if (error || !workers || workers.length === 0) return [];
    
    const userIds = workers.map(w => w.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, username, avatar_url')
      .in('user_id', userIds);
    
    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
    
    return workers.map(w => ({
      ...w,
      profile: profileMap.get(w.user_id) || null
    }));
  },

  async fireWorker(userId: string, location: string) {
    const loc = (location || '').toLowerCase();
    const { error } = await supabase
      .from('establishment_workers')
      .delete()
      .eq('user_id', userId)
      .eq('location', loc);
    if (error) throw error;
  },

  // --- RESERVAS VIP ---
  async checkVIPAccess(userId: string, location: string) {
    const { data } = await supabase.from('vip_reservations')
      .select('id, vip_reservation_guests!inner(user_id)')
      .eq('location', location)
      .eq('status', 'approved')
      .eq('vip_reservation_guests.user_id', userId)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
    return !!data;
  },

  async getActiveVIPReservation(location: string) {
    const { data } = await supabase.from('vip_reservations').select('*').eq('location', location).eq('status', 'approved').gt('expires_at', new Date().toISOString()).maybeSingle();
    return data;
  },

  async createVIPReservation(location: string, reserverId: string, name: string, price: number, guests: any[]) {
    const { data: res, error } = await supabase.from('vip_reservations').insert([{
      location, reserver_id: reserverId, reserver_name: name, price, status: 'pending'
    }]).select().single();
    if (error) throw error;
    const guestRows = guests.map(g => ({ reservation_id: res.id, user_id: g.id, user_name: g.name }));
    await supabase.from('vip_reservation_guests').insert(guestRows);
  },

  // --- PEDIDOS DE COMIDA ---
  async createFoodOrder(userId: string, name: string, loc: string, items: any[], total: number, time: number) {
    const { error } = await supabase.from('food_orders').insert([{
      customer_id: userId, customer_name: name, location: loc, items, total_price: Math.round(total), preparation_time: time, status: 'pending'
    }]);
    if (error) throw new Error(error.message);
  },

  async getPendingFoodOrders(location: string): Promise<FoodOrder[]> {
    const { data } = await supabase.from('food_orders').select('*').eq('location', location).in('status', ['pending', 'preparing']).order('created_at', { ascending: true });
    return (data || []) as unknown as FoodOrder[];
  },

  async approveFoodOrder(id: string, workerId: string) {
    const readyAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // Mock 5 min
    await supabase.from('food_orders').update({ status: 'preparing', approved_by: workerId, approved_at: new Date().toISOString(), ready_at: readyAt }).eq('id', id);
  },

  async completeFoodOrder(id: string) {
    const { data: order } = await supabase.from('food_orders').select('*').eq('id', id).single();
    if (order) {
      const items = order.items as any[];
      for (const item of items) {
        await this.addToInventory(order.customer_id, item);
      }
      await supabase.from('food_orders').update({ status: 'delivered' }).eq('id', id);
    }
  },

  // --- TRATAMENTOS HOSPITALARES ---
  async createTreatmentRequest(userId: string, diseaseId: string, name: string, cost: number, time: number) {
    await supabase.from('treatment_requests').insert([{
      patient_id: userId, disease_id: diseaseId, disease_name: name, treatment_cost: cost, cure_time_minutes: time, status: 'pending'
    }]);
  },

  async getUserPendingTreatment(userId: string) {
    const { data } = await supabase.from('treatment_requests').select('*').eq('patient_id', userId).eq('status', 'pending').maybeSingle();
    return data;
  },

  async getUserActiveTreatment(userId: string) {
    const { data } = await supabase.from('treatment_requests').select('*').eq('patient_id', userId).eq('status', 'approved').maybeSingle();
    return data;
  },

  // --- ROLEPLAY EXTRA ---
  async recordJYPAppearance(loc: string, sub: any, vicId: string, vicName: string, amt: number, msg: string) {
    await supabase.from('jyp_appearances').insert([{
      location: loc, sub_location: sub, victim_id: vicId, victim_name: vicName, stolen_amount: amt, message: msg
    }]);
  },

  async tryTriggerJYPRobbery(cooldown: number): Promise<boolean> {
    const { data } = await supabase.rpc('try_trigger_jyp_robbery', { min_interval_ms: cooldown });
    return !!data;
  },

  async getLastJYPAppearance() {
    const { data } = await supabase.from('jyp_appearances').select('*').order('appeared_at', { ascending: false }).limit(1).maybeSingle();
    return data;
  },

  // Busca usuários que enviaram mensagens recentemente (nos últimos X minutos) em pousada ou praia
  async getActiveChattingUsers(minutesAgo: number = 30) {
    const cutoffTime = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
    
    // Busca mensagens recentes apenas de pousada e praia (excluindo bots)
    const { data: recentMessages } = await supabase
      .from('chat_messages')
      .select('user_id')
      .in('location', ['pousada', 'praia'])
      .gte('created_at', cutoffTime)
      .neq('user_id', 'jyp-bandit');
    
    if (!recentMessages || recentMessages.length === 0) return [];
    
    // Pega IDs únicos de usuários (filtrando UUIDs válidos)
    const uniqueUserIds = [...new Set(recentMessages.map(m => m.user_id))].filter(id => {
      // Verifica se é um UUID válido (não é um ID de bot)
      return id && id.length === 36 && id.includes('-');
    });
    
    if (uniqueUserIds.length === 0) return [];
    
    // Busca perfis desses usuários com seus dados de dinheiro
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, username, avatar_url, race, money')
      .in('user_id', uniqueUserIds);
    
    return profiles || [];
  },

  // --- POSTS ---
  async getPosts() {
    const { data } = await supabase.from('posts').select('*, profiles(full_name, username, avatar_url, race, is_leader)').order('created_at', { ascending: false });
    
    if (!data || data.length === 0) return [];
    
    // Busca contagem de likes para todos os posts
    const postIds = data.map((p: any) => p.id);
    const { data: likesData } = await supabase
      .from('likes')
      .select('post_id')
      .in('post_id', postIds);
    
    // Conta likes por post
    const likesCount: Record<string, number> = {};
    (likesData || []).forEach((like: any) => {
      likesCount[like.post_id] = (likesCount[like.post_id] || 0) + 1;
    });
    
    return data.map((post: any) => ({
      id: post.id,
      title: post.title,
      excerpt: post.content,
      imageUrl: post.image_url,
      videoUrl: post.video_url,
      timestamp: new Date(post.created_at).toLocaleDateString(),
      likes: String(likesCount[post.id] || 0),
      author: {
        id: post.user_id,
        name: post.profiles?.full_name,
        username: post.profiles?.username,
        avatar: post.profiles?.avatar_url,
        race: post.profiles?.race
      }
    }));
  },

  async createPost(userId: string, title: string, content: string, imageUrl?: string) {
    const { error } = await supabase.from('posts').insert([{
      user_id: userId,
      title,
      content,
      image_url: imageUrl || null
    }]);
    if (error) throw error;
  },

  async getPostsByUser(userId: string) {
    const { data } = await supabase.from('posts').select('*, profiles(full_name, username, avatar_url, race, is_leader)').eq('user_id', userId).order('created_at', { ascending: false });
    
    if (!data || data.length === 0) return [];
    
    // Busca contagem de likes para os posts do usuário
    const postIds = data.map((p: any) => p.id);
    const { data: likesData } = await supabase
      .from('likes')
      .select('post_id')
      .in('post_id', postIds);
    
    // Conta likes por post
    const likesCount: Record<string, number> = {};
    (likesData || []).forEach((like: any) => {
      likesCount[like.post_id] = (likesCount[like.post_id] || 0) + 1;
    });
    
    return data.map((post: any) => ({
      id: post.id,
      title: post.title,
      excerpt: post.content,
      imageUrl: post.image_url,
      videoUrl: post.video_url,
      timestamp: new Date(post.created_at).toLocaleDateString(),
      likes: String(likesCount[post.id] || 0),
      author: {
        id: post.user_id,
        name: post.profiles?.full_name,
        username: post.profiles?.username,
        avatar: post.profiles?.avatar_url,
        race: post.profiles?.race
      }
    }));
  },

  async updateLastSpin(userId: string) {
    await supabase.from('profiles').update({ last_spin_at: new Date().toISOString() }).eq('user_id', userId);
  },

  async applyDiseaseFromRoulette(userId: string, id: string, hp: number) {
    await supabase.from('profiles').update({ current_disease: id, health: hp }).eq('user_id', userId);
  },

  async applyPrizeFromRoulette(userId: string, amt: number) {
    const { data } = await supabase.from('profiles').select('money').eq('user_id', userId).single();
    await supabase.from('profiles').update({ money: (data?.money || 0) + amt }).eq('user_id', userId);
  },

  async updateLeaderStatus(userId: string, status: boolean) {
    await supabase.from('profiles').update({ is_leader: status }).eq('user_id', userId);
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
    
    const { error } = await supabase.from('profiles').update(updateData).eq('user_id', userId);
    if (error) throw error;
  },

  // --- UPLOAD DE ARQUIVOS ---
  async uploadFile(bucket: string, path: string, file: File): Promise<string> {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: true
    });
    if (error) throw error;
    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return publicData.publicUrl;
  },

  async uploadAvatar(userId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `avatar_${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;
    return this.uploadFile('avatars', filePath, file);
  },

  async uploadBanner(userId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `banner_${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;
    return this.uploadFile('avatars', filePath, file);
  },

  // --- GELADEIRA ---
  async getFridgeItems() {
    const { data } = await supabase.from('fridge_items').select('*').order('created_at', { ascending: false });
    return data || [];
  },

  async takeFromFridge(userId: string, itemId: string, quantity?: number) {
    const { data: item } = await supabase.from('fridge_items').select('*').eq('id', itemId).single();
    if (item) {
      await this.addToInventory(userId, {
        id: item.item_id,
        name: item.item_name,
        image: item.item_image,
        category: item.category,
        hungerRestore: (item.attributes as any)?.hunger,
        thirstRestore: (item.attributes as any)?.thirst,
        alcoholLevel: (item.attributes as any)?.alcohol
      });
      if ((item.quantity || 1) > 1) {
        await supabase.from('fridge_items').update({ quantity: (item.quantity || 1) - 1 }).eq('id', itemId);
      } else {
        await supabase.from('fridge_items').delete().eq('id', itemId);
      }
    }
  },

  async moveToFridge(userId: string, userName: string, invItemId: string, quantity?: number) {
    const { data: inv } = await supabase.from('inventory').select('*').eq('id', invItemId).single();
    if (inv) {
      await supabase.from('fridge_items').insert([{
        item_id: inv.item_id,
        item_name: inv.item_name,
        item_image: inv.item_image,
        category: inv.category,
        attributes: inv.attributes,
        added_by: userId,
        added_by_name: userName
      }]);
      await this.consumeFromInventory(invItemId, inv.quantity || 1);
    }
  },

  // --- TRATAMENTOS ---
  async completeTreatment(treatmentId: string, patientId: string) {
    await supabase.from('treatment_requests').update({ status: 'completed' }).eq('id', treatmentId);
    await supabase.from('profiles').update({ current_disease: null, health: 100 }).eq('user_id', patientId);
  },

  async cancelTreatmentRequest(treatmentId: string) {
    await supabase.from('treatment_requests').delete().eq('id', treatmentId);
  },

  async getPendingTreatments(location?: string) {
    const { data } = await supabase
      .from('treatment_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    
    if (!data || data.length === 0) return [];
    
    // Buscar profiles dos pacientes
    const patientIds = [...new Set(data.map(t => t.patient_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, username, avatar_url, money')
      .in('user_id', patientIds);
    
    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
    
    return data.map(t => ({
      ...t,
      patient: profileMap.get(t.patient_id) || null
    }));
  },

  async approveTreatment(treatmentId: string, workerId: string, requiredRoom?: string) {
    await supabase.from('treatment_requests').update({ 
      status: 'approved', 
      approved_by: workerId, 
      approved_at: new Date().toISOString(),
      required_room: requiredRoom || null
    }).eq('id', treatmentId);
  },

  async startTreatmentTimer(treatmentId: string) {
    await supabase.from('treatment_requests').update({ 
      started_at: new Date().toISOString()
    }).eq('id', treatmentId);
  },

  async rejectTreatment(treatmentId: string) {
    await supabase.from('treatment_requests').update({ status: 'rejected' }).eq('id', treatmentId);
  },

  // --- RECEITAS ---
  async getRecipes() {
    const { data } = await supabase.from('recipes').select('*').order('name');
    return data || [];
  },

  async prepareRecipe(userId: string, userName: string, recipe: any) {
    const ingredients = recipe.ingredients as any[];
    const { data: inventory } = await supabase.from('inventory').select('*').eq('user_id', userId);
    const invMap = new Map<string, { id: string; quantity: number }>((inventory || []).map((i: any) => [i.item_id, { id: i.id, quantity: i.quantity || 1 }]));
    
    for (const ing of ingredients) {
      const inv = invMap.get(ing.item_id);
      if (!inv || inv.quantity < (ing.quantity || 1)) {
        throw new Error(`Ingrediente insuficiente: ${ing.name || ing.item_id}`);
      }
      await this.consumeFromInventory(inv.id, inv.quantity - (ing.quantity || 1) + 1);
    }
    
    await this.addToInventory(userId, {
      id: recipe.result_item_id,
      name: recipe.result_item_name,
      image: recipe.result_item_image,
      category: recipe.result_category,
      hungerRestore: (recipe.result_attributes as any)?.hunger,
      thirstRestore: (recipe.result_attributes as any)?.thirst,
      alcoholLevel: (recipe.result_attributes as any)?.alcohol
    });
  },

  checkRecipeIngredients(recipe: any, inventory: any[]): { hasAll: boolean; missing: string[] } {
    const ingredients = recipe.ingredients as any[];
    const invMap = new Map((inventory || []).map(i => [i.item_id, i.quantity || 1]));
    const missing: string[] = [];
    
    for (const ing of ingredients) {
      const available = invMap.get(ing.item_id) || 0;
      if (available < (ing.quantity || 1)) {
        missing.push(ing.name || ing.item_id);
      }
    }
    
    return { hasAll: missing.length === 0, missing };
  },

  // --- SUPERMERCADO ---
  isSupermarketOpen(): boolean {
    const now = new Date();
    const hours = now.getHours();
    return hours >= 8 && hours < 22;
  },

  async getSupermarketItems() {
    const { data } = await supabase.from('supermarket_items').select('*').gt('stock', 0).order('category');
    return data || [];
  },

  async getUserPurchasesThisWeek(userId: string) {
    const now = new Date();
    const weekNumber = Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
    const { data } = await supabase.from('supermarket_purchases').select('item_id').eq('user_id', userId).eq('year', now.getFullYear()).eq('week_number', weekNumber);
    return (data || []).map(p => p.item_id);
  },

  async purchaseSupermarketItem(userId: string, userName: string, item: any) {
    if (item.stock <= 0) throw new Error('Item indisponível');
    
    const { data: profile } = await supabase.from('profiles').select('money').eq('user_id', userId).single();
    if ((profile?.money || 0) < item.price) throw new Error('Saldo insuficiente');

    await supabase.from('profiles').update({ money: (profile?.money || 0) - item.price }).eq('user_id', userId);
    await supabase.from('supermarket_items').update({ stock: item.stock - 1 }).eq('id', item.id);
    
    const now = new Date();
    const weekNumber = Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
    await supabase.from('supermarket_purchases').insert([{ user_id: userId, item_id: item.item_id, year: now.getFullYear(), week_number: weekNumber }]);

    await this.addToInventory(userId, {
      id: item.item_id,
      name: item.item_name,
      image: item.item_image,
      category: item.category,
      hungerRestore: (item.attributes as any)?.hunger,
      thirstRestore: (item.attributes as any)?.thirst,
      alcoholLevel: (item.attributes as any)?.alcohol
    });
  },

  // --- VIP RESERVATIONS ---
  async getPendingVIPReservations(location: string): Promise<VIPReservation[]> {
    const { data } = await supabase.from('vip_reservations').select('*, vip_reservation_guests(*)').eq('location', location).eq('status', 'pending').order('created_at', { ascending: true });
    return (data || []).map((r: any) => ({
      ...r,
      guests: r.vip_reservation_guests || []
    })) as VIPReservation[];
  },

  async approveVIPReservation(reservationId: string, workerId: string) {
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    await supabase.from('vip_reservations').update({ 
      status: 'approved', 
      approved_by: workerId, 
      approved_at: new Date().toISOString(),
      expires_at: expiresAt
    }).eq('id', reservationId);
  },

  async rejectVIPReservation(reservationId: string, reserverId?: string, price?: number) {
    if (reserverId && price) {
      const { data: profile } = await supabase.from('profiles').select('money').eq('user_id', reserverId).single();
      await supabase.from('profiles').update({ money: (profile?.money || 0) + price }).eq('user_id', reserverId);
    }
    await supabase.from('vip_reservations').update({ status: 'rejected' }).eq('id', reservationId);
  },

  // --- PEDIDOS DE COMIDA EXTRA ---
  async cancelFoodOrder(orderId: string) {
    await supabase.from('food_orders').delete().eq('id', orderId);
  },

  // --- MONKEYDOCTOR RANDOM APPEARANCES ---
  // Check if MonkeyDoctor has appeared in a specific hospital room today
  async hasMonkeyDoctorAppearedToday(roomName: string): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data } = await supabase
      .from('chat_messages')
      .select('id')
      .eq('location', 'hospital')
      .eq('sub_location', roomName)
      .eq('user_id', '00000000-0000-0000-0000-000000000002') // MonkeyDoctor UUID
      .gte('created_at', today.toISOString())
      .limit(1);
    
    return (data && data.length > 0);
  },

  // Send MonkeyDoctor random scene to a hospital room
  async sendMonkeyDoctorScene(roomName: string) {
    const MONKEYDOCTOR_UUID = '00000000-0000-0000-0000-000000000002';
    
    // Random scenes with proper formatting
    const scenes = [
      `*O Dr. MonkeyDoctor entra na sala balançando de galho em galho, mesmo sem haver galhos*\n\n*Coça a cabeça pensativo enquanto examina a sala*\n\nOoh ooh ah ah!\n\n- Alguém precisa de um exame? Ukk ukk!\n\n*Puxa uma banana do bolso do jaleco e dá uma mordida*\n\n- Banana é o melhor remédio... mas não conta pra ninguém! Eek eek!`,
      
      `*A porta se abre com um estrondo e MonkeyDoctor entra pulando*\n\nUkk ukk ukk!\n\n*Bate no peito com orgulho*\n\n- O melhor médico de Magictalk chegou!\n\n*Gira o estetoscópio como se fosse um brinquedo*\n\n- Quem quer ser examinado pelo doutor mais bonito do reino? Ooh ooh!`,
      
      `*MonkeyDoctor aparece pendurado na luminária*\n\nEek eek!\n\n*Desce graciosamente... e tropeça no próprio jaleco*\n\n- Estava só... testando a gravidade! Ukk ukk!\n\n*Levanta-se dignamente e ajeita os óculos*\n\n- Algum paciente precisa de cuidados mágicos? Ooh ooh ah ah!`,
      
      `*Uma banana desliza por debaixo da porta*\n\n*Segundos depois, MonkeyDoctor entra correndo atrás dela*\n\n- Minha banana de emergência! Ukk ukk!\n\n*Pega a banana e guarda no bolso*\n\n*Olha ao redor fingindo que nada aconteceu*\n\n- Ah sim, vim fazer minha ronda médica! Ooh ooh! Alguém adoentado?`,
      
      `*MonkeyDoctor surge da janela mesmo estando no térreo*\n\nOoh ooh ah ah!\n\n*Limpa poeira imaginária do jaleco*\n\n- O elevador estava muito cheio! Eek eek!\n\n*Tira um estetoscópio feito de banana do bolso*\n\n- Quem quer um diagnóstico premium? Ukk ukk!`
    ];
    
    const randomScene = scenes[Math.floor(Math.random() * scenes.length)];
    
    await supabase.from('chat_messages').insert([{
      user_id: MONKEYDOCTOR_UUID,
      location: 'hospital',
      sub_location: roomName,
      content: randomScene,
      character_name: 'MonkeyDoctor 🐵',
      character_avatar: '/monkeydoctor-avatar.jpg'
    }]);
  },

  // Try to trigger MonkeyDoctor appearance (random chance)
  async tryTriggerMonkeyDoctor(roomName: string): Promise<boolean> {
    // 15% chance of appearing
    if (Math.random() > 0.15) return false;
    
    // Check if already appeared today in this room
    const alreadyAppeared = await this.hasMonkeyDoctorAppearedToday(roomName);
    if (alreadyAppeared) return false;
    
    // Send the scene
    await this.sendMonkeyDoctorScene(roomName);
    return true;
  }
};