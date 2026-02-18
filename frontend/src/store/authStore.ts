import { create } from 'zustand';
import type { AuthResponse, UserRole } from '../types';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  userId: number | null;
  fullName: string | null;
  email: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  login: (data: AuthResponse) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  userId: localStorage.getItem('userId') ? Number(localStorage.getItem('userId')) : null,
  fullName: localStorage.getItem('fullName'),
  email: localStorage.getItem('email'),
  role: localStorage.getItem('role') as UserRole | null,
  isAuthenticated: !!localStorage.getItem('token'),
  login: (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('userId', String(data.userId));
    localStorage.setItem('fullName', data.fullName);
    localStorage.setItem('email', data.email);
    localStorage.setItem('role', data.role);
    set({
      token: data.token,
      refreshToken: data.refreshToken,
      userId: data.userId,
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      isAuthenticated: true,
    });
  },
  logout: () => {
    localStorage.clear();
    set({
      token: null, refreshToken: null, userId: null,
      fullName: null, email: null, role: null, isAuthenticated: false,
    });
  },
}));
