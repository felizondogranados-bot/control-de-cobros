import React, { useState, useEffect } from 'react';
import { useCategorias } from '../../contexts/CategoriasContext';
import Input from './Input';
import Select from './Select';
import Button from './Button';
import Alert from './Alert';
import Modal from './Modal';

/**
 * ClienteForm Component
 * 
 * - Renders a form for adding or editing a client.
 * - Enforces mandatory fields (Nombre, Teléfono, Categoría) and prints errors.
 * - Resolves categories dynamically from the global CategoriasContext.
 */
function ClienteForm({ initialData, onSubmit, onClose }) {
  const { categorias } = useCategorias();
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [estadoCliente, setEstadoCliente] = useState('activo');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Pre-populates fields if initialData is provided (Edit Mode)
  useEffect(() => {
    if (initialData) {
      setNombre(initialData.nombre || '');
      setApellido(initialData.apellido || '');
      setTelefono(initialData.telefono || '');
      setCategoriaId(initialData.categoria_id || '');
      setEstadoCliente(initialData.estado_cliente || 'activo');
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
        categoria_id: categoriaId || null,
        estado_cliente: estadoCliente,
      });
    } catch (err) {
      setError(err.message || 'Error al procesar la información del cliente.');
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
        form="cliente-form"
        disabled={loading}
        variant="primary"
      >
        {loading ? 'Guardando...' : 'Guardar Cliente'}
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={initialData ? 'Editar Cliente' : 'Nuevo Cliente'}
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

      <form id="cliente-form" onSubmit={handleSubmit} className="space-y-5 pb-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="nombre"
            label="Nombre"
            type="text"
            required
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            disabled={loading}
          />
          <Input
            id="apellido"
            label="Apellido"
            type="text"
            placeholder="Apellido (Opcional)"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            disabled={loading}
          />
        </div>

        <Input
          id="telefono"
          label="Teléfono"
          type="tel"
          required
          placeholder="Ej: 88887777"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          disabled={loading}
          helperText="Código de 8 dígitos para enviar WhatsApp de cobro"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            id="categoria"
            label="Grupo de Cliente"
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            disabled={loading}
          >
            <option value="">
              {categorias.length === 0 ? 'Sin grupos disponibles' : 'Selecciona un grupo...'}
            </option>
            {categorias
              .filter((cat) => cat.estado === 'activa' || (initialData && initialData.categoria_id === cat.id))
              .map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre} {cat.estado === 'inactiva' ? ' (Inactivo)' : ''}
                </option>
              ))}
          </Select>

          <Select
            id="estadoCliente"
            label="Estado del Cliente"
            value={estadoCliente}
            onChange={(e) => setEstadoCliente(e.target.value)}
            disabled={loading}
          >
            <option value="activo">Activo</option>
            <option value="inactiva">Inactivo</option>
          </Select>
        </div>

        {categorias.length === 0 && (
          <p className="text-sm text-slate-400">
            No hay grupos configurados. Puedes crearlos desde el Inicio.
          </p>
        )}
      </form>
    </Modal>
  );
}

export default ClienteForm;
