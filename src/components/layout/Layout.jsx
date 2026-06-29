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
      case '/': return 'Inicio';
      case '/categorias': return 'Grupos';
      case '/clientes': return 'Clientes';
      case '/deudas': return 'Deudas';
      case '/pagos': return 'Pagos';
      case '/movimientos': return 'Historial';
      case '/login': return 'Ingreso';
      case '/register': return 'Registro';
      case '/forgot-password': return 'Recuperar';
      default: return 'Control de Cobros';
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-linen-light font-sans text-brand-gray-dark selection:bg-moss/20 selection:text-moss-dark">
      <Sidebar 
        isAuthenticated={isAuthenticated}
        onLogout={logout}
      />
      <div className="flex-1 flex flex-col min-w-0">
        {offline && (
          <div className="bg-rose-light text-rose-dark border-b border-rose/30 text-center py-3 px-4 text-sm font-bold w-full z-50 flex items-center justify-center gap-2 shadow-sm animate-pulse">
            <span>⚠️ Sin conexión a internet. Algunas funciones pueden estar limitadas.</span>
          </div>
        )}
        <Header title={getTitle()} user={user} />
        <main className="p-6 md:p-10 flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full fade-in-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
