import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import axios from 'axios';
import { User } from '../types';

// IMPORTANT: Make sure this line is uncommented for production
const API_BASE_URL =  'https://my-backend-service-995199928922.asia-south1.run.app/api';

axios.defaults.baseURL = API_BASE_URL;

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    background: 'student' | 'professional'
  ) => Promise<void>;
  logout: () => void;
  isLoading: boolean; // For login/register spinners
  isAuthLoading: boolean; // For initial auth check
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Add token to all requests
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, [token]);

  // Verify token with backend
  const verifyToken = async (savedToken: string) => {
    try {
      const res = await axios.get('/auth/verify', {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      setUser(res.data.user);
      setToken(savedToken);
      localStorage.setItem('token', savedToken);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    } catch (error) {
      console.error('Token verification failed', error);
      logout();
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Login
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await axios.post('/auth/login', { email, password });
      const { token, user } = res.data;

      setToken(token);
      setUser(user);

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register
  const register = async (
    email: string,
    password: string,
    name: string,
    background: 'student' | 'professional'
  ) => {
    setIsLoading(true);
    try {
      const res = await axios.post('/auth/register', {
        email,
        password,
        name,
        background,
      });
      const { token, user } = res.data;

      setToken(token);
      setUser(user);

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      console.error('Registration failed', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Check for existing token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      verifyToken(savedToken);
    } else {
      setIsAuthLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isLoading,
        token,
        isAuthLoading,
      }}
    >
      {!isAuthLoading && children}
    </AuthContext.Provider>
  );
};
