import React, { useState, useEffect } from 'react';

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

  // Semanal days options
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

    // Logs for debugging
    console.log('Cliente seleccionado:', formData.cliente_id);
    console.log('Datos deuda:', formData);

    // Validation
    if (!formData.cliente_id) {
      setError('Debes seleccionar un cliente.');
      return;
    }

    if (!formData.descripcion.trim()) {
      setError('La descripción de la deuda es obligatoria.');
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
        cliente_id: formData.cliente_id, // Passed as raw value (e.g. UUID string)
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

  // Render conditional inputs for Día de Cobro
  const renderDiaCobroInput = () => {
    if (formData.frecuencia === 'semanal') {
      return (
        <select
          value={formData.dia_cobro}
          onChange={(e) =>
            setFormData({
              ...formData,
              dia_cobro: e.target.value,
            })
          }
          disabled={loading}
        >
          {diasSemana.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      );
    }

    if (formData.frecuencia === 'quincenal') {
      return (
        <input
          type="text"
          value="15 y 30 de cada mes"
          disabled
          className="bg-slate-100 cursor-not-allowed font-medium text-slate-500"
        />
      );
    }

    if (formData.frecuencia === 'mensual') {
      return (
        <select
          value={formData.dia_cobro}
          onChange={(e) =>
            setFormData({
              ...formData,
              dia_cobro: e.target.value,
            })
          }
          disabled={loading}
        >
          {Array.from({ length: 31 }, (_, i) => String(i + 1)).map(num => (
            <option key={num} value={num}>Día {num}</option>
          ))}
        </select>
      );
    }

    return null;
  };

  // Check if we are in Edit Mode to place visual indicators for future locked fields
  const isEditMode = !!initialData;

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
          {isEditMode ? 'Editar Deuda' : 'Registrar Nueva Deuda'}
        </h3>

        {error && (
          <div className="mb-4 p-3.5 bg-rose-50 border-l-4 border-rose-600 text-rose-700 text-xs rounded-r-lg font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cliente Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Cliente * {isEditMode && <span className="text-[10px] text-amber-600 normal-case">(No modificable con pagos registrados)</span>}
            </label>
            <select
              required
              value={formData.cliente_id}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  cliente_id: e.target.value,
                })
              }
              disabled={loading}
            >
              <option value="">Selecciona un cliente...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {c.apellido || ''}
                </option>
              ))}
            </select>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Descripción *
            </label>
            <input
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
          </div>

          {/* Monto Total */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Monto Total *
            </label>
            <input
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
          </div>

          {/* Frecuencia and Día de Cobro Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Frecuencia * {isEditMode && <span className="text-[10px] text-amber-600 normal-case">(Fijo en pagos)</span>}
              </label>
              <select
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
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Día de Cobro *
              </label>
              {renderDiaCobroInput()}
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Observaciones
            </label>
            <textarea
              placeholder="Detalles adicionales, número de cuotas, aclaraciones..."
              value={formData.observaciones}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  observaciones: e.target.value,
                })
              }
              disabled={loading}
              className="w-full px-4 py-2.5 bg-brand-white border border-slate-200 rounded-lg text-brand-gray-dark placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all duration-200 text-sm shadow-sm h-20 resize-none"
            />
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
              {loading ? 'Guardando...' : 'Guardar Deuda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DeudaForm;
