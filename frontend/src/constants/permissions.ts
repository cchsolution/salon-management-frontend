import {
  LayoutDashboard,
  Calendar,
  Scissors,
  Users,
  UserCheck,
  CreditCard,
  Package,
  Award,
  Globe,
  BarChart3,
  Settings,
  Building2,
  LucideIcon
} from 'lucide-react';
import { UserRole } from '../types';

export const ROLES = {
  SUPERADMIN: 'SUPERADMIN',
  SALON_OWNER: 'SALON_OWNER',
  SALON_MANAGER: 'SALON_MANAGER',
  RECEPTIONIST: 'RECEPTIONIST',
  STYLIST: 'STYLIST',
  INVENTORY_MANAGER: 'INVENTORY_MANAGER',
  CUSTOMER: 'CUSTOMER',
} as const;

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPERADMIN: 'Platform Superadmin',
  SALON_OWNER: 'Salon Owner',
  SALON_MANAGER: 'Salon Manager',
  RECEPTIONIST: 'Receptionist',
  STYLIST: 'Hair Stylist',
  INVENTORY_MANAGER: 'Inventory Manager',
  CUSTOMER: 'Customer',
};

export type Permission =
  // Dashboard views
  | 'VIEW_OWNER_DASHBOARD'
  | 'VIEW_STYLIST_DASHBOARD'
  | 'VIEW_RECEPTIONIST_DASHBOARD'
  | 'VIEW_SUPERADMIN_DASHBOARD'
  // Features
  | 'VIEW_APPOINTMENTS'
  | 'MANAGE_APPOINTMENTS'
  | 'VIEW_SERVICES'
  | 'MANAGE_SERVICES'
  | 'VIEW_CLIENTS'
  | 'MANAGE_CLIENTS'
  | 'MANAGE_STAFF'
  | 'MANAGE_POS'
  | 'MANAGE_INVENTORY'
  | 'MANAGE_LOYALTY'
  | 'MANAGE_WEBSITE_BUILDER'
  | 'VIEW_REPORTS'
  | 'MANAGE_SETTINGS'
  // Platform Superadmin
  | 'MANAGE_PLATFORM_SALONS'
  | 'MANAGE_PLATFORM_USERS';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SALON_OWNER: [
    'VIEW_OWNER_DASHBOARD',
    'VIEW_APPOINTMENTS',
    'MANAGE_APPOINTMENTS',
    'VIEW_SERVICES',
    'MANAGE_SERVICES',
    'VIEW_CLIENTS',
    'MANAGE_CLIENTS',
    'MANAGE_STAFF',
    'MANAGE_POS',
    'MANAGE_INVENTORY',
    'MANAGE_LOYALTY',
    'MANAGE_WEBSITE_BUILDER',
    'VIEW_REPORTS',
    'MANAGE_SETTINGS',
  ],
  SALON_MANAGER: [
    'VIEW_OWNER_DASHBOARD',
    'VIEW_APPOINTMENTS',
    'MANAGE_APPOINTMENTS',
    'VIEW_SERVICES',
    'MANAGE_SERVICES',
    'VIEW_CLIENTS',
    'MANAGE_CLIENTS',
    'MANAGE_STAFF',
    'MANAGE_POS',
    'MANAGE_INVENTORY',
    'MANAGE_LOYALTY',
    'MANAGE_WEBSITE_BUILDER',
    'VIEW_REPORTS',
    'MANAGE_SETTINGS',
  ],
  // 'STYLIST' is the backend role string
  STYLIST: [
    'VIEW_STYLIST_DASHBOARD',
    'VIEW_APPOINTMENTS',
    'MANAGE_APPOINTMENTS',
    'VIEW_SERVICES',
    'VIEW_CLIENTS',
  ],
  RECEPTIONIST: [
    'VIEW_RECEPTIONIST_DASHBOARD',
    'VIEW_APPOINTMENTS',
    'MANAGE_APPOINTMENTS',
    'VIEW_SERVICES',
    'VIEW_CLIENTS',
    'MANAGE_CLIENTS',
    'MANAGE_POS',
  ],
  INVENTORY_MANAGER: [
    'VIEW_OWNER_DASHBOARD',
    'VIEW_SERVICES',
    'MANAGE_INVENTORY',
  ],
  SUPERADMIN: [
    'VIEW_SUPERADMIN_DASHBOARD',
    'MANAGE_PLATFORM_SALONS',
    'MANAGE_PLATFORM_USERS',
  ],
  CUSTOMER: [
    'VIEW_SERVICES',
  ],
};

export interface NavItemConfig {
  label: string;
  to: string;
  icon: LucideIcon;
  permission?: Permission;
}

export const ALL_NAV_ITEMS: Record<string, NavItemConfig> = {
  dashboard: { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  calendar: { label: 'Appointments', to: '/dashboard/calendar', icon: Calendar, permission: 'VIEW_APPOINTMENTS' },
  myCalendar: { label: 'My Appointments', to: '/dashboard/calendar', icon: Calendar, permission: 'VIEW_APPOINTMENTS' },
  services: { label: 'Services', to: '/dashboard/services', icon: Scissors, permission: 'VIEW_SERVICES' },
  myServices: { label: 'My Services', to: '/dashboard/services', icon: Scissors, permission: 'VIEW_SERVICES' },
  clients: { label: 'Customers / CRM', to: '/dashboard/clients', icon: Users, permission: 'VIEW_CLIENTS' },
  myClients: { label: 'My Customers', to: '/dashboard/clients', icon: Users, permission: 'VIEW_CLIENTS' },
  staff: { label: 'Staff & Shifts', to: '/dashboard/staff', icon: UserCheck, permission: 'MANAGE_STAFF' },
  pos: { label: 'POS & Billing', to: '/dashboard/pos', icon: CreditCard, permission: 'MANAGE_POS' },
  inventory: { label: 'Inventory', to: '/dashboard/inventory', icon: Package, permission: 'MANAGE_INVENTORY' },
  loyalty: { label: 'Loyalty & Offers', to: '/dashboard/loyalty', icon: Award, permission: 'MANAGE_LOYALTY' },
  builder: { label: 'Website Builder', to: '/dashboard/builder', icon: Globe, permission: 'MANAGE_WEBSITE_BUILDER' },
  reports: { label: 'Reports & Analytics', to: '/dashboard/reports', icon: BarChart3, permission: 'VIEW_REPORTS' },
  settings: { label: 'Salon Settings', to: '/dashboard/settings', icon: Settings, permission: 'MANAGE_SETTINGS' },
  salons: { label: 'Salon Organizations', to: '/dashboard/salons', icon: Building2, permission: 'MANAGE_PLATFORM_SALONS' },
};

/**
 * Returns the exact list of navigation items for the given role.
 * Ensures zero broken links, zero empty gaps, and correct role-specific labels.
 */
export function getNavigationForRole(role: UserRole | undefined | null): NavItemConfig[] {
  if (!role) return [];

  switch (role) {
    case 'SALON_OWNER':
    case 'SALON_MANAGER':
      return [
        ALL_NAV_ITEMS.dashboard,
        ALL_NAV_ITEMS.calendar,
        ALL_NAV_ITEMS.services,
        ALL_NAV_ITEMS.clients,
        ALL_NAV_ITEMS.staff,
        ALL_NAV_ITEMS.pos,
        ALL_NAV_ITEMS.inventory,
        ALL_NAV_ITEMS.loyalty,
        ALL_NAV_ITEMS.builder,
        ALL_NAV_ITEMS.reports,
        ALL_NAV_ITEMS.settings,
      ];

    case 'STYLIST':
      return [
        ALL_NAV_ITEMS.dashboard,
        ALL_NAV_ITEMS.myCalendar,
        ALL_NAV_ITEMS.myServices,
        ALL_NAV_ITEMS.myClients,
      ];

    case 'RECEPTIONIST':
      return [
        ALL_NAV_ITEMS.dashboard,
        ALL_NAV_ITEMS.calendar,
        ALL_NAV_ITEMS.clients,
        ALL_NAV_ITEMS.pos,
        ALL_NAV_ITEMS.services,
      ];

    case 'SUPERADMIN':
      return [
        ALL_NAV_ITEMS.dashboard,
        ALL_NAV_ITEMS.salons,
      ];

    case 'INVENTORY_MANAGER':
      return [
        ALL_NAV_ITEMS.dashboard,
        ALL_NAV_ITEMS.inventory,
        ALL_NAV_ITEMS.services,
      ];

    default:
      return [ALL_NAV_ITEMS.dashboard];
  }
}

/**
 * Checks if a user role has a specific permission.
 */
export function hasPermission(role: UserRole | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Route protection mapping:
 * Maps dashboard route segments to required permissions.
 */
export const ROUTE_PERMISSION_MAP: Record<string, Permission> = {
  'calendar': 'VIEW_APPOINTMENTS',
  'services': 'VIEW_SERVICES',
  'clients': 'VIEW_CLIENTS',
  'staff': 'MANAGE_STAFF',
  'pos': 'MANAGE_POS',
  'inventory': 'MANAGE_INVENTORY',
  'loyalty': 'MANAGE_LOYALTY',
  'builder': 'MANAGE_WEBSITE_BUILDER',
  'reports': 'VIEW_REPORTS',
  'settings': 'MANAGE_SETTINGS',
  'salons': 'MANAGE_PLATFORM_SALONS',
};

/**
 * Checks if the role can access a route path.
 */
export function canAccessRoute(role: UserRole | undefined | null, path: string): boolean {
  if (!role) return false;

  // Root dashboard is accessible to all authenticated roles
  const cleanPath = path.replace(/^\/dashboard\/?/, '').replace(/^\//, '').split('/')[0].split('?')[0];
  if (!cleanPath || cleanPath === 'dashboard') {
    return true;
  }

  const requiredPermission = ROUTE_PERMISSION_MAP[cleanPath];
  if (!requiredPermission) {
    return true; // Unknown/public subroute
  }

  return hasPermission(role, requiredPermission);
}
