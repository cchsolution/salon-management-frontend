import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Permission, hasPermission, ROUTE_PERMISSION_MAP, ROLE_LABELS } from '../constants/permissions';
import { UserRole } from '../types';
import { AccessDenied } from './AccessDenied';

interface RoleRouteGuardProps {
  children?: React.ReactNode;
  requiredPermission?: Permission;
  allowedRoles?: UserRole[];
  featureName?: string;
}

export const RoleRouteGuard: React.FC<RoleRouteGuardProps> = ({
  children,
  requiredPermission,
  allowedRoles,
  featureName,
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#6D28D9] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-[var(--text-secondary)]">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check explicit allowedRoles
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      const allowedNames = allowedRoles.map((r) => ROLE_LABELS[r] || r).join(' or ');
      return (
        <AccessDenied
          featureName={featureName || 'This page'}
          requiredRole={allowedNames}
        />
      );
    }
  }

  // Check requiredPermission
  if (requiredPermission) {
    if (!hasPermission(user.role, requiredPermission)) {
      return (
        <AccessDenied
          featureName={featureName || 'This page'}
          requiredRole="authorized roles with management permissions"
        />
      );
    }
  }

  // Auto-detect based on current path segment if neither is explicitly passed
  const segment = location.pathname.replace(/^\/dashboard\/?/, '').replace(/^\//, '').split('/')[0].split('?')[0];
  if (segment && ROUTE_PERMISSION_MAP[segment]) {
    const autoPerm = ROUTE_PERMISSION_MAP[segment];
    if (!hasPermission(user.role, autoPerm)) {
      const friendlyName = segment.charAt(0).toUpperCase() + segment.slice(1);
      return (
        <AccessDenied
          featureName={`${friendlyName} Management`}
          requiredRole="Salon Owner"
        />
      );
    }
  }

  return children ? <>{children}</> : null;
};
