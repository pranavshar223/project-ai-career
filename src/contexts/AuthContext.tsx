import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import axios from 'axios';
import { User } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, background: 'student' | 'professional') => Promise<void>;
  logout: () => void;
  isLoading: boolean;
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

  // Set up axios interceptor for authentication
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, [token]);

  // Check for existing token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      
      // Verify token is still valid
      verifyToken(savedToken);
    }
  }, []);

  const verifyToken = async (tokenToVerify: string) => {
    try {
      const response = await axios.get('/auth/me', {
        headers: { Authorization: `Bearer ${tokenToVerify}` }
      });
      
      if (response.data.user) {
        setUser({
          id: response.data.user.id,
          email: response.data.user.email,
          name: response.data.user.name,
          background: response.data.user.background,
          createdAt: new Date(response.data.user.createdAt),
        });
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post('/auth/login', {
        email,
        password,
      });

      const { token: newToken, user: userData } = response.data;
      
      const userObj: User = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        background: userData.background,
        createdAt: new Date(userData.createdAt),
      };

      setToken(newToken);
      setUser(userObj);
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userObj));
    } catch (error: unknown) {
      console.error('Login error:', error);
      let message = 'Login failed';
      if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
        message = (error.response as { data: { message?: string } }).data.message || message;
      }
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string, background: 'student' | 'professional') => {
    setIsLoading(true);
    try {
      const response = await axios.post('/auth/register', {
        email,
        password,
        name,
        background,
      });

      const { token: newToken, user: userData } = response.data;
      
      const userObj: User = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        background: userData.background,
        createdAt: new Date(userData.createdAt),
      };

      setToken(newToken);
      setUser(userObj);
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userObj));
    } catch (error: unknown) {
      console.error('Registration error:', error);
      let message = 'Registration failed';
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'data' in error.response &&
        error.response.data &&
        typeof error.response.data === 'object' &&
        'message' in error.response.data
      ) {
        message = (error.response as { data: { message?: string } }).data.message || message;
      }
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, token }}>
      {children}
    </AuthContext.Provider>
  );
};