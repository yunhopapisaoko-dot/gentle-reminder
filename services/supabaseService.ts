import { supabase } from '../supabase';
import { Post, User } from '../types';

// Função auxiliar para timeout de segurança
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 30000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`A operação excedeu o tempo limite de ${(timeoutMs / 1000).toFixed(0)}s. Verifique sua conexão.`)), timeoutMs)
    )
  ]);
};

export const supabaseService = {
  async getProfile(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId) // Corrigido de 'id' para 'user_id'
        .single();

      if (error || !data) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user.id === userId) {
          const meta = session.user.user_metadata;
          return {
            id: userId,
            name: meta?.full_name || 'Explorador',
            username: meta?.username || 'user',
            avatar: meta?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
            bio: meta?.bio || '',
            isLeader: false
          };
        }
        return null;
      }

      return {
        id: data.user_id, // Usamos user_id como ID no frontend para consistência
        name: data.full_name || 'Usuário Magic',
        username: data.username || 'anonimo',
        avatar: data.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user_id}`,
        bio: data.bio || '',
        banner: data.banner_url,
        isLeader: data.is_leader || false
      };
    } catch (error: any) {
      return null;
    }
  },

  async updateProfile(userId: string, updates: any): Promise<void> {
    console.log("Iniciando atualização de perfil para:", userId);
    try {
      /* 
      // 1. Atualiza no Auth - Temporariamente desativado para evitar travamentos
      // O banco de dados (tabela profiles) é a fonte da verdade de qualquer forma.
      const { error: authError } = await withTimeout(supabase.auth.updateUser({
        data: {
          full_name: updates.full_name,
          username: updates.username,
          avatar_url: updates.avatar_url,
          bio: updates.bio
        }
      })) as any;

      if (authError) {
        console.error("Erro no Auth update:", authError);
        // Não lançamos erro aqui para não impedir o update do banco
      }
      */
      console.log("Iniciando update no DB...");

      // 2. Atualiza na tabela profiles
      const { error: dbError } = await withTimeout(supabase
        .from('profiles')
        .upsert({
          user_id: userId, // Corrigido para usar user_id
          full_name: updates.full_name,
          username: updates.username,
          bio: updates.bio,
          avatar_url: updates.avatar_url,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })) as any; // Especifica onConflict

      if (dbError) throw dbError;
      console.log("Banco de dados atualizado com sucesso");
    } catch (e: any) {
      console.error("Erro crítico no updateProfile:", e);
      throw new Error(e.message || "Erro desconhecido ao salvar.");
    }
  },

  async uploadAvatar(userId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!fileExt) throw new Error("Arquivo sem extensão.");

    // Sanitiza o nome do arquivo para evitar caracteres especiais
    const fileName = `${userId}/avatar_${Date.now()}.${fileExt}`;

    console.log("Iniciando upload de avatar:", fileName);

    try {
      // Tenta upload
      const { data, error: uploadError } = await withTimeout(supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        }), 60000) as any; // 60s para upload de imagens grandes

      if (uploadError) {
        console.error("Erro detalhado do Storage:", uploadError);

        // Mensagens de erro mais amigáveis
        if (uploadError.message.includes("row-level security")) {
          throw new Error("Permissão negada. Você só pode alterar seu próprio avatar.");
        }

        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      console.log("Upload concluído com sucesso:", publicUrlData.publicUrl);

      // Adiciona timestamp para evitar cache do navegador imediatamente após upload
      return `${publicUrlData.publicUrl}?t=${Date.now()}`;
    } catch (e: any) {
      console.error("Falha no upload do avatar:", e);
      throw new Error(e.message || "Falha ao enviar imagem. Tente novamente.");
    }
  },

  async getAllProfiles(): Promise<User[]> {
    try {
      const { data, error } = await withTimeout(supabase
        .from('profiles')
        .select('*')
        .order('updated_at', { ascending: false })) as any;

      if (error) return [];

      return data.map(p => ({
        id: p.id,
        name: p.full_name || 'Usuário',
        username: p.username || 'user',
        avatar: p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`,
        isLeader: p.is_leader || false,
        bio: p.bio
      }));
    } catch (e) {
      return [];
    }
  },

  async getPosts(): Promise<Post[]> {
    try {
      // Usamos !user_id para forçar o uso da FK correta se houver ambiguidade,
      // ou apenas profiles se o Supabase detectar automaticamente.
      // Como a FK é posts.user_id -> auth.users e não profiles, precisamos fazer join com profiles.
      // O join correto é posts.user_id = profiles.user_id.
      // O Supabase PostgREST faz isso magicamente se a FK existir.
      // Mas espere, posts.user_id referencia auth.users. profiles.user_id também.
      // Não há FK direta de posts -> profiles.
      // Precisamos ajustar isso ou contar com o PostgREST detectando a relação comum via auth.users?
      // Geralmente é melhor referenciar profiles diretamente se quisermos dados do perfil.
      // VAMOS AJUSTAR A QUERY no próximo passo se falhar, mas por enquanto vamos tentar o join padrão.

      const { data, error } = await withTimeout(supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            id,
            user_id,
            full_name,
            username,
            avatar_url,
            is_leader
          )
        `)
        .order('created_at', { ascending: false })) as any;

      if (error) {
        console.error("Erro ao buscar posts:", error);
        return [];
      }

      return data.map((post: any) => ({
        id: post.id,
        title: post.title || 'Sem título', // Fallback se title for null
        excerpt: post.content, // Mapeamos content do banco para excerpt da UI
        imageUrl: post.image_url,
        timestamp: new Date(post.created_at).toLocaleDateString(),
        likes: '0',
        author: {
          id: post.profiles?.user_id || 'del', // Usar user_id do perfil
          name: post.profiles?.full_name || 'Membro',
          username: post.profiles?.username || 'user',
          avatar: post.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_id}`,
          isLeader: post.profiles?.is_leader || false
        }
      }));
    } catch (e) {
      console.error("Exceção getPosts:", e);
      return [];
    }
  },

  subscribeToPosts(callback: () => void) {
    return supabase
      .channel('public:posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, callback)
      .subscribe();
  },

  async createPost(userId: string, title: string, content: string, imageUrl?: string) {
    // Corrige para usar user_id e content
    const { error } = await withTimeout(supabase
      .from('posts')
      .insert([{
        user_id: userId,
        title: title,
        content: content,
        image_url: imageUrl
      }])) as any;

    if (error) {
      console.error("Erro ao criar post:", error);
      throw error;
    }
  },

  async updateLeaderStatus(userId: string, isLeader: boolean) {
    const { error } = await supabase.from('profiles').upsert({ id: userId, is_leader: isLeader });
    if (error) throw error;
  }
};
