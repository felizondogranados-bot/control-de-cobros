import React from 'react';

/**
 * Reusable Card Component
 */
function Card({ children, className = '', hoverable = false, ...props }) {
  return (
    <div 
      className={`bg-white border border-linen rounded-2xl p-6 shadow-soft transition-all duration-300 ${
        hoverable ? 'hover:shadow-premium hover:-translate-y-0.5' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
