import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { DashboardLayout } from './components/DashboardLayout';
import { RoleRouteGuard } from './components/RoleRouteGuard';

// Lazy-loaded Dashboard Pages (Route Code Splitting for optimal initial bundle & fast page loads)
const OverviewDashboard = React.lazy(() =>
  import('./pages/dashboard/OverviewDashboard').then((m) => ({ default: m.OverviewDashboard }))
);
const AppointmentCalendarPage = React.lazy(() =>
  import('./pages/dashboard/AppointmentCalendarPage').then((m) => ({ default: m.AppointmentCalendarPage }))
);
const ServicesPage = React.lazy(() =>
  import('./pages/dashboard/ServicesPage').then((m) => ({ default: m.ServicesPage }))
);
const StaffPage = React.lazy(() =>
  import('./pages/dashboard/StaffPage').then((m) => ({ default: m.StaffPage }))
);
const CustomersPage = React.lazy(() =>
  import('./pages/dashboard/CustomersPage').then((m) => ({ default: m.CustomersPage }))
);
const PosBillingPage = React.lazy(() =>
  import('./pages/dashboard/PosBillingPage').then((m) => ({ default: m.PosBillingPage }))
);
const InventoryPage = React.lazy(() =>
  import('./pages/dashboard/InventoryPage').then((m) => ({ default: m.InventoryPage }))
);
const LoyaltyOffersPage = React.lazy(() =>
  import('./pages/dashboard/LoyaltyOffersPage').then((m) => ({ default: m.LoyaltyOffersPage }))
);
const AnalyticsReportsPage = React.lazy(() =>
  import('./pages/dashboard/AnalyticsReportsPage').then((m) => ({ default: m.AnalyticsReportsPage }))
);
const SettingsPage = React.lazy(() =>
  import('./pages/dashboard/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);
const WebsiteBuilderPage = React.lazy(() =>
  import('./pages/builder/WebsiteBuilderPage').then((m) => ({ default: m.WebsiteBuilderPage }))
);
const SuperadminSalonsPage = React.lazy(() =>
  import('./pages/dashboard/SuperadminSalonsPage').then((m) => ({ default: m.SuperadminSalonsPage }))
);

// Lazy-loaded Auth & Storefront Pages
const LoginPage = React.lazy(() =>
  import('./pages/auth/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = React.lazy(() =>
  import('./pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage }))
);
const SalonStorefrontPage = React.lazy(() =>
  import('./pages/storefront/SalonStorefrontPage').then((m) => ({ default: m.SalonStorefrontPage }))
);

// Full-page Suspense Fallback (zero jarring layout shifts)
const PageLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-[var(--color-background)]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-9 h-9 border-3 border-[#0A24E9] border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-medium text-[var(--color-text-secondary)]">Loading...</span>
    </div>
  </div>
);

// TanStack Query configured with 60s default staleTime & 10m cache retention
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoadingFallback />}>
              <Routes>
                {/* Public Auth Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Public Dynamic Salon Storefront (/s/:salonSlug) */}
                <Route path="/s/:salonSlug" element={<SalonStorefrontPage />} />

                {/* Authenticated Salon Management Dashboard with Role-Based Route Protection */}
                <Route path="/dashboard" element={<DashboardLayout />}>
                  {/* Dynamic Role-Adaptive Dashboard Root */}
                  <Route index element={<OverviewDashboard />} />

                  {/* Appointments Calendar */}
                  <Route
                    path="calendar"
                    element={
                      <RoleRouteGuard requiredPermission="VIEW_APPOINTMENTS" featureName="Appointments & Calendar">
                        <AppointmentCalendarPage />
                      </RoleRouteGuard>
                    }
                  />

                  {/* Services Catalog */}
                  <Route
                    path="services"
                    element={
                      <RoleRouteGuard requiredPermission="VIEW_SERVICES" featureName="Services Catalog">
                        <ServicesPage />
                      </RoleRouteGuard>
                    }
                  />

                  {/* Customers / CRM */}
                  <Route
                    path="clients"
                    element={
                      <RoleRouteGuard requiredPermission="VIEW_CLIENTS" featureName="Customers & CRM">
                        <CustomersPage />
                      </RoleRouteGuard>
                    }
                  />

                  {/* Staff & Shifts (Salon Owner / Manager only) */}
                  <Route
                    path="staff"
                    element={
                      <RoleRouteGuard requiredPermission="MANAGE_STAFF" featureName="Staff & Shifts Management">
                        <StaffPage />
                      </RoleRouteGuard>
                    }
                  />

                  {/* POS Billing & Counter (Owner & Receptionist) */}
                  <Route
                    path="pos"
                    element={
                      <RoleRouteGuard requiredPermission="MANAGE_POS" featureName="POS & Billing">
                        <PosBillingPage />
                      </RoleRouteGuard>
                    }
                  />

                  {/* Inventory Management (Owner only) */}
                  <Route
                    path="inventory"
                    element={
                      <RoleRouteGuard requiredPermission="MANAGE_INVENTORY" featureName="Inventory Management">
                        <InventoryPage />
                      </RoleRouteGuard>
                    }
                  />

                  {/* Loyalty & Offers / Marketing (Owner only) */}
                  <Route
                    path="loyalty"
                    element={
                      <RoleRouteGuard requiredPermission="MANAGE_LOYALTY" featureName="Loyalty & Offers Marketing">
                        <LoyaltyOffersPage />
                      </RoleRouteGuard>
                    }
                  />

                  {/* Website Builder (Owner only) */}
                  <Route
                    path="builder"
                    element={
                      <RoleRouteGuard requiredPermission="MANAGE_WEBSITE_BUILDER" featureName="Website Builder">
                        <WebsiteBuilderPage />
                      </RoleRouteGuard>
                    }
                  />

                  {/* Reports & Analytics (Owner only) */}
                  <Route
                    path="reports"
                    element={
                      <RoleRouteGuard requiredPermission="VIEW_REPORTS" featureName="Reports & Business Analytics">
                        <AnalyticsReportsPage />
                      </RoleRouteGuard>
                    }
                  />

                  {/* Salon Settings (Owner only) */}
                  <Route
                    path="settings"
                    element={
                      <RoleRouteGuard requiredPermission="MANAGE_SETTINGS" featureName="Salon Configuration & Settings">
                        <SettingsPage />
                      </RoleRouteGuard>
                    }
                  />

                  {/* Superadmin Platform Salons */}
                  <Route
                    path="salons"
                    element={
                      <RoleRouteGuard requiredPermission="MANAGE_PLATFORM_SALONS" featureName="Platform Salon Organizations">
                        <SuperadminSalonsPage />
                      </RoleRouteGuard>
                    }
                  />
                </Route>

                {/* Direct URL Standalone Aliases — redirects to protected dashboard routes */}
                <Route path="/website-builder" element={<Navigate to="/dashboard/builder" replace />} />
                <Route path="/builder" element={<Navigate to="/dashboard/builder" replace />} />
                <Route path="/reports" element={<Navigate to="/dashboard/reports" replace />} />
                <Route path="/settings" element={<Navigate to="/dashboard/settings" replace />} />
                <Route path="/staff" element={<Navigate to="/dashboard/staff" replace />} />
                <Route path="/inventory" element={<Navigate to="/dashboard/inventory" replace />} />
                <Route path="/pos" element={<Navigate to="/dashboard/pos" replace />} />
                <Route path="/calendar" element={<Navigate to="/dashboard/calendar" replace />} />
                <Route path="/services" element={<Navigate to="/dashboard/services" replace />} />
                <Route path="/clients" element={<Navigate to="/dashboard/clients" replace />} />
                <Route path="/salons" element={<Navigate to="/dashboard/salons" replace />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
