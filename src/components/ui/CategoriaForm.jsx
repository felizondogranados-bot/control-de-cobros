import React, { useState, useEffect } from 'react';

/**
 * CategoriaForm Component
 * 
 * - Modal form to create or edit a category.
 * - Handles validations (Name is required, must not be empty).
 * - Exposes a curated color palette of premium Tailwind-like hex colors.
 * - Exposes a state dropdown (activa/inactiva).
 */
const CURATED_COLORS = [
  { name: 'Azul', value: '#3b82f6', bgClass: 'bg-[#3b82f6]' },
  { name: 'Esmeralda', value: '#10b981', bgClass: 'bg-[#10b981]' },
  { name: 'Violeta', value: '#8b5cf6', bgClass: 'bg-[#8b5cf6]' },
  { name: 'Ámbar', value: '#f59e0b', bgClass: 'bg-[#f59e0b]' },
  { name: 'Rosa', value: '#f43f5e', bgClass: 'bg-[#f43f5e]' },
  { name: 'Índigo', value: '#6366f1', bgClass: 'bg-[#6366f1]' },
  { name: 'Turquesa', value: '#14b8a6', bgClass: 'bg-[#14b8a6]' },
  { name: 'Gris Azulado', value: '#64748b', bgClass: 'bg-[#64748b]' },
];

function CategoriaForm({ initialData, onSubmit, onClose }) {
  const [nombre, setNombre] = useState('');
  const [color, setColor] = useState('');
  const [estado, setEstado] = useState('activa');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setNombre(initialData.nombre || '');
      setColor(initialData.color || '');
      setEstado(initialData.estado || 'activa');
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanNombre = nombre.trim();
    if (!cleanNombre) {
      setError('El nombre de la categoría es obligatorio.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        nombre: cleanNombre,
        color: color || null,
        estado: estado
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Error al guardar la categoría.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-brand-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-lg select-none"
          disabled={loading}
        >
          ✕
        </button>

        <h3 className="text-xl font-bold text-brand-gray-dark mb-4">
          {initialData ? 'Editar Categoría' : 'Nueva Categoría'}
        </h3>

        {error && (
          <div className="mb-4 p-3.5 bg-rose-50 border-l-4 border-rose-600 text-rose-700 text-xs rounded-r-lg font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nombre Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Nombre de la Categoría *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Ej: Particular, Cliente VIP, Empresa..."
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={loading}
              className="w-full"
            />
          </div>

          {/* Estado Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Estado
            </label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              disabled={loading}
              className="w-full"
            >
              <option value="activa">Activa</option>
              <option value="inactiva">Inactiva</option>
            </select>
            <p className="text-[10px] text-slate-400 mt-1">
              Las categorías inactivas no aparecerán al registrar nuevos clientes, pero se mantendrán para los existentes.
            </p>
          </div>

          {/* Color Palette Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Color Visual (Opcional)
            </label>
            
            {/* Color Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5 mb-3">
              {/* Default/None color option */}
              <button
                type="button"
                onClick={() => setColor('')}
                disabled={loading}
                className={`h-8 rounded-lg border flex items-center justify-center text-xs font-bold transition-all ${
                  color === ''
                    ? 'border-brand-blue ring-2 ring-brand-blue/20 bg-slate-50 font-black'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-400'
                }`}
                title="Sin color personalizado"
              >
                🚫
              </button>
              
              {CURATED_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  disabled={loading}
                  className={`h-8 rounded-lg transition-all relative flex items-center justify-center ${c.bgClass} ${
                    color === c.value
                      ? 'ring-4 ring-offset-2 ring-brand-blue scale-105'
                      : 'hover:opacity-90 active:scale-95'
                  }`}
                  title={c.name}
                >
                  {color === c.value && (
                    <span className="text-white text-xs shadow-sm">✓</span>
                  )}
                </button>
              ))}
            </div>

            {/* Hex Custom Input */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Código de color HEX (Ej: #ffaa00)"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  disabled={loading}
                  className="font-mono text-xs pl-8 uppercase"
                  maxLength={7}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                  #
                </span>
              </div>
              <input
                type="color"
                value={color && color.startsWith('#') && color.length === 7 ? color : '#3b82f6'}
                onChange={(e) => setColor(e.target.value)}
                disabled={loading}
                className="w-9 h-9 p-0 border border-slate-200 rounded-lg cursor-pointer shrink-0 overflow-hidden"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Guardando...' : 'Guardar Categoría'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CategoriaForm;
