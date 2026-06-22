import React from 'react';

/**
 * Reusable Button Component
 * 
 * Scalability Design:
 * - Styled using Tailwind CSS classes.
 * - Adheres to the financial design system colors and typography.
 */
function Button({ children, onClick, type = 'button', variant = 'primary', disabled = false, ...props }) {
  const getClassName = () => {
    const base = 'px-4 py-2.5 font-semibold rounded-lg text-sm inline-flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]';
    
    if (disabled) {
      return `${base} bg-slate-100 text-slate-400 cursor-not-allowed opacity-60`;
    }
    
    switch (variant) {
      case 'primary':
        return `${base} bg-brand-blue hover:bg-brand-blue/90 text-brand-white shadow-sm hover:shadow-md hover:shadow-brand-blue/10`;
      case 'secondary':
        return `${base} bg-slate-100 hover:bg-slate-200 text-slate-700`;
      case 'danger':
        return `${base} bg-rose-600 hover:bg-rose-700 text-brand-white shadow-sm`;
      case 'success':
        return `${base} bg-emerald-600 hover:bg-emerald-700 text-brand-white shadow-sm`;
      default:
        return `${base} bg-brand-blue hover:bg-brand-blue/90 text-brand-white shadow-sm`;
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={getClassName()}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
