import { supabase } from '@/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export async function signUpWithEmail(email: string, password: string, fullName?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || 'Developer',
      },
    },
  });

  if (error) throw error;
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateProfile(updates: { full_name?: string; avatar_url?: string }) {
  const { data: session } = await supabase.auth.getSession();
  if (session?.session?.user) {
    const { data, error } = await (supabase.from('profiles') as any)
      .update(updates)
      .eq('id', session.session.user.id)
      .select()
      .single();

    if (!error) return data;
  }

  return { id: 'dev-user', ...updates };
}
