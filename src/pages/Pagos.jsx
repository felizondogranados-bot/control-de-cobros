import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  getPagos, 
  createPago, 
  deletePago 
} from '../services/pagosService';
import { getDeudas } from '../services/deudasService';
import PagoForm from '../components/ui/PagoForm';

/**
 * Pagos Page
 * 
 * - Lists all payment records (abonos).
 * - Real-time filtering by client, debt description, and payment method.
 * - Displays active vs canceled (anulados) payments.
 * - Handles payment creation (with validation limit) and logical deletion.
 */
function Pagos() {
  const { user } = useAuth();

  // Data states
  const [pagos, setPagos] = useState([]);
  const [deudas, setDeudas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState('activos'); // 'activos' or 'anulados'

  // Modals / Dialogs
  const [showFormModal, setShowFormModal] = useState(false);
  const [deletingPago, setDeletingPago] = useState(null); // logical cancel target

  // Alerts
  const [alert, setAlert] = useState(null); // { type: 'success' | 'error', message: '' }

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    setAlert(null);
    try {
      const fetchedPagos = await getPagos(user.id);
      setPagos(fetchedPagos);

      const fetchedDeudas = await getDeudas(user.id);
      setDeudas(fetchedDeudas);
    } catch (err) {
      console.error('Error loading pagos page data:', err);
      setAlert({
        type: 'error',
        message: err.message || 'Error al conectar con la base de datos de Supabase.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const triggerAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => {
      setAlert(null);
    }, 5000);
  };

  // Register new payment
  const handleFormSubmit = async (formData) => {
    try {
      const newPago = await createPago(formData, user.id);
      
      // Refresh list to pull computed client names, debt descriptions and updated status values
      const refreshedPagos = await getPagos(user.id);
      setPagos(refreshedPagos);

      const refreshedDeudas = await getDeudas(user.id);
      setDeudas(refreshedDeudas);

      setShowFormModal(false);
      triggerAlert('success', `Abono por $${formData.monto_abonado.toLocaleString()} registrado con éxito.`);
    } catch (err) {
      console.error('Error creating payment:', err);
      throw err; // propagates to let the form modal display the error locally
    }
  };

  // Confirm cancel payment (logical deletion)
  const handleConfirmCancel = async () => {
    if (!deletingPago) return;
    try {
      await deletePago(deletingPago.id, deletingPago.deuda_id, user.id);
      
      // Refresh both lists to update balance calculations
      const refreshedPagos = await getPagos(user.id);
      setPagos(refreshedPagos);

      const refreshedDeudas = await getDeudas(user.id);
      setDeudas(refreshedDeudas);

      triggerAlert('success', `El pago por $${deletingPago.monto_abonado.toLocaleString()} fue anulado. La deuda recuperó su saldo.`);
    } catch (err) {
      console.error('Error canceling payment:', err);
      triggerAlert('error', err.message || 'No se pudo anular el pago.');
    } finally {
      setDeletingPago(null);
    }
  };

  // Filter local lists
  const filteredPagos = pagos.filter(pago => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      pago.cliente_nombre.toLowerCase().includes(searchLower) ||
      pago.deuda_descripcion.toLowerCase().includes(searchLower);

    const matchesMethod = selectedMethod === '' || pago.metodo_pago === selectedMethod;

    // Filter status tabs
    const matchesStatus = 
      (selectedStatusTab === 'activos' && pago.estado === 'activo') ||
      (selectedStatusTab === 'anulados' && pago.estado === 'anulado');

    return matchesSearch && matchesMethod && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {alert && (
        <div className={`p-4 rounded-xl border-l-4 font-medium text-sm animate-fade-in ${
          alert.type === 'success' 
            ? 'bg-emerald-50 border-emerald-600 text-emerald-800' 
            : 'bg-rose-50 border-rose-600 text-rose-800'
        }`}>
          {alert.type === 'success' ? '✅' : '⚠️'} {alert.message}
        </div>
      )}

      {/* Filter and Action Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-brand-white border border-slate-200 p-5 rounded-2xl shadow-premium">
        
        {/* Status Tab buttons */}
        <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 self-start">
          {[
            { id: 'activos', label: 'Abonos Activos' },
            { id: 'anulados', label: 'Anulados / Errores' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatusTab(tab.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                selectedStatusTab === tab.id
                  ? 'bg-brand-white text-brand-gray-dark shadow-sm'
                  : 'text-slate-500 hover:text-brand-gray-dark'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-xl w-full">
          {/* Search bar */}
          <input
            type="text"
            placeholder="Buscar por cliente o deuda..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />

          {/* Payment Method filter */}
          <div className="w-full sm:w-48">
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
            >
              <option value="">Cualquier método</option>
              <option value="Efectivo">Efectivo</option>
              <option value="SINPE">SINPE</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Tarjeta">Tarjeta</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
        </div>

        {/* Create action */}
        <button
          onClick={() => setShowFormModal(true)}
          className="btn-primary shrink-0 self-start xl:self-auto"
        >
          💰 Registrar Pago
        </button>
      </div>

      {/* Main List Workspace */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-brand-white border border-slate-200 rounded-2xl shadow-premium min-h-[300px]">
          <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 text-sm mt-4 font-semibold">Cargando abonos de Supabase...</span>
        </div>
      ) : filteredPagos.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-brand-white border border-slate-200 rounded-2xl shadow-premium min-h-[300px] text-center">
          <div className="text-slate-300 text-5xl mb-4 select-none">💳</div>
          <h4 className="font-bold text-lg text-brand-gray-dark">No se encontraron abonos</h4>
          <p className="text-sm text-slate-400 mt-1 max-w-sm">
            {pagos.length === 0 
              ? 'No hay registros de abonos guardados. Registra el primero presionando "Registrar Pago".' 
              : 'Intenta ajustar tus criterios de búsqueda o filtros de método.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden border border-slate-200 rounded-2xl bg-brand-white shadow-premium">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Deuda Asociada</th>
                  <th>Monto Abonado</th>
                  <th>Fecha de Pago</th>
                  <th>Método</th>
                  <th>Observaciones</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPagos.map((pago) => (
                  <tr key={pago.id}>
                    <td className="font-semibold text-brand-gray-dark">
                      {pago.cliente_nombre}
                    </td>
                    <td>
                      <div>
                        <div className="text-brand-gray-dark font-medium">{pago.deuda_descripcion}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          Total deuda: ${pago.deuda_monto_total.toLocaleString()}
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-sm font-bold text-emerald-600">
                      +${pago.monto_abonado.toLocaleString()}
                    </td>
                    <td className="font-mono text-xs font-semibold text-slate-600">
                      {new Date(pago.fecha_pago || pago.created_at).toLocaleDateString('es-CR', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td>
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200">
                        {pago.metodo_pago}
                      </span>
                    </td>
                    <td className="text-xs max-w-xs truncate" title={pago.observaciones}>
                      {pago.observaciones || <span className="text-slate-300">-</span>}
                    </td>
                    <td className="text-right whitespace-nowrap text-sm font-medium">
                      {pago.estado === 'activo' ? (
                        <button
                          onClick={() => setDeletingPago(pago)}
                          className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded transition-all"
                        >
                          Eliminar
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs font-medium italic select-none">
                          Anulado
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showFormModal && (
        <PagoForm
          deudas={deudas}
          onSubmit={handleFormSubmit}
          onClose={() => setShowFormModal(false)}
        />
      )}

      {/* Logical Cancel Confirmation */}
      {deletingPago && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-brand-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-brand-gray-dark mb-2">
              Anular Abono
            </h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              ¿Estás seguro de que deseas anular el abono por <strong className="text-brand-gray-dark">${deletingPago.monto_abonado.toLocaleString()}</strong> de{' '}
              <strong className="text-brand-gray-dark">{deletingPago.cliente_nombre}</strong>?
              <br /><br />
              <span className="text-xs text-rose-600 block font-medium bg-rose-50 border border-rose-100 rounded-lg p-3">
                ⚠️ <strong>Importante:</strong> Esta acción es una baja lógica. El abono se marcará como "anulado" y el saldo pendiente de la deuda se incrementará automáticamente.
              </span>
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingPago(null)}
                className="btn-secondary"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="btn-danger"
              >
                Sí, Anular Abono
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Pagos;
