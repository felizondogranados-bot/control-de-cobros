import React from 'react';

/**
 * Reusable Select Component
 */
function Select({ label, error, helperText, id, children, required = false, ...props }) {
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-slate-600 tracking-wide">
          {label} {required && <span className="text-rose-dark">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          required={required}
          className={`w-full px-4 py-3 bg-white border rounded-xl text-base text-brand-gray-dark focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm appearance-none pr-10 cursor-pointer ${
            error 
              ? 'border-rose focus:ring-rose/20 focus:border-rose' 
              : 'border-linen-dark focus:ring-moss/20 focus:border-moss'
          }`}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
          </svg>
        </div>
      </div>
      {error ? (
        <p className="text-sm font-medium text-rose-dark flex items-center gap-1 mt-0.5">
          ⚠️ {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-slate-400 mt-0.5">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

export default Select;
