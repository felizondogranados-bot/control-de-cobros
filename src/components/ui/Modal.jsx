import React, { useEffect } from 'react';

/**
 * Reusable Modal Backdrop & Layout Component
 * 
 * - Adapts to any screen resolution, centering perfectly.
 * - Elegant background (soft dark overlay with light blur) keeps background visible.
 * - Supports keyboard ESC close and backdrop click-outside close.
 * - Restrained to max-h-[90vh] with flex layout and scrollable body.
 */
function Modal({ children, isOpen, onClose, title, loading = false, footer }) {
  // Listen for ESC key presses to close the modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose && !loading) {
        onClose();
      }
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, loading]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    // Only close if click is directly on the backdrop/overlay container
    if (e.target === e.currentTarget && onClose && !loading) {
      onClose();
    }
  };

  return (
    <div 
      onClick={handleOverlayClick}
      className="fixed inset-0 flex items-center justify-center p-4 z-50 animate-fade-in"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.18)',
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)'
      }}
    >
      <div 
        className="bg-white border border-linen rounded-3xl w-full max-w-lg p-6 shadow-premium relative flex flex-col max-h-[90vh] fade-in-up"
        onClick={(e) => e.stopPropagation()} // Prevent click events from propagating inside the modal
      >
        {/* Fixed Header */}
        {onClose && (
          <button
            onClick={onClose}
            type="button"
            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 font-bold text-lg select-none cursor-pointer p-2 rounded-full hover:bg-linen-light transition-all z-10"
            disabled={loading}
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        )}

        {title && (
          <h3 className="text-2xl font-bold text-brand-gray-dark mb-4 shrink-0 pr-8">
            {title}
          </h3>
        )}

        {/* Scrollable Body Content */}
        <div className="overflow-y-auto pr-1 flex-1 min-h-0">
          {children}
        </div>

        {/* Fixed Footer */}
        {footer && (
          <div className="pt-4 border-t border-linen/50 mt-4 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
