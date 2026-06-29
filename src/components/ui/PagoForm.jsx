import React, { useState } from 'react';
import Input from './Input';
import Select from './Select';
import Button from './Button';
import Alert from './Alert';
import Modal from './Modal';

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

    setLoading(true);
    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err.message || 'Error al registrar el abono.');
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
        form="pago-form"
        disabled={loading || !formData.deuda_id}
        variant="primary"
      >
        {loading ? 'Guardando...' : 'Registrar Pago'}
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Registrar Abono / Pago"
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

      <form id="pago-form" onSubmit={handleSubmit} className="space-y-5 pb-2">
        {/* Deuda Selection */}
        <Select
          id="deuda"
          label="Deuda Activa"
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
          helperText={deudasActivas.length === 0 ? "No hay deudas activas registradas en el sistema para realizar abonos." : ""}
        >
          <option value="">Selecciona la deuda del cliente...</option>
          {deudasActivas.map((deuda) => (
            <option key={deuda.id} value={deuda.id}>
              {deuda.cliente_nombre} - {deuda.descripcion} (Saldo: ${deuda.saldo_pendiente.toLocaleString()})
            </option>
          ))}
        </Select>

        {/* Monto Abonado */}
        <Input
          id="monto"
          label="Monto Abonado"
          type="number"
          required
          step="0.01"
          placeholder="0.00"
          value={formData.monto_abonado}
          onChange={(e) => setFormData({ ...formData, monto_abonado: e.target.value })}
          disabled={loading || !formData.deuda_id}
          helperText={selectedDebt ? `Saldo máximo permitido: $${selectedDebt.saldo_pendiente.toLocaleString()}` : ""}
        />

        {/* Método de Pago */}
        <Select
          id="metodo"
          label="Método de Pago"
          required
          value={formData.metodo_pago}
          onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
          disabled={loading}
        >
          <option value="Efectivo">Efectivo</option>
          <option value="SINPE">SINPE</option>
          <option value="Transferencia">Transferencia</option>
          <option value="Tarjeta">Tarjeta</option>
          <option value="Otro">Otro</option>
        </Select>

        {/* Observaciones */}
        <div className="flex flex-col gap-2 w-full">
          <label htmlFor="observaciones" className="block text-sm font-semibold text-slate-600 tracking-wide">
            Observaciones (Opcional)
          </label>
          <textarea
            id="observaciones"
            placeholder="Ej: Comprobante número 48293, abono quincena..."
            value={formData.observaciones}
            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
            disabled={loading}
            className="w-full px-4 py-3 bg-white border border-linen-dark rounded-xl text-base text-brand-gray-dark placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-moss/20 focus:border-moss transition-all duration-200 shadow-sm h-24 resize-none"
          />
        </div>
      </form>
    </Modal>
  );
}

export default PagoForm;
