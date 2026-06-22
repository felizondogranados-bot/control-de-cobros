import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../hooks/useAuth';
import { isOnline, monitorConnectivity } from '../../utils/pwa';

/**
 * Layout Component
 * 
 * Scalability Design:
 * - Integrates React Router's useLocation hook to compute title dynamically.
 * - Uses the <Outlet /> component for rendering active nested route screens.
 * - Resolves auth values directly from useAuth context hook.
 * - Monitors network connection and displays a clean banner when offline.
 */
function Layout() {
  const { pathname } = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [offline, setOffline] = useState(!isOnline());

  useEffect(() => {
    const cleanup = monitorConnectivity((online) => {
      setOffline(!online);
    });
    return cleanup;
  }, []);

  const getTitle = () => {
    switch (pathname) {
      case '/': return 'Dashboard';
      case '/clientes': return 'Gestión de Clientes';
      case '/deudas': return 'Control de Deudas';
      case '/pagos': return 'Historial de Pagos';
      case '/movimientos': return 'Auditoría de Movimientos';
      case '/login': return 'Ingreso al Sistema';
      case '/register': return 'Crear Cuenta';
      case '/forgot-password': return 'Recuperar Clave';
      default: return 'Control de Cobros';
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-brand-gray-light font-sans">
      <Sidebar 
        isAuthenticated={isAuthenticated}
        onLogout={logout}
      />
      <div className="flex-1 flex flex-col min-w-0">
        {offline && (
          <div className="bg-rose-600 text-white text-center py-2.5 px-4 text-xs font-extrabold w-full z-50 flex items-center justify-center gap-2 shadow-md animate-pulse">
            <span>⚠️ Sin conexión a internet. Algunas funciones pueden no estar disponibles.</span>
          </div>
        )}
        <Header title={getTitle()} user={user} />
        <main className="p-6 md:p-8 flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;

