import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User } from '@/types/api';
import { authService } from '@/api/authService';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isOrganizer: boolean;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(authService.isAuthenticated());
  const [user, setUser] = useState<User | null>(null);
  const [isOrganizer, setIsOrganizer] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch user data on initial load if authenticated
  useEffect(() => {
    const fetchUser = async () => {
      if (isAuthenticated) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
          setIsOrganizer(userData.is_organizer);
        } catch (error) {
          console.error('Failed to fetch user data', error);
          logout();
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchUser();
  }, [isAuthenticated]);

  const login = (token: string) => {
    localStorage.setItem('access_token', token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setIsOrganizer(false);
  };

  const refreshUser = async () => {
    if (isAuthenticated) {
      try {
        const userData = await authService.getCurrentUser();
        setUser(userData);
        setIsOrganizer(userData.is_organizer);
      } catch (error) {
        console.error('Failed to refresh user data', error);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        isOrganizer,
        loading,
        login,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 