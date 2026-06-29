import React from 'react';
import { NavLink } from 'react-router-dom';

/**
 * Sidebar Component
 * 
 * Scalability Design:
 * - Employs NavLink components from react-router-dom to handle UI active state styling automatically.
 * - Fits responsive screens.
 */
function Sidebar({ isAuthenticated, onLogout }) {
  const privateTabs = [
    { path: '/', label: '📊 Dashboard', end: true },
    { path: '/categorias', label: '📂 Categorías', end: false },
    { path: '/clientes', label: '👥 Clientes', end: false },
    { path: '/deudas', label: '💸 Deudas', end: false },
    { path: '/pagos', label: '💳 Pagos', end: false },
    { path: '/movimientos', label: '📜 Movimientos', end: false },
  ];

  const publicTabs = [
    { path: '/login', label: '🔑 Iniciar Sesión', end: false },
    { path: '/register', label: '📝 Registrarse', end: false },
    { path: '/forgot-password', label: '🔒 Recuperar Clave', end: false },
  ];

  const tabs = isAuthenticated ? privateTabs : publicTabs;

  return (
    <aside className="w-full md:w-64 bg-brand-white border-b md:border-b-0 md:border-r border-slate-200 p-6 flex flex-col md:h-screen shrink-0 shadow-sm">
      <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-brand-blue flex items-center justify-center text-brand-white font-bold text-lg">
          $
        </div>
        <h3 className="font-bold text-lg text-brand-gray-dark tracking-tight">
          Control de Cobros
        </h3>
      </div>

      <nav className="flex md:flex-col gap-1.5 mt-6 overflow-x-auto md:overflow-x-visible pb-3 md:pb-0 scrollbar-none">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.end}
            className={({ isActive }) =>
              `whitespace-nowrap px-4 py-2.5 text-left text-sm font-medium rounded-lg transition-all duration-150 shrink-0 ${
                isActive
                  ? 'bg-brand-blue/10 text-brand-blue font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-brand-gray-dark'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      {isAuthenticated && (
        <div className="mt-auto pt-6 border-t border-slate-100 hidden md:block">
          <button
            onClick={onLogout}
            className="w-full px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold rounded-lg text-sm transition-colors duration-150 inline-flex items-center justify-center gap-2"
          >
            🚪 Cerrar Sesión
          </button>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
