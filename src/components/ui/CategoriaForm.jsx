import React, { useState, useEffect } from 'react';
import Input from './Input';
import Select from './Select';
import Button from './Button';
import Alert from './Alert';
import Modal from './Modal';

/**
 * CategoriaForm Component
 * 
 * - Modal form to create or edit a category.
 * - Handles validations (Name is required, must not be empty).
 * - Exposes a curated color palette of premium Tailwind-like hex colors.
 * - Exposes a state dropdown (activa/inactiva).
 */
const CURATED_COLORS = [
  { name: 'Moss Green', value: '#929433', bgClass: 'bg-[#929433]' },
  { name: 'Matcha', value: '#D7D799', bgClass: 'bg-[#D7D799]' },
  { name: 'Tea Rose', value: '#EBB4B2', bgClass: 'bg-[#EBB4B2]' },
  { name: 'Azul Suave', value: '#A8C3E5', bgClass: 'bg-[#A8C3E5]' },
  { name: 'Terracota', value: '#D87A68', bgClass: 'bg-[#D87A68]' },
  { name: 'Menta', value: '#A5D6A7', bgClass: 'bg-[#A5D6A7]' },
  { name: 'Lila', value: '#CE93D8', bgClass: 'bg-[#CE93D8]' },
  { name: 'Gris Cálido', value: '#BCAAA4', bgClass: 'bg-[#BCAAA4]' },
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
      setError('El nombre del grupo es obligatorio.');
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
      setError(err.message || 'Error al guardar el grupo.');
    } finally {
      setLoading(false);
    }
  };

  const footerContent = (
    <div className="flex justify-end gap-3">
      <Button
        type="button"
        onClick={onClose}
        disabled={loading}
        variant="secondary"
      >
        Cancelar
      </Button>
      <Button
        type="submit"
        form="categoria-form"
        disabled={loading}
        variant="primary"
      >
        {loading ? 'Guardando...' : 'Guardar Grupo'}
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={initialData ? 'Editar Grupo' : 'Nuevo Grupo'}
      loading={loading}
      footer={footerContent}
    >
      {error && (
        <div className="mb-6">
          <Alert type="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </div>
      )}

      <form id="categoria-form" onSubmit={handleSubmit} className="space-y-5 pb-2">
        {/* Nombre Input */}
        <Input
          id="nombre"
          label="Nombre del Grupo"
          type="text"
          required
          autoFocus
          placeholder="Ej: Particular, Cliente VIP, Empresa..."
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          disabled={loading}
        />

        {/* Estado Selector */}
        <Select
          id="estado"
          label="Estado del Grupo"
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          disabled={loading}
          helperText="Los grupos inactivos no aparecerán al registrar nuevos clientes."
        >
          <option value="activa">Activo</option>
          <option value="inactiva">Inactivo</option>
        </Select>

        {/* Color Palette Selector */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-600 tracking-wide">
            Color Identificador (Opcional)
          </label>
          
          {/* Color Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-9 gap-2.5 mb-3">
            <button
              type="button"
              onClick={() => setColor('')}
              disabled={loading}
              className={`h-9 rounded-xl border flex items-center justify-center text-sm font-bold transition-all cursor-pointer ${
                color === ''
                  ? 'border-moss ring-2 ring-moss/20 bg-linen-light'
                  : 'border-linen-dark hover:bg-linen-light text-slate-400'
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
                className={`h-9 rounded-xl transition-all relative flex items-center justify-center cursor-pointer ${c.bgClass} ${
                  color === c.value
                    ? 'ring-4 ring-offset-2 ring-moss scale-105'
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
                className="w-full px-4 py-3 bg-white border border-linen-dark rounded-xl text-base text-brand-gray-dark placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-moss/20 focus:border-moss transition-all duration-200 shadow-sm font-mono uppercase pl-8"
                maxLength={7}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-slate-400">
                #
              </span>
            </div>
            <input
              type="color"
              value={color && color.startsWith('#') && color.length === 7 ? color : '#929433'}
              onChange={(e) => setColor(e.target.value)}
              disabled={loading}
              className="w-10 h-10 p-0 border border-linen-dark rounded-xl cursor-pointer shrink-0 overflow-hidden"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default CategoriaForm;
