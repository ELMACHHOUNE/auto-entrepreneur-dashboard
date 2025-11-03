/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/api/axios';

export type UserRole = 'user' | 'admin';
export interface User {
  _id: string;
  email: string;
  role: UserRole;
  fullName?: string;
  phone?: string;
  ICE?: string;
  service?: string;
  avatarUrl?: string;
  // New structured service fields
  profileKind?: 'guide_auto_entrepreneur' | 'company_guide';
  serviceCategory?: string;
  serviceType?: string;
  serviceActivity?: string;
  companyTypeCode?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    fullName?: string;
    phone?: string;
    ICE?: string;
    service?: string;
    // structured fields
    profileKind?: 'guide_auto_entrepreneur' | 'company_guide';
    serviceCategory?: string;
    serviceType?: string;
    serviceActivity?: string;
    companyTypeCode?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateProfile: (data: {
    email?: string;
    fullName?: string;
    phone?: string;
    ICE?: string;
    service?: string;
    // structured fields
    profileKind?: 'guide_auto_entrepreneur' | 'company_guide';
    serviceCategory?: string;
    serviceType?: string;
    serviceActivity?: string;
    companyTypeCode?: string;
  }) => Promise<void>;
  changePassword: (data: { currentPassword?: string; newPassword: string }) => Promise<void>;
  updateAvatar: (file: File) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const { data } = await api.get('/api/auth/me');
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const login = async (email: string, password: string) => {
    await api.post('/api/auth/login', { email, password });
    await refresh();
  };

  const register = async (payload: {
    email: string;
    password: string;
    fullName?: string;
    phone?: string;
    ICE?: string;
    service?: string;
    profileKind?: 'guide_auto_entrepreneur' | 'company_guide';
    serviceCategory?: string;
    serviceType?: string;
    serviceActivity?: string;
    companyTypeCode?: string;
  }) => {
    await api.post('/api/auth/register', payload);
    await refresh();
  };

  const logout = async () => {
    await api.post('/api/auth/logout');
    setUser(null);
  };

  const updateProfile = async (payload: {
    email?: string;
    fullName?: string;
    phone?: string;
    ICE?: string;
    service?: string;
    profileKind?: 'guide_auto_entrepreneur' | 'company_guide';
    serviceCategory?: string;
    serviceType?: string;
    serviceActivity?: string;
    companyTypeCode?: string;
  }) => {
    await api.put('/api/auth/me', payload);
    await refresh();
  };

  const changePassword = async (payload: { currentPassword?: string; newPassword: string }) => {
    await api.put('/api/auth/me/password', payload);
  };

  const updateAvatar = async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    await api.put('/api/auth/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    await refresh();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refresh,
        updateProfile,
        changePassword,
        updateAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
