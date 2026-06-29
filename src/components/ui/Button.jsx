import React from 'react';

/**
 * Reusable Button Component
 * 
 * Scalability Design:
 * - Styled using Tailwind CSS classes.
 * - Adheres to the new warm financial design system colors and typography.
 * - Minimum tactile click size of 44px for accessibility.
 */
function Button({ children, onClick, type = 'button', variant = 'primary', disabled = false, ...props }) {
  const getClassName = () => {
    const base = 'px-6 py-3 font-semibold rounded-xl text-base inline-flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] cursor-pointer min-h-[44px]';
    
    if (disabled) {
      return `${base} bg-linen text-slate-400 cursor-not-allowed opacity-50 border border-linen-dark/20`;
    }
    
    switch (variant) {
      case 'primary':
        return `${base} bg-moss hover:bg-moss-hover text-white shadow-sm hover:shadow-md hover:shadow-moss/10`;
      case 'secondary':
        return `${base} bg-linen hover:bg-linen-dark/50 text-moss-dark border border-linen-dark/20`;
      case 'danger':
        return `${base} bg-rose-light hover:bg-rose/25 text-rose-dark border border-rose/30`;
      case 'success':
        return `${base} bg-matcha-light hover:bg-matcha/20 text-moss-dark border border-matcha/40`;
      default:
        return `${base} bg-moss hover:bg-moss-hover text-white shadow-sm`;
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
