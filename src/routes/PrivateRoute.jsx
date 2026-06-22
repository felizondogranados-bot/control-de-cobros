import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * PrivateRoute component
 * 
 * - Limits navigation to verified accounts only.
 * - Redirects unauthenticated users back to the Login page.
 */
function PrivateRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-gray-light">
        <div className="text-sm font-semibold text-slate-500 animate-pulse">
          Cargando sesión...
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

export default PrivateRoute;
