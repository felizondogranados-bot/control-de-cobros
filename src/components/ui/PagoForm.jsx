import React, { useState } from 'react';

/**
 * PagoForm Component
 * 
 * - Form modal to register a new payment (abono).
 * - Only shows active debts ('activa').
 * - Restricts input so that the payment amount does NOT exceed the debt's pending balance.
 */
function PagoForm({ deudas, onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    deuda_id: '',
    monto_abonado: '',
    metodo_pago: 'Efectivo',
    observaciones: ''
  });
  
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filter deudas to show only active debts
  const deudasActivas = deudas.filter(deuda => deuda.estado === 'activa');

  // Find currently selected debt to compute constraints dynamically
  const selectedDebt = deudasActivas.find(deuda => deuda.id === formData.deuda_id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.deuda_id) {
      setError('Debes seleccionar una deuda.');
      return;
    }

    const abono = Number(formData.monto_abonado);
    if (isNaN(abono) || abono <= 0) {
      setError('El monto abonado debe ser un número mayor a 0.');
      return;
    }

    if (selectedDebt && abono > Number(selectedDebt.saldo_pendiente)) {
      setError(`El abono ($${abono.toLocaleString()}) no puede superar el saldo pendiente ($${selectedDebt.saldo_pendiente.toLocaleString()}) de la deuda.`);
      return;
    }

    const payload = {
      deuda_id: formData.deuda_id,
      monto_abonado: abono,
      metodo_pago: formData.metodo_pago,
      observaciones: formData.observaciones.trim()
    };

    console.log('Deuda seleccionada:', formData.deuda_id);
    console.log('Payload pago:', payload);

    setLoading(true);
    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err.message || 'Error al registrar el abono.');
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
          Registrar Abono / Pago
        </h3>

        {error && (
          <div className="mb-4 p-3.5 bg-rose-50 border-l-4 border-rose-600 text-rose-700 text-xs rounded-r-lg font-medium animate-shake">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Deuda Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Deuda Activa *
            </label>
            <select
              required
              value={formData.deuda_id}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  deuda_id: e.target.value
                });
                setError(null);
              }}
              disabled={loading}
            >
              <option value="">Selecciona la deuda del cliente...</option>
              {deudasActivas.map((deuda) => (
                <option key={deuda.id} value={deuda.id}>
                  {deuda.cliente_nombre} - {deuda.descripcion} (Saldo: ${deuda.saldo_pendiente.toLocaleString()})
                </option>
              ))}
            </select>
            {deudasActivas.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ No hay deudas activas registradas en el sistema para realizar abonos.
              </p>
            )}
          </div>

          {/* Monto Abonado */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Monto Abonado *
              </label>
              {selectedDebt && (
                <span className="text-[11px] font-semibold text-brand-blue">
                  Saldo pendiente máximo: ${selectedDebt.saldo_pendiente.toLocaleString()}
                </span>
              )}
            </div>
            <input
              type="number"
              required
              step="0.01"
              placeholder="0.00"
              value={formData.monto_abonado}
              onChange={(e) => setFormData({ ...formData, monto_abonado: e.target.value })}
              disabled={loading || !formData.deuda_id}
            />
          </div>

          {/* Método de Pago */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Método de Pago *
            </label>
            <select
              value={formData.metodo_pago}
              onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
              disabled={loading}
            >
              <option value="Efectivo">Efectivo</option>
              <option value="SINPE">SINPE</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Tarjeta">Tarjeta</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Observaciones (Opcional)
            </label>
            <textarea
              placeholder="Ej: Comprobante número 48293, abono quincena..."
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              disabled={loading}
              className="w-full px-4 py-2.5 bg-brand-white border border-slate-200 rounded-lg text-brand-gray-dark placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all duration-200 text-sm shadow-sm h-20 resize-none"
            />
          </div>

          {/* Comprobante and audit logs structure layout notes (preparación de arquitectura) */}
          <div className="hidden">
            {/* Future placeholders for receipt file uploads */}
            <input type="file" disabled />
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
              disabled={loading || !formData.deuda_id}
              className="btn-primary"
            >
              {loading ? 'Guardando...' : 'Registrar Pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PagoForm;
