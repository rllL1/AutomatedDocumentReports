'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/lib/api-client';
import { ApiResponse, LoginResponse } from '@/lib/types';

interface User {
  id: string;
  email: string;
  full_name: string;
  department?: string;
  division?: string;
  role: string;
  is_active?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    if (storedToken && storedUser) {
      // Validate token by making a request to the backend
      validateToken(storedToken, storedUser);
    } else {
      setLoading(false);
    }
  }, []);

  const validateToken = async (token: string, userString: string) => {
    try {
      // Try to fetch user profile to validate token
      const response = await apiClient<ApiResponse<User>>('/api/auth/profile', {
        method: 'GET',
        token
      });

      // Token is valid, set state with fresh user data
      setToken(token);
      setUser(response.data);
      localStorage.setItem('auth_user', JSON.stringify(response.data));
    } catch (error) {
      // Token is invalid or server is unreachable, use cached data for now
      console.error('Token validation failed:', error);
      
      // If it's a network error (backend down), still use cached user data
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        // Backend is down, use cached data temporarily
        try {
          setToken(token);
          setUser(JSON.parse(userString));
        } catch (_parseError) {
          // If parsing fails, clear everything
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          setToken(null);
          setUser(null);
        }
      } else {
        // Token is actually invalid, clear storage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setToken(null);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient<ApiResponse<LoginResponse>>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      const { user, session } = response.data;

      setUser(user);
      setToken(session.access_token);

      localStorage.setItem('auth_token', session.access_token);
      localStorage.setItem('auth_user', JSON.stringify(user));
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await apiClient('/api/auth/logout', {
          method: 'POST',
          token
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  };

  const refreshUser = async () => {
    if (!token) return;
    
    try {
      const response = await apiClient<ApiResponse<User>>('/api/auth/profile', {
        method: 'GET',
        token
      });

      // Update user state and localStorage with fresh data
      setUser(response.data);
      localStorage.setItem('auth_user', JSON.stringify(response.data));
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        refreshUser,
        isAuthenticated: !!user && !!token
      }}
    >
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
