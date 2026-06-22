import React, { useState, useEffect } from 'react';

/**
 * ClienteForm Component
 * 
 * - Renders a form for adding or editing a client.
 * - Enforces mandatory fields (Nombre, Teléfono, Categoría) and prints errors.
 * - Receives available categories from Supabase as a list.
 */
function ClienteForm({ initialData, categorias, onSubmit, onClose }) {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Pre-populates fields if initialData is provided (Edit Mode)
  useEffect(() => {
    if (initialData) {
      setNombre(initialData.nombre || '');
      setApellido(initialData.apellido || '');
      setTelefono(initialData.telefono || '');
      setCategoriaId(initialData.categoria_id || '');
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    const cleanNombre = nombre.trim();
    const cleanTelefono = telefono.trim();

    if (!cleanNombre) {
      setError('El nombre del cliente es obligatorio.');
      return;
    }

    if (!cleanTelefono) {
      setError('El número de teléfono es obligatorio.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        nombre: cleanNombre,
        apellido: apellido.trim(),
        telefono: cleanTelefono,
        categoria_id: categoriaId ? Number(categoriaId) : null,
      });
    } catch (err) {
      setError(err.message || 'Error al procesar la información del cliente.');
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
          {initialData ? 'Editar Cliente' : 'Nuevo Cliente'}
        </h3>

        {error && (
          <div className="mb-4 p-3.5 bg-rose-50 border-l-4 border-rose-600 text-rose-700 text-xs rounded-r-lg font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Nombre *
              </label>
              <input
                type="text"
                required
                placeholder="Nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Apellido
              </label>
              <input
                type="text"
                placeholder="Apellido (Opcional)"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Teléfono *
            </label>
            <input
              type="tel"
              required
              placeholder="Ej: 88887777"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Categoría
            </label>
            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              disabled={loading}
            >
              <option value="">
                {categorias.length === 0 ? 'Sin categorías disponibles' : 'Selecciona una categoría (Opcional)...'}
              </option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
            {categorias.length === 0 && (
              <p className="text-xs text-slate-400 mt-1">
                No hay categorías configuradas en Supabase.
              </p>
            )}
          </div>

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
              {loading ? 'Guardando...' : 'Guardar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ClienteForm;
