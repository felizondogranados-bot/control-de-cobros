import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  getPagos, 
  createPago, 
  deletePago 
} from '../services/pagosService';
import { getDeudas } from '../services/deudasService';
import PagoForm from '../components/ui/PagoForm';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import Alert from '../components/ui/Alert';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';
import Modal from '../components/ui/Modal';
import { Search, Plus, Trash2, CreditCard } from 'lucide-react';

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
      
      const refreshedPagos = await getPagos(user.id);
      setPagos(refreshedPagos);

      const refreshedDeudas = await getDeudas(user.id);
      setDeudas(refreshedDeudas);

      setShowFormModal(false);
      triggerAlert('success', `Abono por $${formData.monto_abonado.toLocaleString()} registrado con éxito.`);
    } catch (err) {
      console.error('Error creating payment:', err);
      throw err;
    }
  };

  // Confirm cancel payment (logical deletion)
  const handleConfirmCancel = async () => {
    if (!deletingPago) return;
    try {
      await deletePago(deletingPago.id, deletingPago.deuda_id, user.id);
      
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

    const matchesStatus = 
      (selectedStatusTab === 'activos' && pago.estado === 'activo') ||
      (selectedStatusTab === 'anulados' && pago.estado === 'anulado');

    return matchesSearch && matchesMethod && matchesStatus;
  });

  return (
    <div className="space-y-8 fade-in-up">
      {/* Alert Banner */}
      {alert && (
        <Alert type={alert.type} onClose={() => setAlert(null)}>
          {alert.message}
        </Alert>
      )}

      {/* Filter and Action Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 bg-white border border-linen p-6 rounded-3xl shadow-soft">
        
        {/* Status Tab buttons */}
        <div className="flex bg-linen-light p-1 rounded-2xl shrink-0 self-start border border-linen/50">
          {[
            { id: 'activos', label: 'Abonos Activos' },
            { id: 'anulados', label: 'Anulados / Errores' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatusTab(tab.id)}
              className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                selectedStatusTab === tab.id
                  ? 'bg-white text-moss-dark shadow-sm'
                  : 'text-slate-500 hover:text-brand-gray-dark'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 flex-1 max-w-xl w-full">
          <Input
            id="search"
            label="Buscar por Cliente o Deuda"
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* Payment Method filter */}
          <div className="w-full sm:w-56">
            <Select
              id="method"
              label="Método de Pago"
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
            >
              <option value="">Cualquier método</option>
              <option value="Efectivo">Efectivo</option>
              <option value="SINPE">SINPE</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Tarjeta">Tarjeta</option>
              <option value="Otro">Otro</option>
            </Select>
          </div>
        </div>

        {/* Create action */}
        <Button
          onClick={() => setShowFormModal(true)}
          variant="primary"
          className="shrink-0 w-full xl:w-auto"
        >
          <Plus className="w-5 h-5" />
          <span>Registrar Pago</span>
        </Button>
      </div>

      {/* Main List Workspace */}
      {loading ? (
        <Card className="flex flex-col items-center justify-center min-h-[300px]">
          <LoadingState message="Cargando pagos..." />
        </Card>
      ) : filteredPagos.length === 0 ? (
        <EmptyState
          title="No se encontraron abonos"
          description={
            pagos.length === 0 
              ? 'No hay registros de abonos guardados. Registra el primero presionando "Registrar Pago".' 
              : 'Intenta ajustar tus criterios de búsqueda o filtros de método.'
          }
          icon={<CreditCard className="w-8 h-8 text-moss" />}
          actionText={pagos.length === 0 ? "Registrar Pago" : null}
          onAction={pagos.length === 0 ? () => setShowFormModal(true) : null}
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Deuda Asociada</th>
                  <th className="px-6 py-4">Monto Abonado</th>
                  <th className="px-6 py-4">Fecha de Pago</th>
                  <th className="px-6 py-4">Método</th>
                  <th className="px-6 py-4">Observaciones</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPagos.map((pago) => (
                  <tr key={pago.id} className="hover:bg-linen-light/30 transition-colors">
                    <td className="px-6 py-5 font-semibold text-brand-gray-dark text-base">
                      {pago.cliente_nombre}
                    </td>
                    <td className="px-6 py-5 text-base">
                      <div>
                        <div className="text-brand-gray-dark font-semibold">{pago.deuda_descripcion}</div>
                        <div className="text-sm text-slate-400 font-mono mt-0.5">
                          Total deuda: ${pago.deuda_monto_total.toLocaleString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-mono text-base font-bold text-moss-dark">
                      +${pago.monto_abonado.toLocaleString()}
                    </td>
                    <td className="px-6 py-5 font-mono text-sm text-slate-600 font-semibold">
                      {new Date(pago.fecha_pago || pago.created_at).toLocaleDateString('es-CR', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-5">
                      <Badge variant="info">
                        {pago.metodo_pago}
                      </Badge>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600 max-w-xs truncate" title={pago.observaciones}>
                      {pago.observaciones || <span className="text-slate-300">-</span>}
                    </td>
                    <td className="px-6 py-5 text-right whitespace-nowrap">
                      {pago.estado === 'activo' ? (
                        <button
                          onClick={() => setDeletingPago(pago)}
                          className="p-2 text-rose-dark hover:bg-rose-light rounded-xl transition-all cursor-pointer min-w-[38px] min-h-[38px] inline-flex items-center justify-center border border-transparent hover:border-rose/30"
                          title="Anular pago"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <Badge variant="danger">
                          Anulado
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
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
      <Modal
        isOpen={!!deletingPago}
        onClose={() => setDeletingPago(null)}
        title="Anular Abono"
      >
        <p className="text-base text-slate-500 mb-6 leading-relaxed">
          ¿Estás seguro de que deseas anular el abono por <strong className="text-brand-gray-dark">${deletingPago?.monto_abonado.toLocaleString()}</strong> de{' '}
          <strong className="text-brand-gray-dark">{deletingPago?.cliente_nombre}</strong>?
          <br /><br />
          <span className="text-sm text-rose-dark block font-semibold bg-rose-light border border-rose/30 rounded-2xl p-4">
            ⚠️ Importante: El abono se marcará como "anulado" y el saldo pendiente de la deuda se incrementará automáticamente.
          </span>
        </p>
        <div className="flex justify-end gap-3 pt-6 border-t border-linen/50">
          <Button
            type="button"
            onClick={() => setDeletingPago(null)}
            variant="secondary"
          >
            Cerrar
          </Button>
          <Button
            type="button"
            onClick={handleConfirmCancel}
            variant="danger"
          >
            Sí, Anular Abono
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default Pagos;
