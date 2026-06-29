import React from 'react';

/**
 * Reusable Alert Component for warnings, success messages, etc.
 */
function Alert({ children, type = 'error', onClose, ...props }) {
  const getColors = () => {
    switch (type) {
      case 'success':
        return 'bg-matcha-light border-matcha text-moss-dark';
      case 'warning':
        return 'bg-amber-50 border-amber-300 text-amber-800';
      case 'info':
        return 'bg-linen-light border-linen-dark text-slate-700';
      case 'error':
      default:
        return 'bg-rose-light border-rose text-rose-dark';
    }
  };

  return (
    <div 
      className={`p-4 border-l-4 rounded-r-xl flex items-center justify-between text-base font-medium shadow-sm transition-all duration-150 ${getColors()}`}
      role="alert"
      {...props}
    >
      <div className="flex items-center gap-2">
        <span>{type === 'error' ? '⚠️' : type === 'success' ? '✨' : 'ℹ️'}</span>
        <div>{children}</div>
      </div>
      {onClose && (
        <button 
          onClick={onClose} 
          type="button"
          className="text-slate-400 hover:text-slate-600 font-bold p-1 select-none cursor-pointer"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default Alert;
