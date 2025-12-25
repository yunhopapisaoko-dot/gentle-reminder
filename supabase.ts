
import { createClient } from '@supabase/supabase-js';

// NOTA: Para o cliente JS funcionar, use a chave 'anon' ou 'service_role' do seu Dashboard (Settings > API)
// Chaves que começam com 'sb_secret' são para a API de Gerenciamento e podem não funcionar diretamente aqui.
const supabaseUrl = 'https://ltjtzyzxpxrbqiajafcm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0anR6eXp4cHhyYnFpYWphZmNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxMjMzMjEsImV4cCI6MjA4MTY5OTMyMX0.p88hjvJLKGBHo373q3xoXFVSkB7w-XMqHLKMS092aN8';

const createSafeClient = () => {
  try {
    // Inicializa o cliente real
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
  } catch (e: any) {
    console.error("Erro ao conectar com Supabase:", e.message);
    // Fallback Mock apenas para evitar que a aplicação quebre totalmente
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ data: null, error: { message: "Erro de Configuração" } }),
        signUp: async () => ({ data: null, error: { message: "Erro de Configuração" } }),
        signOut: async () => ({ error: null }),
        updateUser: async () => ({ data: null, error: { message: "Configuração Inválida" } }),
      },
      storage: {
        from: () => ({
          upload: async () => ({ data: null, error: { message: "Storage indisponível" } }),
          getPublicUrl: () => ({ data: { publicUrl: "" } }),
        })
      },
      from: () => ({
        select: () => ({ 
          order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }),
          eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) })
        }),
        insert: () => Promise.resolve({ data: null, error: null }),
        upsert: () => Promise.resolve({ data: null, error: null }),
      }),
      channel: () => ({ on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }), subscribe: () => ({ unsubscribe: () => {} }) })
    } as any;
  }
};

export const supabase = createSafeClient();
