import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import axios from 'axios';
import { User } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
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
  isLoading: boolean;
  isAuthLoading: boolean;
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

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  const verifyToken = useCallback(async (savedToken: string) => {
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
  }, [logout]);

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

  // ✅ Fixed: guard against "undefined" string in localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser && savedUser !== 'undefined' && savedUser !== 'null') {
      try {
        const parsedUser = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsedUser);
        verifyToken(savedToken);
      } catch (e) {
        console.error('Failed to parse saved user', e);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthLoading(false);
      }
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsAuthLoading(false);
    }
  }, [verifyToken]);

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