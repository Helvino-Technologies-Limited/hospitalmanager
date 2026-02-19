import { create } from 'zustand';
import type { AuthResponse, UserRole } from '../types';
import { userApi } from '../api/services';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  userId: number | null;
  fullName: string | null;
  email: string | null;
  role: UserRole | null;
  department: string | null;
  isAuthenticated: boolean;
  login: (data: AuthResponse) => void;
  logout: () => void;
  fetchDepartment: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  userId: localStorage.getItem('userId') ? Number(localStorage.getItem('userId')) : null,
  fullName: localStorage.getItem('fullName'),
  email: localStorage.getItem('email'),
  role: localStorage.getItem('role') as UserRole | null,
  department: localStorage.getItem('department'),
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
    // Fetch department after login
    setTimeout(() => get().fetchDepartment(), 0);
  },
  logout: () => {
    localStorage.clear();
    set({
      token: null, refreshToken: null, userId: null,
      fullName: null, email: null, role: null, department: null, isAuthenticated: false,
    });
  },
  fetchDepartment: async () => {
    const userId = get().userId;
    if (!userId) return;
    try {
      const res = await userApi.getById(userId);
      const dept = res.data.data.department || null;
      localStorage.setItem('department', dept || '');
      set({ department: dept });
    } catch {
      // ignore
    }
  },
}));
