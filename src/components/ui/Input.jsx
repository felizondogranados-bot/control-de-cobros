import React from 'react';

/**
 * Reusable Input Component with Label and Help/Error text
 */
function Input({ label, error, helperText, id, type = 'text', required = false, ...props }) {
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-slate-600 tracking-wide">
          {label} {required && <span className="text-rose-dark">*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        required={required}
        className={`w-full px-4 py-3 bg-white border rounded-xl text-base text-brand-gray-dark placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm ${
          error 
            ? 'border-rose focus:ring-rose/20 focus:border-rose' 
            : 'border-linen-dark focus:ring-moss/20 focus:border-moss'
        }`}
        {...props}
      />
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

export default Input;
