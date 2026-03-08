import { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType } from '../types';
import { supabase } from '../lib/supabase';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      try {
        const userData = JSON.parse(stored);
        setUser(userData);
      } catch (error) {
        console.error('Error restoring auth:', error);
        localStorage.removeItem('auth_user');
      }
    }
    setLoading(false);
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      let loginUser: User | null = null;

      if (email === 'admin' && password === 'admin123') {
        loginUser = {
          id: 'admin_user_1',
          email: 'admin@jaidurgabhavanimilkcenter.com',
          role: 'admin',
          created_at: new Date().toISOString(),
        };
      } else {
        const { data: customerData } = await supabase
          .from('customers')
          .select('id, name, phone')
          .eq('phone', email)
          .maybeSingle();

        if (customerData && password === '1234') {
          loginUser = {
            id: customerData.id,
            email: customerData.phone,
            phone: customerData.phone,
            role: 'customer',
            created_at: new Date().toISOString(),
          };
        }
      }

      if (!loginUser) {
        throw new Error('Invalid credentials');
      }

      setUser(loginUser);
      localStorage.setItem('auth_user', JSON.stringify(loginUser));
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
