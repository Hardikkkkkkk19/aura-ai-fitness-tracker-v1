import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, UserSession } from '../services/authService';

interface AuthContextType {
  user: UserSession['user'];
  isMockMode: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserMetadata?: (newMetadata: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession['user']>(null);
  const [isMockMode, setIsMockMode] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initializeAuth() {
      try {
        const session = await authService.getSession();
        setUser(session.user);
        setIsMockMode(session.isMock);
      } catch (e) {
        console.error('Error during Auth initialization:', e);
      } finally {
        setLoading(false);
      }
    }

    initializeAuth();

    // Listen to real auth state changes if configured
    const unsubscribe = authService.onAuthStateChange((session) => {
      setUser(session.user);
      setIsMockMode(session.isMock);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const session = await authService.signIn(email, password);
      setUser(session.user);
      setIsMockMode(session.isMock);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    setLoading(true);
    try {
      const session = await authService.signUp(email, password, fullName);
      setUser(session.user);
      setIsMockMode(session.isMock);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    try {
      await authService.resetPassword(email);
    } finally {
      setLoading(false);
    }
  };

  const updateUserMetadata = (newMetadata: any) => {
    setUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        user_metadata: {
          ...prev.user_metadata,
          ...newMetadata
        }
      };
    });
  };

  return (
    <AuthContext.Provider value={{ user, isMockMode, loading, login, signUp, logout, resetPassword, updateUserMetadata }}>
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
