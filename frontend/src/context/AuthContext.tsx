import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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

const getCached = <T,>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('luxe_token'));
  const [user, setUser] = useState<User | null>(() => getCached<User>('luxe_user'));
  const [salon, setSalon] = useState<Salon | null>(() => getCached<Salon>('luxe_salon'));
  const [branch, setBranchState] = useState<Branch | null>(() => getCached<Branch>('luxe_branch'));
  const [branches, setBranches] = useState<Branch[]>(() => getCached<Branch[]>('luxe_branches') || []);

  // If we already have token and user in local cache, UI can be interactive immediately
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    const storedToken = localStorage.getItem('luxe_token');
    const storedUser = getCached<User>('luxe_user');
    return !!storedToken && !storedUser;
  });

  const branchesFetchingRef = useRef<Promise<Branch[]> | null>(null);
  const meFetchingRef = useRef<Promise<any> | null>(null);
  const justLoggedInRef = useRef<boolean>(false);

  const fetchBranches = async (): Promise<Branch[]> => {
    // If already fetching, reuse the same in-flight promise
    if (branchesFetchingRef.current) {
      return branchesFetchingRef.current;
    }

    const promise = (async () => {
      try {
        const data = await api.get<{ results?: Branch[] } | Branch[]>('/branches/');
        const list = Array.isArray(data) ? data : data.results || [];
        setBranches(list);
        localStorage.setItem('luxe_branches', JSON.stringify(list));

        // Set default branch if none selected or invalid
        setBranchState((current) => {
          if (current && list.some((b) => b.id === current.id)) {
            return current;
          }
          const chosen = list.find((b) => b.is_primary) || list[0] || null;
          if (chosen) {
            localStorage.setItem('luxe_branch', JSON.stringify(chosen));
          }
          return chosen;
        });

        return list;
      } catch {
        return [];
      } finally {
        branchesFetchingRef.current = null;
      }
    })();

    branchesFetchingRef.current = promise;
    return promise;
  };

  const refreshUserData = async () => {
    // Prevent duplicate concurrent /auth/me/ calls
    if (meFetchingRef.current) {
      return meFetchingRef.current;
    }

    const promise = (async () => {
      try {
        const res = await api.get<{ user: User; salon: Salon | null; branch: Branch | null }>('/auth/me/');
        setUser(res.user);
        localStorage.setItem('luxe_user', JSON.stringify(res.user));

        if (res.salon) {
          setSalon(res.salon);
          localStorage.setItem('luxe_salon', JSON.stringify(res.salon));
          localStorage.setItem('luxe_active_salon_slug', res.salon.slug);
        }

        if (res.branch) {
          setBranchState(res.branch);
          localStorage.setItem('luxe_branch', JSON.stringify(res.branch));
        }

        if (res.user?.role !== 'SUPERADMIN') {
          await fetchBranches();
        } else {
          setBranches([]);
          localStorage.removeItem('luxe_branches');
          localStorage.removeItem('luxe_branch');
        }
      } catch (err: any) {
        // If 401 Unauthorized, clear stale auth
        if (err?.status === 401) {
          logout();
        }
      } finally {
        setIsLoading(false);
        meFetchingRef.current = null;
      }
    })();

    meFetchingRef.current = promise;
    return promise;
  };

  useEffect(() => {
    const handleAuthUnauthorized = () => {
      logout();
    };
    window.addEventListener('auth:unauthorized', handleAuthUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleAuthUnauthorized);
  }, []);

  useEffect(() => {
    // If login() just finished, do not duplicate with /auth/me/
    if (justLoggedInRef.current) {
      justLoggedInRef.current = false;
      return;
    }

    if (token) {
      // If we don't have user data yet, fetch it once
      if (!user) {
        refreshUserData();
      } else {
        // We already have user data; load branches once if missing
        if (user.role !== 'SUPERADMIN' && branches.length === 0) {
          fetchBranches();
        }
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    justLoggedInRef.current = true;
    setIsLoading(true);

    try {
      const res = await api.post<{ token: string; user: User; salon: Salon | null }>('/auth/login/', {
        email,
        password,
      });

      // 1. Store token
      localStorage.setItem('luxe_token', res.token);
      setToken(res.token);

      // 2. Store user directly from login response (No /auth/me/ needed!)
      localStorage.setItem('luxe_user', JSON.stringify(res.user));
      setUser(res.user);

      // 3. Store salon directly from login response
      if (res.salon) {
        localStorage.setItem('luxe_salon', JSON.stringify(res.salon));
        localStorage.setItem('luxe_active_salon_slug', res.salon.slug);
        setSalon(res.salon);
      }

      // 4. Immediately hydrate branch from user login response
      const userBranchId = (res.user as any)?.branch;
      if (userBranchId) {
        const initialBranch: Branch = {
          id: userBranchId,
          name: (res.user as any)?.branch_name || 'Main Branch',
          salon: res.salon?.id || '',
          is_primary: true,
        } as Branch;
        setBranchState(initialBranch);
        localStorage.setItem('luxe_branch', JSON.stringify(initialBranch));
      }

      // 5. Fetch branches in background for salon roles
      if (res.user?.role !== 'SUPERADMIN') {
        fetchBranches();
      } else {
        setBranches([]);
        setBranchState(null);
        localStorage.removeItem('luxe_branches');
        localStorage.removeItem('luxe_branch');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: any) => {
    justLoggedInRef.current = true;
    setIsLoading(true);

    try {
      const res = await api.post<{ token: string; user: User; salon: Salon | null }>('/auth/register/', payload);
      localStorage.setItem('luxe_token', res.token);
      localStorage.setItem('luxe_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);

      if (res.salon) {
        localStorage.setItem('luxe_salon', JSON.stringify(res.salon));
        localStorage.setItem('luxe_active_salon_slug', res.salon.slug);
        setSalon(res.salon);
      }

      const userBranchId = (res.user as any)?.branch;
      if (userBranchId) {
        const initialBranch: Branch = {
          id: userBranchId,
          name: (res.user as any)?.branch_name || 'Main Branch',
          salon: res.salon?.id || '',
          is_primary: true,
        } as Branch;
        setBranchState(initialBranch);
        localStorage.setItem('luxe_branch', JSON.stringify(initialBranch));
      }

      fetchBranches();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    try {
      api.post('/auth/logout/').catch(() => {});
    } catch {}

    api.invalidateCache();
    localStorage.removeItem('luxe_token');
    localStorage.removeItem('luxe_user');
    localStorage.removeItem('luxe_salon');
    localStorage.removeItem('luxe_branch');
    localStorage.removeItem('luxe_branches');
    localStorage.removeItem('luxe_active_salon_slug');

    setToken(null);
    setUser(null);
    setSalon(null);
    setBranchState(null);
    setBranches([]);
    setIsLoading(false);
    branchesFetchingRef.current = null;
    meFetchingRef.current = null;
  };

  const setBranch = (b: Branch) => {
    setBranchState(b);
    localStorage.setItem('luxe_branch', JSON.stringify(b));
  };

  const setSalonData = (s: Salon) => {
    setSalon(s);
    localStorage.setItem('luxe_salon', JSON.stringify(s));
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
