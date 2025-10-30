import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

const ProtectedRoute = ({ children, requiredRole = 'ADMIN' }) => {
  const { isAuthenticated, admin, loading } = useAdminAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role permissions if specified
  if (requiredRole && admin) {
    const roleHierarchy = {
      'SUPER_ADMIN': 2,
      'ADMIN': 1
    };
    
    const userRoleLevel = roleHierarchy[admin.role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;
    
    if (userRoleLevel < requiredRoleLevel) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      );
    }
  }

  return children;
};

export default ProtectedRoute;