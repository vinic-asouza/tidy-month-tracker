import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
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

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
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
