import { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type Profile = {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  dob: string | null;
  city: string | null;
  area: string | null;
  lat: number | null;
  lng: number | null;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  business_name: string | null;
  category: string | null;
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any; data?: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const initDone = useRef(false);

  const syncProfile = useCallback(async (currentUser: User) => {
    setProfileLoading(true);
    try {
      // Try fetch first
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (data) {
        setProfile(data as unknown as Profile);
        setProfileLoading(false);
        return;
      }

      // Profile missing — upsert from user metadata (handles case where DB trigger didn't fire)
      const meta = currentUser.user_metadata || {};
      const { data: upserted, error: upsertErr } = await supabase
        .from('profiles')
        .upsert({
          id: currentUser.id,
          email: currentUser.email || null,
          full_name: meta.full_name || '',
          first_name: meta.first_name || null,
          last_name: meta.last_name || null,
          phone: meta.phone || null,
          role: meta.role || 'customer',
          dob: meta.dob || null,
        } as any, { onConflict: 'id' })
        .select('*')
        .single();

      if (upserted) {
        setProfile(upserted as unknown as Profile);
      }
    } catch (err) {
      console.error('Profile sync error:', err);
    }
    setProfileLoading(false);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await syncProfile(user);
  }, [user, syncProfile]);

  useEffect(() => {
    // Phase 1: Restore session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
      if (s?.user) {
        syncProfile(s.user);
      } else {
        setProfileLoading(false);
      }
      initDone.current = true;
    });

    // Phase 2: Listen for changes (after init)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);

        if (!initDone.current) return; // skip during init

        if (s?.user) {
          syncProfile(s.user);
        } else {
          setProfile(null);
          setProfileLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [syncProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, userData: any) => {
    const redirectUrl = `${window.location.origin}/`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: userData,
      },
    });

    return { error, data };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, profileLoading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
