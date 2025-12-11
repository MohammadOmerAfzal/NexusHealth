import { authApi } from './api';
import { User, LoginCredentials, RegisterData, AuthResponse } from '../types/index';

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    // if (typeof window !== 'undefined') {
    //   const storedUser = localStorage.getItem('user');
    //   if (storedUser) {
    //     return JSON.parse(storedUser);
    //   }
    // }
    const response = await authApi.get<{ user: User }>('/api/auth/me');
    return response.data.user;
  } catch (error) {
    return null;
  }
};

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await authApi.post<AuthResponse>('/api/auth/login', credentials);
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
};

export const register = async (userData: RegisterData): Promise<AuthResponse> => {
  const response = await authApi.post<AuthResponse>('/api/auth/register', userData);
  return response.data;
};

export const logout = async (): Promise<void> => {
  try {
    await authApi.post('/api/auth/logout');
    
    // Clear client-side storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      sessionStorage.clear();
      
      // Clear cookies on client side
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
    
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

// export const logout = async (): Promise<void> => {
//   await authApi.post('/api/auth/logout');
// };