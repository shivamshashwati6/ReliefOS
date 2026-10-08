import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLE_DEFAULT_ROUTES } from '../../config/roles';

/**
 * ProtectedRoute: Enforces authentication and role-based route permissions.
 *
 * @param {React.ReactNode} children - Protected component
 * @param {string[]} allowedRoles - Array of roles permitted (e.g. ['CITIZEN'], ['COMMAND_CENTER'], ['DEPARTMENT'])
 * @param {string[]} allowedDepartments - Optional array of specific departments permitted (e.g. ['HEALTH'])
 */
export function ProtectedRoute({ 
  children, 
  allowedRoles = [], 
  allowedDepartments = [] 
}) {
  const { isAuthenticated, currentUser } = useAuth();
  const location = useLocation();

  // 1. Unauthenticated users are redirected to /login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Role-based authorization
  if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser?.role)) {
    // Redirect unauthorized user to their role's designated homepage
    const fallbackPath = ROLE_DEFAULT_ROUTES[currentUser?.role] || '/login';
    return <Navigate to={fallbackPath} replace />;
  }

  // 3. Department-specific authorization if restricted
  if (
    allowedDepartments.length > 0 &&
    currentUser?.department &&
    !allowedDepartments.includes(currentUser.department)
  ) {
    return <Navigate to="/department/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
