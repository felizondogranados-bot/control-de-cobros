import React from 'react';

/**
 * Header Component
 * 
 * Scalability Design:
 * - Dynamic titles and user display states.
 * - Styled with Tailwind CSS warm design system.
 */
function Header({ title, user }) {
  // Map internal title strings to cleaner, simpler titles for the user
  const getSimpleTitle = (t) => {
    if (t === 'Gestión de Categorías') return 'Grupos de Clientes';
    if (t === 'Auditoría de Movimientos') return 'Historial de Actividad';
    return t;
  };

  return (
    <header className="flex justify-between items-center px-6 py-5 border-b border-linen bg-white w-full sticky top-0 z-10 shadow-soft">
      <h2 className="font-title font-bold text-2xl text-brand-gray-dark tracking-tight">
        {getSimpleTitle(title)}
      </h2>
      
      {user && (
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-base font-semibold text-slate-500">
            {user.email}
          </span>
          <div className="w-10 h-10 rounded-full bg-moss/10 border border-moss/20 text-moss-dark flex items-center justify-center font-bold text-base shadow-sm select-none">
            {user.email.substring(0, 2).toUpperCase()}
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
