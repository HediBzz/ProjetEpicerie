import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, type AdminUser } from '../lib/api';

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
        api.setToken(adminSession.session_token);
      } else {
        localStorage.removeItem('admin_session');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      const { data, error } = await api.authenticateAdmin(username, password);

      if (error || !data) {
        return { error: error || 'Nom d\'utilisateur ou mot de passe incorrect' };
      }

      const adminSession = data as AdminSession;
      setAdmin(adminSession);
      localStorage.setItem('admin_session', JSON.stringify(adminSession));
      api.setToken(adminSession.session_token);

      return { error: null };
    } catch (err) {
      return { error: 'Erreur de connexion' };
    }
  };

  const signOut = async () => {
    if (admin?.session_token) {
      try {
        await api.logout();
      } catch (err) {
        console.error('Error deleting session:', err);
      }
    }

    setAdmin(null);
    localStorage.removeItem('admin_session');
    api.setToken(null);
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
