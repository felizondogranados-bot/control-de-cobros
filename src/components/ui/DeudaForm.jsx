import React, { useState, useEffect } from 'react';
import Input from './Input';
import Select from './Select';
import Button from './Button';
import Alert from './Alert';
import Modal from './Modal';

/**
 * DeudaForm Component
 * 
 * - Form for adding or editing a debt record.
 * - Handles conditional selection of "Día de Cobro" based on "Frecuencia".
 * - Mandatory fields: Cliente, Descripción, Monto Total, Frecuencia, Día de Cobro.
 */
function DeudaForm({ initialData, clientes, onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    cliente_id: '',
    descripcion: '',
    monto_total: '',
    frecuencia: 'semanal',
    dia_cobro: '',
    observaciones: '',
  });
  
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const diasSemana = [
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
    'Domingo'
  ];

  // Populate data when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        cliente_id: initialData.cliente_id || '',
        descripcion: initialData.descripcion || '',
        monto_total: initialData.monto_total || '',
        frecuencia: initialData.frecuencia || 'semanal',
        dia_cobro: initialData.dia_cobro || '',
        observaciones: initialData.observaciones || '',
      });
    } else {
      setFormData(prev => ({
        ...prev,
        dia_cobro: 'Lunes'
      }));
    }
  }, [initialData]);

  // Adjust Día de Cobro automatically when Frecuencia changes
  useEffect(() => {
    if (initialData && initialData.frecuencia === formData.frecuencia) {
      setFormData(prev => ({
        ...prev,
        dia_cobro: initialData.dia_cobro
      }));
      return;
    }

    let defaultDia = 'Lunes';
    if (formData.frecuencia === 'quincenal') {
      defaultDia = '15 y 30';
    } else if (formData.frecuencia === 'semanal') {
      defaultDia = 'Lunes';
    } else if (formData.frecuencia === 'mensual') {
      defaultDia = '1';
    }

    setFormData(prev => ({
      ...prev,
      dia_cobro: defaultDia
    }));
  }, [formData.frecuencia, initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.cliente_id) {
      setError('Debes seleccionar un cliente.');
      return;
    }

    if (!formData.descripcion.trim()) {
      setError('La descripción de la deudor es obligatoria.');
      return;
    }

    const numericMonto = Number(formData.monto_total);
    if (isNaN(numericMonto) || numericMonto <= 0) {
      setError('El monto total debe ser un número válido mayor a 0.');
      return;
    }

    if (!formData.frecuencia) {
      setError('Debes seleccionar una frecuencia de cobro.');
      return;
    }

    if (!formData.dia_cobro) {
      setError('El día de cobro es obligatorio.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        cliente_id: formData.cliente_id,
        descripcion: formData.descripcion.trim(),
        monto_total: numericMonto,
        frecuencia: formData.frecuencia,
        dia_cobro: formData.dia_cobro,
        observaciones: formData.observaciones.trim()
      });
    } catch (err) {
      setError(err.message || 'Error al procesar el registro de deuda.');
    } finally {
      setLoading(false);
    }
  };

  const isEditMode = !!initialData;

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
        form="deuda-form"
        disabled={loading}
        variant="primary"
      >
        {loading ? 'Guardando...' : 'Guardar Deuda'}
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEditMode ? 'Editar Deuda' : 'Registrar Nueva Deuda'}
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

      <form id="deuda-form" onSubmit={handleSubmit} className="space-y-5 pb-2">
        {/* Cliente Selection */}
        <Select
          id="cliente"
          label={isEditMode ? "Cliente" : "Selecciona el Cliente"}
          required
          value={formData.cliente_id}
          onChange={(e) =>
            setFormData({
              ...formData,
              cliente_id: e.target.value,
            })
          }
          disabled={loading}
          helperText={isEditMode ? "Fijo si existen abonos registrados" : ""}
        >
          <option value="">Selecciona un cliente...</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre} {c.apellido || ''}
            </option>
          ))}
        </Select>

        {/* Descripción */}
        <Input
          id="descripcion"
          label="Detalle o Descripción"
          type="text"
          required
          placeholder="Ej: Cobro de mercadería de Shein"
          value={formData.descripcion}
          onChange={(e) =>
            setFormData({
              ...formData,
              descripcion: e.target.value,
            })
          }
          disabled={loading}
        />

        {/* Monto Total */}
        <Input
          id="monto"
          label="Monto Total a Cobrar"
          type="number"
          required
          step="0.01"
          placeholder="0.00"
          value={formData.monto_total}
          onChange={(e) =>
            setFormData({
              ...formData,
              monto_total: e.target.value,
            })
          }
          disabled={loading}
        />

        {/* Frecuencia and Día de Cobro Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            id="frecuencia"
            label="Frecuencia"
            required
            value={formData.frecuencia}
            onChange={(e) =>
              setFormData({
                ...formData,
                frecuencia: e.target.value,
              })
            }
            disabled={loading}
          >
            <option value="semanal">Semanal</option>
            <option value="quincenal">Quincenal</option>
            <option value="mensual">Mensual</option>
          </Select>
          
          <div className="flex flex-col gap-2 w-full">
            <label className="block text-sm font-semibold text-slate-600 tracking-wide">
              Día de Cobro <span className="text-rose-dark">*</span>
            </label>
            {formData.frecuencia === 'semanal' && (
              <select
                value={formData.dia_cobro}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dia_cobro: e.target.value,
                  })
                }
                disabled={loading}
                className="w-full px-4 py-3 bg-white border border-linen-dark rounded-xl text-base text-brand-gray-dark focus:outline-none focus:ring-2 focus:ring-moss/20 focus:border-moss transition-all duration-200 shadow-sm appearance-none pr-10 cursor-pointer"
              >
                {diasSemana.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            )}

            {formData.frecuencia === 'quincenal' && (
              <input
                type="text"
                value="15 y 30 de cada mes"
                disabled
                className="w-full px-4 py-3 bg-linen-light border border-linen-dark rounded-xl text-base text-slate-500 cursor-not-allowed font-medium shadow-sm"
              />
            )}

            {formData.frecuencia === 'mensual' && (
              <select
                value={formData.dia_cobro}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dia_cobro: e.target.value,
                  })
                }
                disabled={loading}
                className="w-full px-4 py-3 bg-white border border-linen-dark rounded-xl text-base text-brand-gray-dark focus:outline-none focus:ring-2 focus:ring-moss/20 focus:border-moss transition-all duration-200 shadow-sm appearance-none pr-10 cursor-pointer"
              >
                {Array.from({ length: 31 }, (_, i) => String(i + 1)).map(num => (
                  <option key={num} value={num}>Día {num}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Observaciones */}
        <div className="flex flex-col gap-2 w-full">
          <label htmlFor="observaciones" className="block text-sm font-semibold text-slate-600 tracking-wide">
            Observaciones (Opcional)
          </label>
          <textarea
            id="observaciones"
            placeholder="Detalles adicionales, notas sobre el cobro..."
            value={formData.observaciones}
            onChange={(e) =>
              setFormData({
                ...formData,
                observaciones: e.target.value,
              })
            }
            disabled={loading}
            className="w-full px-4 py-3 bg-white border border-linen-dark rounded-xl text-base text-brand-gray-dark placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-moss/20 focus:border-moss transition-all duration-200 shadow-sm h-24 resize-none"
          />
        </div>
      </form>
    </Modal>
  );
}

export default DeudaForm;
