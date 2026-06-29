import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Folder, 
  Users, 
  DollarSign, 
  CreditCard, 
  History, 
  LogIn, 
  UserPlus, 
  Key, 
  LogOut 
} from 'lucide-react';

/**
 * Sidebar Component
 * 
 * Scalability Design:
 * - Employs NavLink components from react-router-dom to handle UI active state styling automatically.
 * - Uses Lucide icons and warm minimalist styling.
 * - Accessible minimum tap sizes for all touch elements.
 */
function Sidebar({ isAuthenticated, onLogout }) {
  const privateTabs = [
    { path: '/', label: 'Inicio', icon: Home, end: true },
    { path: '/clientes', label: 'Clientes', icon: Users, end: false },
    { path: '/deudas', label: 'Deudas', icon: DollarSign, end: false },
    { path: '/pagos', label: 'Pagos', icon: CreditCard, end: false },
  ];

  const publicTabs = [
    { path: '/login', label: 'Ingresar', icon: LogIn, end: false },
    { path: '/register', label: 'Registrarse', icon: UserPlus, end: false },
    { path: '/forgot-password', label: 'Recuperar', icon: Key, end: false },
  ];

  const tabs = isAuthenticated ? privateTabs : publicTabs;

  return (
    <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-linen p-6 flex flex-col md:h-screen shrink-0 shadow-soft">
      {/* Brand Header */}
      <div className="flex items-center gap-3 pb-6 border-b border-linen/50">
        <div className="w-10 h-10 rounded-2xl bg-moss flex items-center justify-center text-white font-bold text-xl shadow-md shadow-moss/10 select-none">
          $
        </div>
        <div className="flex flex-col">
          <h3 className="font-title font-bold text-lg text-brand-gray-dark tracking-tight leading-tight">
            Control de Cobros
          </h3>
          <span className="text-xs text-moss-dark font-medium tracking-wide">
            Administración cálida
          </span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex md:flex-col gap-2 mt-6 overflow-x-auto md:overflow-x-visible pb-3 md:pb-0 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.end}
              className={({ isActive }) =>
                `whitespace-nowrap px-4 py-3 text-left text-base font-semibold rounded-xl transition-all duration-200 shrink-0 flex items-center gap-3 min-h-[44px] ${
                  isActive
                    ? 'bg-moss/10 text-moss-dark border-l-4 border-moss pl-3'
                    : 'text-slate-600 hover:bg-linen-light hover:text-brand-gray-dark border-l-4 border-transparent'
                }`
              }
            >
              <Icon className="w-5 h-5 opacity-80" />
              <span>{tab.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Logout Action */}
      {isAuthenticated && (
        <div className="mt-auto pt-6 border-t border-linen/50 hidden md:block">
          <button
            onClick={onLogout}
            className="w-full px-4 py-3 bg-rose-light hover:bg-rose/25 text-rose-dark font-semibold rounded-xl text-base transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer min-h-[44px] border border-rose/30"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
