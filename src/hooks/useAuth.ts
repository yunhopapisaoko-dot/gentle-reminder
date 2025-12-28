import { useState, useEffect } from 'react';
import { supabase } from '@/src/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  race: 'draeven' | 'sylven' | 'lunari';
  money: number;
  health: number;
  energy: number;
  hunger: number;
  alcoholism: number;
  current_disease: string | null;
  disease_started_at: string | null;
  is_leader: boolean;
  last_spin_at: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
  });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(prev => ({ 
        ...prev, 
        session, 
        user: session?.user ?? null,
        loading: session ? true : false 
      }));
      
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setState(prev => ({ 
          ...prev, 
          session, 
          user: session?.user ?? null,
          loading: session ? true : false 
        }));
        
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setState(prev => ({ ...prev, profile: null, loading: false }));
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
    }

    setState(prev => ({ 
      ...prev, 
      profile: data as Profile | null, 
      loading: false 
    }));
  };

  const refreshProfile = async () => {
    if (state.user) {
      await fetchProfile(state.user.id);
    }
  };

  const updateMoney = async (amount: number) => {
    if (!state.user || !state.profile) return;

    const newMoney = state.profile.money + amount;
    
    const { error } = await supabase
      .from('profiles')
      .update({ money: newMoney })
      .eq('user_id', state.user.id);

    if (!error) {
      setState(prev => ({
        ...prev,
        profile: prev.profile ? { ...prev.profile, money: newMoney } : null,
      }));
    }

    return !error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, metadata?: { 
    full_name?: string; 
    username?: string; 
    race?: string 
  }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    updateMoney,
    isLunari: state.profile?.race === 'lunari',
  };
}
