import React from 'react';

/**
 * Reusable LoadingState Component
 */
function LoadingState({ message = 'Cargando información...', ...props }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center w-full" {...props}>
      <div className="relative w-12 h-12 mb-4">
        <div className="w-12 h-12 rounded-full border-4 border-linen-dark border-t-moss animate-spin"></div>
      </div>
      <p className="text-base text-slate-500 font-medium animate-pulse">
        {message}
      </p>
    </div>
  );
}

export default LoadingState;
