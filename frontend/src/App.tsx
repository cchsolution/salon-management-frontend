import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { DashboardLayout } from './components/DashboardLayout';
import { RoleRouteGuard } from './components/RoleRouteGuard';

// Dashboard Pages
import { OverviewDashboard } from './pages/dashboard/OverviewDashboard';
import { AppointmentCalendarPage } from './pages/dashboard/AppointmentCalendarPage';
import { ServicesPage } from './pages/dashboard/ServicesPage';
import { StaffPage } from './pages/dashboard/StaffPage';
import { CustomersPage } from './pages/dashboard/CustomersPage';
import { PosBillingPage } from './pages/dashboard/PosBillingPage';
import { InventoryPage } from './pages/dashboard/InventoryPage';
import { LoyaltyOffersPage } from './pages/dashboard/LoyaltyOffersPage';
import { AnalyticsReportsPage } from './pages/dashboard/AnalyticsReportsPage';
import { SettingsPage } from './pages/dashboard/SettingsPage';
import { WebsiteBuilderPage } from './pages/builder/WebsiteBuilderPage';
import { SuperadminSalonsPage } from './pages/dashboard/SuperadminSalonsPage';

// Auth & Storefront Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { SalonStorefrontPage } from './pages/storefront/SalonStorefrontPage';

// TanStack Query configured with 60s staleTime to prevent redundant refetches
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
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
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
