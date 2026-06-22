import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * PublicRoute component
 * 
 * - Allows navigation to login/register only if the user is NOT authenticated.
 * - If the user is authenticated, redirects them to the main dashboard.
 */
function PublicRoute() {
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

  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />;
}

export default PublicRoute;
