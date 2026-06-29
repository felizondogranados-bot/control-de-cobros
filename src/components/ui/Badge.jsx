import React from 'react';

/**
 * Reusable Badge Component for displaying states (paid, unpaid, active, inactive)
 */
function Badge({ children, variant = 'info', ...props }) {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return 'bg-matcha-light text-moss-dark border-matcha/40';
      case 'danger':
        return 'bg-rose-light text-rose-dark border-rose/30';
      case 'warning':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'info':
      default:
        return 'bg-linen-light text-slate-700 border-linen-dark/50';
    }
  };

  return (
    <span 
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${getColors()}`}
      {...props}
    >
      {children}
    </span>
  );
}

export default Badge;
