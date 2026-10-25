import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Salon, Branch, UserRole } from '../types';
import { api } from '../services/api';
import { Permission, hasPermission as checkPermission, canAccessRoute } from '../constants/permissions';

interface AuthContextType {
  user: User | null;
  salon: Salon | null;
  branch: Branch | null;
  branches: Branch[];
  token: string | null;
  isLoading: boolean;
  role: UserRole | null;
  isOwner: boolean;
  isStylist: boolean;
  isReceptionist: boolean;
  isSuperAdmin: boolean;
  hasPermission: (permission: Permission) => boolean;
  canAccess: (routePath: string) => boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => void;
  setBranch: (branch: Branch) => void;
  setSalon: (salon: Salon) => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [branch, setBranchState] = useState<Branch | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [token, setToken] = useState<string | null>(localStorage.getItem('luxe_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchBranches = async () => {
    try {
      const data = await api.get<{ results?: Branch[] } | Branch[]>('/branches/');
      const list = Array.isArray(data) ? data : data.results || [];
      setBranches(list);
      if (list.length > 0 && !branch) {
        setBranchState(list[0]);
      }
    } catch {
      // Ignore if not logged in or no branches for role
    }
  };

  const refreshUserData = async () => {
    try {
      const res = await api.get<{ user: User; salon: Salon | null; branch: Branch | null }>('/auth/me/');
      setUser(res.user);
      if (res.salon) {
        setSalon(res.salon);
        localStorage.setItem('luxe_active_salon_slug', res.salon.slug);
      }
      if (res.branch) {
        setBranchState(res.branch);
      }
      if (res.user?.role !== 'SUPERADMIN') {
        await fetchBranches();
      } else {
        setBranches([]);
      }
    } catch (err) {
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      refreshUserData();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.post<{ token: string; user: User; salon: Salon | null }>('/auth/login/', {
      email,
      password,
    });
    localStorage.setItem('luxe_token', res.token);
    setToken(res.token);
    setUser(res.user);
    if (res.salon) {
      setSalon(res.salon);
      localStorage.setItem('luxe_active_salon_slug', res.salon.slug);
    }
    if (res.user?.role !== 'SUPERADMIN') {
      await fetchBranches();
    } else {
      setBranches([]);
    }
  };

  const register = async (payload: any) => {
    const res = await api.post<{ token: string; user: User; salon: Salon | null }>('/auth/register/', payload);
    localStorage.setItem('luxe_token', res.token);
    setToken(res.token);
    setUser(res.user);
    if (res.salon) {
      setSalon(res.salon);
      localStorage.setItem('luxe_active_salon_slug', res.salon.slug);
    }
    await fetchBranches();
  };

  const logout = () => {
    try {
      api.post('/auth/logout/').catch(() => {});
    } catch {}
    localStorage.removeItem('luxe_token');
    localStorage.removeItem('luxe_active_salon_slug');
    setToken(null);
    setUser(null);
    setSalon(null);
    setBranchState(null);
    setBranches([]);
  };

  const setBranch = (b: Branch) => {
    setBranchState(b);
  };

  const setSalonData = (s: Salon) => {
    setSalon(s);
    localStorage.setItem('luxe_active_salon_slug', s.slug);
  };

  const role = user?.role || null;
  const isOwner = role === 'SALON_OWNER' || role === 'SALON_MANAGER';
  const isStylist = role === 'STYLIST';
  const isReceptionist = role === 'RECEPTIONIST';
  const isSuperAdmin = role === 'SUPERADMIN';

  const hasPerm = (permission: Permission): boolean => {
    return checkPermission(role, permission);
  };

  const canAccess = (routePath: string): boolean => {
    return canAccessRoute(role, routePath);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        salon,
        branch,
        branches,
        token,
        isLoading,
        role,
        isOwner,
        isStylist,
        isReceptionist,
        isSuperAdmin,
        hasPermission: hasPerm,
        canAccess,
        login,
        register,
        logout,
        setBranch,
        setSalon: setSalonData,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
