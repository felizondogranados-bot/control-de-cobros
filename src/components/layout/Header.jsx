import React from 'react';

/**
 * Header Component
 * 
 * Scalability Design:
 * - Dynamic titles and user display states.
 * - Styled with Tailwind CSS utility classes.
 */
function Header({ title, user }) {
  return (
    <header className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-brand-white w-full sticky top-0 z-10 shadow-sm">
      <h2 className="font-bold text-xl text-brand-gray-dark tracking-tight">
        {title}
      </h2>
      
      {user && (
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-sm font-medium text-slate-500">
            {user.email}
          </span>
          <div className="w-9 h-9 rounded-full bg-brand-blue/10 border border-brand-blue/20 text-brand-blue flex items-center justify-center font-bold text-sm shadow-sm select-none">
            {user.email.substring(0, 2).toUpperCase()}
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
