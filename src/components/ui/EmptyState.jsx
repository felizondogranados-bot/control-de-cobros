import React from 'react';
import Button from './Button';

/**
 * Reusable EmptyState Component
 */
function EmptyState({ title, description, icon, actionText, onAction, ...props }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-dashed border-linen-dark rounded-3xl max-w-lg mx-auto shadow-sm fade-in-up" {...props}>
      <div className="w-16 h-16 rounded-full bg-linen-light flex items-center justify-center text-moss text-3xl mb-6 shadow-inner">
        {icon || '📁'}
      </div>
      <h3 className="text-xl font-bold text-brand-gray-dark mb-2">
        {title}
      </h3>
      <p className="text-base text-slate-500 mb-6 max-w-sm">
        {description}
      </p>
      {actionText && onAction && (
        <Button onClick={onAction} variant="primary">
          {actionText}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
