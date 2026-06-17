import { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionRef = useRef<Session | null>(null);

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        // Ao voltar para a aba o Supabase dispara refresh; às vezes o callback vem com session null.
        // Não deslogar nesse caso: reconfirmar com getSession().
        if (newSession === null && (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN')) {
          const { data: { session: current } } = await supabase.auth.getSession();
          if (!mounted) return;
          sessionRef.current = current;
          setSession(current);
          setUser(current?.user ?? null);
          setLoading(false);
          return;
        }

        if (event === 'SIGNED_OUT') {
          sessionRef.current = null;
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }

        // Só atualizar estado se a sessão realmente mudou (evita re-render e “reload” ao focar na aba)
        const prev = sessionRef.current;
        const sameSession =
          prev?.access_token === newSession?.access_token &&
          Boolean(prev) === Boolean(newSession);
        if (sameSession) {
          setLoading(false);
          return;
        }

        sessionRef.current = newSession;
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      sessionRef.current = s;
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    
    return { error: error as Error | null };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error: error as Error | null };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    return { error: error as Error | null };
  }, []);

  const value = useMemo(
    () => ({ user, session, loading, signUp, signIn, signOut, resetPassword }),
    [user, session, loading, signUp, signIn, signOut, resetPassword]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
