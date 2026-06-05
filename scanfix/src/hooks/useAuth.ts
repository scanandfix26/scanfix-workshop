import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { AppUser, UserRole } from '../types';

export type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

// Demo users for offline/no-Supabase mode
const DEMO_USERS: AppUser[] = [
  { id: 'demo-admin', email: 'admin@workshop.com', name: 'Workshop Admin', role: 'admin' },
  { id: 'demo-mechanic', email: 'mechanic@workshop.com', name: 'Mechanic Ravi', role: 'mechanic' },
  { id: 'demo-worker', email: 'worker@workshop.com', name: 'Worker Suresh', role: 'worker' },
];
const DEMO_PASSWORD = 'workshop123';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [user, setUser] = useState<AppUser | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check for stored demo session
    const stored = localStorage.getItem('scanfix-demo-user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
        setAuthState('authenticated');
        return;
      } catch { localStorage.removeItem('scanfix-demo-user'); }
    }

    if (!isSupabaseConfigured || !supabase) {
      setAuthState('unauthenticated');
      return;
    }

    // Check Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user.id, session.user.email || '');
      } else {
        setAuthState('unauthenticated');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUserProfile(session.user.id, session.user.email || '');
      } else {
        setUser(null);
        setAuthState('unauthenticated');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadUserProfile(userId: string, email: string) {
    if (!supabase) return;
    const { data } = await supabase
      .from('profiles')
      .select('name, role')
      .eq('id', userId)
      .single();

    setUser({
      id: userId,
      email,
      name: data?.name || email.split('@')[0],
      role: (data?.role as UserRole) || 'worker',
    });
    setAuthState('authenticated');
  }

  async function login(email: string, password: string) {
    setError('');

    // Demo mode (no Supabase configured)
    if (!isSupabaseConfigured || !supabase) {
      const demoUser = DEMO_USERS.find(u => u.email === email.toLowerCase().trim());
      if (demoUser && password === DEMO_PASSWORD) {
        localStorage.setItem('scanfix-demo-user', JSON.stringify(demoUser));
        setUser(demoUser);
        setAuthState('authenticated');
        return;
      }
      setError('Invalid email or password. Demo: admin@workshop.com / workshop123');
      return;
    }

    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError(err.message);
  }

  async function logout() {
    localStorage.removeItem('scanfix-demo-user');
    setUser(null);
    setAuthState('unauthenticated');
    if (supabase) await supabase.auth.signOut();
  }

  async function resetPassword(email: string): Promise<string> {
    if (!isSupabaseConfigured || !supabase) return 'Password reset not available in demo mode.';
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/',
    });
    if (error) return error.message;
    return 'Password reset email sent! Check your inbox.';
  }

  return { authState, user, error, login, logout, resetPassword };
}
