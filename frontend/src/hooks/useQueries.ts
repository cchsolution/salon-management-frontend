import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import {
  Service,
  ServiceCategory,
  ServiceStyle,
  StaffProfile,
  Customer,
  Product,
  Appointment,
  DashboardMetrics,
  Salon,
  Branch,
  MembershipPlan,
  Coupon,
} from '../types';

const normalizeList = <T>(res: { results?: T[] } | T[] | undefined | null): T[] => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  return Array.isArray(res.results) ? res.results : [];
};

/**
 * Storage helpers for instant warm-cache rehydration (0ms perceived load)
 */
const getPersistedData = <T>(key: string): T | undefined => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    if (!raw) return undefined;
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
};

const persistData = <T>(key: string, data: T): void => {
  try {
    if (typeof window !== 'undefined' && data !== undefined && data !== null) {
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch {
    // Gracefully handle storage quota or private window
  }
};

/**
 * Cache time constants (in milliseconds)
 */
export const CACHE_TIMES = {
  STATIC_CATALOG: 10 * 60 * 1000, // 10 minutes (services, categories, styles)
  STAFF: 10 * 60 * 1000,          // 10 minutes
  CLIENTS: 5 * 60 * 1000,         // 5 minutes
  PRODUCTS: 5 * 60 * 1000,        // 5 minutes
  METRICS: 60 * 1000,             // 60 seconds
  APPOINTMENTS: 30 * 1000,        // 30 seconds
  SLOTS: 20 * 1000,               // 20 seconds
};

/**
 * Query hook for Service Categories
 */
export function useCategories() {
  const cacheKey = 'luxe_cache_categories';
  return useQuery({
    queryKey: ['catalog', 'categories'],
    queryFn: async () => {
      const res = await api.get<{ results?: ServiceCategory[] } | ServiceCategory[]>('/catalog/categories/');
      const list = normalizeList<ServiceCategory>(res);
      persistData(cacheKey, list);
      return list;
    },
    initialData: () => getPersistedData<ServiceCategory[]>(cacheKey),
    placeholderData: (previousData) => previousData,
    staleTime: CACHE_TIMES.STATIC_CATALOG,
  });
}

/**
 * Query hook for Services Catalog
 */
export function useServices() {
  const cacheKey = 'luxe_cache_services';
  return useQuery({
    queryKey: ['catalog', 'services'],
    queryFn: async () => {
      const res = await api.get<{ results?: Service[] } | Service[]>('/catalog/services/');
      const list = normalizeList<Service>(res);
      persistData(cacheKey, list);
      return list;
    },
    initialData: () => getPersistedData<Service[]>(cacheKey),
    placeholderData: (previousData) => previousData,
    staleTime: CACHE_TIMES.STATIC_CATALOG,
  });
}

/**
 * Query hook for Service Styles
 */
export function useStyles() {
  const cacheKey = 'luxe_cache_styles';
  return useQuery({
    queryKey: ['catalog', 'styles'],
    queryFn: async () => {
      const res = await api.get<{ results?: ServiceStyle[] } | ServiceStyle[]>('/catalog/styles/');
      const list = normalizeList<ServiceStyle>(res);
      persistData(cacheKey, list);
      return list;
    },
    initialData: () => getPersistedData<ServiceStyle[]>(cacheKey),
    placeholderData: (previousData) => previousData,
    staleTime: CACHE_TIMES.STATIC_CATALOG,
  });
}

/**
 * Query hook for Staff Profiles (optionally filtered by branch)
 */
export function useStaff(branchId?: string | null) {
  const cacheKey = `luxe_cache_staff_${branchId || 'all'}`;
  return useQuery({
    queryKey: ['catalog', 'staff', branchId || 'all'],
    queryFn: async () => {
      const url = branchId ? `/catalog/staff/?branch=${branchId}` : '/catalog/staff/';
      const res = await api.get<{ results?: StaffProfile[] } | StaffProfile[]>(url);
      const list = normalizeList<StaffProfile>(res);
      persistData(cacheKey, list);
      return list;
    },
    initialData: () => getPersistedData<StaffProfile[]>(cacheKey),
    placeholderData: (previousData) => previousData,
    staleTime: CACHE_TIMES.STAFF,
  });
}

/**
 * Query hook for Customers / CRM Clients
 */
export function useClients() {
  const cacheKey = 'luxe_cache_clients';
  return useQuery({
    queryKey: ['crm', 'clients'],
    queryFn: async () => {
      const res = await api.get<{ results?: Customer[] } | Customer[]>('/crm/clients/');
      const list = normalizeList<Customer>(res);
      persistData(cacheKey, list);
      return list;
    },
    initialData: () => getPersistedData<Customer[]>(cacheKey),
    placeholderData: (previousData) => previousData,
    staleTime: CACHE_TIMES.CLIENTS,
  });
}

/**
 * Query hook for Retail Products (POS Billing)
 */
export function useRetailProducts(branchId?: string | null) {
  const cacheKey = `luxe_cache_retail_products_${branchId || 'all'}`;
  return useQuery({
    queryKey: ['products', 'retail', branchId || 'all'],
    queryFn: async () => {
      const branchParam = branchId ? `?branch_id=${branchId}` : '';
      try {
        const res = await api.get<{ results?: Product[] } | Product[]>(`/pos/invoices/retail_products/${branchParam}`);
        const list = normalizeList<Product>(res);
        persistData(cacheKey, list);
        return list;
      } catch {
        // Fallback to general inventory products
        const fallbackParam = branchId ? `?branch=${branchId}` : '';
        const res = await api.get<{ results?: Product[] } | Product[]>(`/inventory/products/${fallbackParam}`);
        const list = normalizeList<Product>(res).filter((p) => p.is_retail);
        persistData(cacheKey, list);
        return list;
      }
    },
    initialData: () => getPersistedData<Product[]>(cacheKey),
    placeholderData: (previousData) => previousData,
    staleTime: CACHE_TIMES.PRODUCTS,
  });
}

/**
 * Query hook for Inventory Products
 */
export function useInventoryProducts(branchId?: string | null) {
  const cacheKey = `luxe_cache_inv_products_${branchId || 'all'}`;
  return useQuery({
    queryKey: ['products', 'inventory', branchId || 'all'],
    queryFn: async () => {
      const res = await api.get<{ results?: Product[] } | Product[]>('/inventory/products/');
      const list = normalizeList<Product>(res);
      persistData(cacheKey, list);
      return list;
    },
    initialData: () => getPersistedData<Product[]>(cacheKey),
    placeholderData: (previousData) => previousData,
    staleTime: CACHE_TIMES.PRODUCTS,
  });
}

/**
 * Query hook for Dashboard Business Metrics
 */
export function useDashboardMetrics(branchId?: string | null, days?: number) {
  const cacheKey = `luxe_cache_metrics_${branchId || 'default'}_${days || 7}`;
  return useQuery({
    queryKey: ['analytics', 'metrics', branchId || 'default', days || 7],
    queryFn: async () => {
      let url = '/analytics/metrics/';
      const params = new URLSearchParams();
      if (branchId) params.append('branch', branchId);
      if (days && days > 0) params.append('days', String(days));
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;

      const data = await api.get<DashboardMetrics>(url);
      persistData(cacheKey, data);
      return data;
    },
    initialData: () => getPersistedData<DashboardMetrics>(cacheKey),
    placeholderData: (previousData) => previousData,
    staleTime: CACHE_TIMES.METRICS,
  });
}

/**
 * Query hook for Appointments (calendar & agenda)
 */
export interface AppointmentQueryParams {
  date: string;
  branchId?: string | null;
  staffId?: string | null;
  status?: string | null;
  enabled?: boolean;
}

export function useAppointments(params: AppointmentQueryParams) {
  const { date, branchId, staffId, status, enabled = true } = params;
  const cacheKey = `luxe_cache_appts_${date}_${branchId || 'all'}`;

  return useQuery({
    queryKey: ['appointments', date, branchId || 'all', staffId || 'all', status || 'all'],
    queryFn: async () => {
      let url = `/appointments/bookings/?date=${date}`;
      if (branchId) url += `&branch=${branchId}`;
      if (staffId) url += `&staff=${staffId}`;
      if (status) url += `&status=${status}`;

      const res = await api.get<{ results?: Appointment[] } | Appointment[]>(url);
      const list = normalizeList<Appointment>(res);
      if (!staffId && !status) {
        persistData(cacheKey, list);
      }
      return list;
    },
    initialData: () => (!staffId && !status ? getPersistedData<Appointment[]>(cacheKey) : undefined),
    placeholderData: (previousData) => previousData,
    staleTime: CACHE_TIMES.APPOINTMENTS,
    enabled: enabled && Boolean(date),
  });
}

/**
 * Query hook for Available Booking Slots
 */
export interface AvailableSlotsParams {
  staffId: string;
  date: string;
  duration: number;
  branchId?: string | null;
}

export function useAvailableSlots(params: AvailableSlotsParams, enabled: boolean = true) {
  const { staffId, date, duration, branchId } = params;

  return useQuery({
    queryKey: ['availableSlots', staffId, date, duration, branchId || ''],
    queryFn: async () => {
      const branchParam = branchId || '';
      const dur = Math.max(duration, 15);
      const res = await api.get<{ slots: string[] }>(
        `/appointments/bookings/available_slots/?staff_id=${staffId}&date=${date}&duration=${dur}&branch_id=${branchParam}`
      );
      return res.slots || [];
    },
    staleTime: CACHE_TIMES.SLOTS,
    enabled: enabled && Boolean(staffId && date && duration > 0),
  });
}

/**
 * Query hook for Registered Salons (Superadmin)
 */
export function useSalons() {
  return useQuery({
    queryKey: ['platform', 'salons'],
    queryFn: async () => {
      const res = await api.get<{ results?: Salon[] } | Salon[]>('/salons/');
      return normalizeList<Salon>(res);
    },
    staleTime: CACHE_TIMES.STATIC_CATALOG,
  });
}

/**
 * Query hook for Branches
 */
export function useBranches() {
  return useQuery({
    queryKey: ['platform', 'branches'],
    queryFn: async () => {
      const res = await api.get<{ results?: Branch[] } | Branch[]>('/branches/');
      return normalizeList<Branch>(res);
    },
    staleTime: CACHE_TIMES.STATIC_CATALOG,
  });
}

/**
 * Query hook for Loyalty Membership Plans
 */
export function useLoyaltyPlans() {
  return useQuery({
    queryKey: ['loyalty', 'plans'],
    queryFn: async () => {
      const res = await api.get<{ results?: MembershipPlan[] } | MembershipPlan[]>('/loyalty/plans/');
      return normalizeList<MembershipPlan>(res);
    },
    staleTime: CACHE_TIMES.STATIC_CATALOG,
  });
}

/**
 * Query hook for Loyalty Coupons
 */
export function useCoupons() {
  return useQuery({
    queryKey: ['loyalty', 'coupons'],
    queryFn: async () => {
      const res = await api.get<{ results?: Coupon[] } | Coupon[]>('/loyalty/coupons/');
      return normalizeList<Coupon>(res);
    },
    staleTime: CACHE_TIMES.STATIC_CATALOG,
  });
}

/**
 * Invalidation Helpers for mutations
 */
export function useInvalidateQueries() {
  const queryClient = useQueryClient();

  return {
    invalidateAppointments: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
    invalidateMetrics: () => queryClient.invalidateQueries({ queryKey: ['analytics', 'metrics'] }),
    invalidateClients: () => queryClient.invalidateQueries({ queryKey: ['crm', 'clients'] }),
    invalidateCatalog: () => queryClient.invalidateQueries({ queryKey: ['catalog'] }),
    invalidateProducts: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
    invalidateStaff: () => queryClient.invalidateQueries({ queryKey: ['catalog', 'staff'] }),
    invalidateSalons: () => queryClient.invalidateQueries({ queryKey: ['platform', 'salons'] }),
    invalidateLoyalty: () => queryClient.invalidateQueries({ queryKey: ['loyalty'] }),
    invalidateAll: () => queryClient.invalidateQueries(),
  };
}
