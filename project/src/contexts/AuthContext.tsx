import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, type AdminUser } from '../lib/supabase';

interface AdminSession extends AdminUser {
  session_token: string;
  expires_at: string;
}

interface AuthContextType {
  admin: AdminSession | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => void;
  getSessionToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedAdmin = localStorage.getItem('admin_session');
    if (storedAdmin) {
      const adminSession = JSON.parse(storedAdmin) as AdminSession;

      if (new Date(adminSession.expires_at) > new Date()) {
        setAdmin(adminSession);
      } else {
        localStorage.removeItem('admin_session');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      const { data, error } = await supabase.rpc('authenticate_admin', {
        p_username: username,
        p_password: password,
      });

      if (error) {
        return { error: 'Erreur de connexion' };
      }

      if (!data || data.length === 0) {
        return { error: 'Nom d\'utilisateur ou mot de passe incorrect' };
      }

      const adminSession = data[0] as AdminSession;
      setAdmin(adminSession);
      localStorage.setItem('admin_session', JSON.stringify(adminSession));

      return { error: null };
    } catch (err) {
      return { error: 'Erreur de connexion' };
    }
  };

  const signOut = async () => {
    if (admin?.session_token) {
      try {
        await supabase.rpc('delete_admin_session', {
          p_token: admin.session_token,
        });
      } catch (err) {
        console.error('Error deleting session:', err);
      }
    }

    setAdmin(null);
    localStorage.removeItem('admin_session');
  };

  const getSessionToken = () => {
    return admin?.session_token || null;
  };

  return (
    <AuthContext.Provider value={{ admin, loading, signIn, signOut, getSessionToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
