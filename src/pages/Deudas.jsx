import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  getDeudas, 
  createDeuda, 
  updateDeuda, 
  deleteDeuda,
  updateDeudaEstado
} from '../services/deudasService';
import { getClientes } from '../services/clientesService';
import { getPagosByDeuda } from '../services/pagosService';
import { sendDebtReminder } from '../services/whatsapp';
import DeudaForm from '../components/ui/DeudaForm';
import { getDebtStatus } from '../utils/debtStatusHelpers';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Alert from '../components/ui/Alert';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';
import Modal from '../components/ui/Modal';
import { 
  Search, 
  Plus, 
  MessageSquare, 
  FileText, 
  Settings, 
  Edit2, 
  Trash2, 
  DollarSign,
  Calendar,
  History
} from 'lucide-react';

/**
 * Deudas Page
 * 
 * - Full CRUD operations (with logical deletion to 'cancelada').
 * - Real-time filtering by client, description, and status tabs.
 * - Integrates with WhatsApp notification service.
 */
function Deudas() {
  const { user } = useAuth();

  // Data states
  const [deudas, setDeudas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('activas'); // default tab

  // Modals / Dialogs
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingDeuda, setEditingDeuda] = useState(null);
  const [cancelingDeuda, setCancelingDeuda] = useState(null); // logical deletion target

  // History states
  const [viewingHistoryDeuda, setViewingHistoryDeuda] = useState(null);
  const [historyPayments, setHistoryPayments] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Alerts
  const [alert, setAlert] = useState(null); // { type: 'success' | 'error', message: '' }

  // Status transitions states
  const [updatingEstadoDeuda, setUpdatingEstadoDeuda] = useState(null);
  const [statusError, setStatusError] = useState(null);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    setAlert(null);
    try {
      const fetchedDeudas = await getDeudas(user.id);
      setDeudas(fetchedDeudas);

      const fetchedClientes = await getClientes(user.id);
      setClientes(fetchedClientes);
    } catch (err) {
      console.error('Error loading deudas page data:', err);
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

  // Create or Update submit handler
  const handleFormSubmit = async (formData) => {
    try {
      if (editingDeuda) {
        // Edit mode
        const updated = await updateDeuda(editingDeuda.id, formData, user.id);
        
        const clientObj = clientes.find(c => c.id === formData.cliente_id);
        const mappedUpdated = {
          ...updated,
          cliente_nombre: clientObj ? `${clientObj.nombre} ${clientObj.apellido || ''}`.trim() : 'Cliente no encontrado',
          cliente_telefono: clientObj?.telefono || ''
        };

        setDeudas(prev => prev.map(d => d.id === editingDeuda.id ? mappedUpdated : d));
        triggerAlert('success', `Deuda "${formData.descripcion}" actualizada.`);
      } else {
        // Create mode
        const newDebt = await createDeuda(formData, user.id);
        
        const clientObj = clientes.find(c => c.id === formData.cliente_id);
        const mappedNew = {
          ...newDebt,
          cliente_nombre: clientObj ? `${clientObj.nombre} ${clientObj.apellido || ''}`.trim() : 'Cliente no encontrado',
          cliente_telefono: clientObj?.telefono || ''
        };

        setDeudas(prev => [mappedNew, ...prev]);
        triggerAlert('success', `Deuda "${formData.descripcion}" creada.`);
      }
      setShowFormModal(false);
      setEditingDeuda(null);
    } catch (err) {
      console.error('Error saving debt:', err);
      throw err;
    }
  };

  // logical delete handler
  const handleConfirmCancel = async () => {
    if (!cancelingDeuda) return;
    try {
      await deleteDeuda(cancelingDeuda.id, user.id);
      
      setDeudas(prev => prev.map(d => 
        d.id === cancelingDeuda.id ? { ...d, estado: 'cancelada' } : d
      ));
      triggerAlert('success', `La deuda "${cancelingDeuda.descripcion}" fue marcada como cancelada.`);
    } catch (err) {
      console.error('Error canceling debt:', err);
      triggerAlert('error', err.message || 'No se pudo cancelar la deuda.');
    } finally {
      setCancelingDeuda(null);
    }
  };

  // WhatsApp Reminder handler
  const handleSendReminder = (deuda) => {
    if (!deuda.cliente_telefono) {
      triggerAlert('error', 'El cliente no tiene un teléfono registrado.');
      return;
    }
    const client = {
      name: deuda.cliente_nombre,
      phone: deuda.cliente_telefono
    };
    const debtObj = {
      amount: deuda.saldo_pendiente,
      dueDate: deuda.proxima_fecha_pago
    };
    sendDebtReminder(client, debtObj);
  };

  // Payment history loader
  const handleViewHistory = async (deuda) => {
    setViewingHistoryDeuda(deuda);
    setLoadingHistory(true);
    try {
      const payments = await getPagosByDeuda(deuda.id, user.id);
      setHistoryPayments(payments);
    } catch (err) {
      console.error('Error loading history payments:', err);
      triggerAlert('error', 'No se pudo cargar el historial de pagos.');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Status transition handler
  const handleTransitionEstado = async (nuevoEstado) => {
    setStatusError(null);
    const pending = Number(updatingEstadoDeuda.saldo_pendiente);

    if (nuevoEstado === 'activa') {
      if (pending === 0) {
        setStatusError('La deuda no puede reactivarse porque no tiene saldo pendiente.');
        return;
      }
    }

    if (nuevoEstado === 'pagada') {
      if (pending > 0) {
        setStatusError('La deuda no puede marcarse como pagada porque aún tiene saldo pendiente.');
        return;
      }
    }

    if (nuevoEstado === 'cancelada') {
      const confirmText = `¿Desea cancelar esta deuda?\n\nLa deuda permanecerá registrada para efectos históricos, pero dejará de considerarse en los cálculos financieros.`;
      if (!window.confirm(confirmText)) {
        return;
      }
    }

    try {
      await updateDeudaEstado(updatingEstadoDeuda.id, nuevoEstado, user.id);
      
      setDeudas(prev => prev.map(d => 
        d.id === updatingEstadoDeuda.id ? { ...d, estado: nuevoEstado } : d
      ));

      triggerAlert('success', `El estado de la deuda se actualizó a "${nuevoEstado}".`);
      setUpdatingEstadoDeuda(null);
    } catch (err) {
      console.error('Error transitioning debt state:', err);
      setStatusError(err.message || 'Error al cambiar el estado.');
    }
  };

  // Filter deudas locally
  const filteredDeudas = deudas.filter(deuda => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      deuda.cliente_nombre.toLowerCase().includes(searchLower) ||
      deuda.descripcion.toLowerCase().includes(searchLower);

    const statusVirtual = getDebtStatus(deuda);

    let matchesStatus = false;
    if (selectedStatus === 'activas') {
      matchesStatus = statusVirtual === 'activa';
    } else if (selectedStatus === 'pagadas') {
      matchesStatus = statusVirtual === 'pagada';
    } else if (selectedStatus === 'canceladas') {
      matchesStatus = statusVirtual === 'cancelada';
    } else if (selectedStatus === 'vencidas') {
      matchesStatus = statusVirtual === 'vencida';
    } else {
      matchesStatus = true; // Todas
    }

    return matchesSearch && matchesStatus;
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
            { id: 'activas', label: 'Activas' },
            { id: 'pagadas', label: 'Pagadas' },
            { id: 'vencidas', label: 'Vencidas' },
            { id: 'canceladas', label: 'Canceladas' },
            { id: 'todas', label: 'Todas' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                selectedStatus === tab.id
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
            label="Buscar por Cliente o Detalle"
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Create action */}
        <Button
          onClick={() => {
            setEditingDeuda(null);
            setShowFormModal(true);
          }}
          variant="primary"
          className="shrink-0 w-full xl:w-auto"
        >
          <Plus className="w-5 h-5" />
          <span>Nueva Deuda</span>
        </Button>
      </div>

      {/* Main List Workspace */}
      {loading ? (
        <Card className="flex flex-col items-center justify-center min-h-[300px]">
          <LoadingState message="Cargando deudas..." />
        </Card>
      ) : filteredDeudas.length === 0 ? (
        <EmptyState
          title="No se encontraron deudas"
          description={
            deudas.length === 0 
              ? 'No hay registros de deudas. Agrega una nueva presionando "Nueva Deuda".' 
              : 'Prueba a cambiar de pestaña o ajustar los términos de búsqueda.'
          }
          icon={<DollarSign className="w-8 h-8 text-moss" />}
          actionText={deudas.length === 0 ? "Nueva Deuda" : null}
          onAction={deudas.length === 0 ? () => {
            setEditingDeuda(null);
            setShowFormModal(true);
          } : null}
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Detalle</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Pendiente</th>
                  <th className="px-6 py-4">Frecuencia</th>
                  <th className="px-6 py-4">Día de Cobro</th>
                  <th className="px-6 py-4">Próximo Pago</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeudas.map((deuda) => {
                  const status = getDebtStatus(deuda);
                  return (
                    <tr key={deuda.id} className="hover:bg-linen-light/30 transition-colors">
                      <td className="px-6 py-5 font-semibold text-brand-gray-dark text-base">
                        {deuda.cliente_nombre}
                      </td>
                      <td className="px-6 py-5">
                        <div>
                          <div className="text-brand-gray-dark font-semibold text-base">{deuda.descripcion}</div>
                          {deuda.observaciones && (
                            <div className="text-sm text-slate-400 italic mt-0.5 max-w-xs truncate" title={deuda.observaciones}>
                              {deuda.observaciones}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 font-mono text-base font-semibold text-slate-600">
                        ${deuda.monto_total.toLocaleString()}
                      </td>
                      <td className="px-6 py-5 font-mono text-base text-moss-dark font-bold">
                        ${deuda.saldo_pendiente.toLocaleString()}
                      </td>
                      <td className="px-6 py-5">
                        <span className="capitalize text-sm font-semibold text-slate-500">
                          {deuda.frecuencia}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-600">
                        {deuda.dia_cobro}
                      </td>
                      <td className="px-6 py-5 font-mono text-sm font-semibold text-slate-600">
                        {deuda.proxima_fecha_pago || <span className="text-slate-300">-</span>}
                      </td>
                      <td className="px-6 py-5">
                        <Badge variant={
                          status === 'activa' ? 'info' :
                          status === 'pagada' ? 'success' :
                          status === 'vencida' ? 'danger' : 'info'
                        }>
                          {status === 'activa' ? 'Al día' :
                           status === 'pagada' ? 'Pagada' :
                           status === 'vencida' ? 'Vencida' : 'Cancelada'}
                        </Badge>
                      </td>
                      <td className="px-6 py-5 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-1.5">
                          {/* WhatsApp reminder shortcut */}
                          {(status === 'activa' || status === 'vencida') && (
                            <button
                              onClick={() => handleSendReminder(deuda)}
                              className="p-2 text-emerald-800 bg-matcha-light hover:bg-matcha rounded-xl transition-all cursor-pointer min-w-[38px] min-h-[38px] inline-flex items-center justify-center border border-matcha/40"
                              title="Enviar recordatorio por WhatsApp"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleViewHistory(deuda)}
                            className="p-2 text-slate-600 hover:bg-linen-light rounded-xl transition-all cursor-pointer min-w-[38px] min-h-[38px] inline-flex items-center justify-center border border-transparent hover:border-linen-dark/20"
                            title="Ver abonos"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setUpdatingEstadoDeuda(deuda)}
                            className="p-2 text-amber-800 hover:bg-amber-50 rounded-xl transition-all cursor-pointer min-w-[38px] min-h-[38px] inline-flex items-center justify-center border border-transparent hover:border-amber-200"
                            title="Cambiar estado"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingDeuda(deuda);
                              setShowFormModal(true);
                            }}
                            className="p-2 text-moss-dark hover:bg-moss/10 rounded-xl transition-all cursor-pointer min-w-[38px] min-h-[38px] inline-flex items-center justify-center border border-transparent hover:border-moss/20"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {(status === 'activa' || status === 'vencida') && (
                            <button
                              onClick={() => setCancelingDeuda(deuda)}
                              className="p-2 text-rose-dark hover:bg-rose-light rounded-xl transition-all cursor-pointer min-w-[38px] min-h-[38px] inline-flex items-center justify-center border border-transparent hover:border-rose/30"
                              title="Cancelar deuda"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add/Edit Modal */}
      {showFormModal && (
        <DeudaForm
          initialData={editingDeuda}
          clientes={clientes}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowFormModal(false);
            setEditingDeuda(null);
          }}
        />
      )}

      {/* Logical Delete Confirmation */}
      <Modal
        isOpen={!!cancelingDeuda}
        onClose={() => setCancelingDeuda(null)}
        title="Cancelar Deuda"
      >
        <p className="text-base text-slate-500 mb-6">
          ¿Estás seguro de que deseas cancelar la deuda por <strong className="text-brand-gray-dark">${cancelingDeuda?.monto_total.toLocaleString()}</strong> de{' '}
          <strong className="text-brand-gray-dark">{cancelingDeuda?.cliente_nombre}</strong>?
          <br />
          <span className="text-sm text-rose-dark mt-3 block font-semibold">
            Esta deuda se marcará como "cancelada" y dejará de sumarse en los totales financieros de tu panel.
          </span>
        </p>
        <div className="flex justify-end gap-3 pt-6 border-t border-linen/50">
          <Button
            type="button"
            onClick={() => setCancelingDeuda(null)}
            variant="secondary"
          >
            Cerrar
          </Button>
          <Button
            type="button"
            onClick={handleConfirmCancel}
            variant="danger"
          >
            Sí, Cancelar Deuda
          </Button>
        </div>
      </Modal>

      {/* History Payments Modal */}
      <Modal
        isOpen={!!viewingHistoryDeuda}
        onClose={() => {
          setViewingHistoryDeuda(null);
          setHistoryPayments([]);
        }}
        title="Historial de Abonos"
      >
        <p className="text-sm text-slate-500 mb-6 leading-relaxed bg-linen-light p-4 rounded-2xl border border-linen">
          Cliente: <strong className="text-brand-gray-dark">{viewingHistoryDeuda?.cliente_nombre}</strong><br />
          Deuda: <strong className="text-brand-gray-dark">{viewingHistoryDeuda?.descripcion}</strong> (Total: ${viewingHistoryDeuda?.monto_total.toLocaleString()})
        </p>

        {loadingHistory ? (
          <LoadingState message="Cargando abonos registrados..." />
        ) : historyPayments.length === 0 ? (
          <div className="py-12 text-center text-base text-slate-400 italic">
            No hay abonos activos registrados para esta deuda.
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
            {historyPayments.map((pago) => (
              <div key={pago.id} className="flex justify-between items-center p-4 bg-white border border-linen rounded-2xl shadow-sm">
                <div>
                  <div className="text-xs text-slate-400 font-mono">
                    {new Date(pago.fecha_pago || pago.created_at).toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </div>
                  <div className="text-sm font-semibold text-slate-700 mt-1">
                    Método: <span className="capitalize">{pago.metodo_pago}</span>
                  </div>
                  {pago.observaciones && (
                    <div className="text-xs text-slate-400 italic mt-1 max-w-[220px] truncate" title={pago.observaciones}>
                      Obs: {pago.observaciones}
                    </div>
                  )}
                </div>
                <div className="font-mono text-base font-bold text-moss-dark">
                  +${pago.monto_abonado.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex justify-end pt-6 mt-6 border-t border-linen/50">
          <Button
            type="button"
            onClick={() => {
              setViewingHistoryDeuda(null);
              setHistoryPayments([]);
            }}
            variant="secondary"
          >
            Cerrar
          </Button>
        </div>
      </Modal>

      {/* Change Status Modal */}
      <Modal
        isOpen={!!updatingEstadoDeuda}
        onClose={() => {
          setUpdatingEstadoDeuda(null);
          setStatusError(null);
        }}
        title="Estado Administrativo"
      >
        <p className="text-sm text-slate-500 mb-6 leading-relaxed bg-linen-light p-4 rounded-2xl border border-linen">
          Cliente: <strong className="text-brand-gray-dark">{updatingEstadoDeuda?.cliente_nombre}</strong><br />
          Deuda: <strong className="text-brand-gray-dark">{updatingEstadoDeuda?.descripcion}</strong>
        </p>

        {updatingEstadoDeuda && (
          <div className="bg-white border border-linen rounded-2xl p-4 mb-6 space-y-2 text-sm shadow-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">Estado actual:</span>
              <span className="font-bold uppercase text-moss-dark">
                {getDebtStatus(updatingEstadoDeuda)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">Saldo pendiente:</span>
              <span className="font-mono font-bold text-moss-dark">
                ${updatingEstadoDeuda.saldo_pendiente.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">Monto total:</span>
              <span className="font-mono font-semibold text-slate-600">
                ${updatingEstadoDeuda.monto_total.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {statusError && (
          <div className="mb-6">
            <Alert type="error" onClose={() => setStatusError(null)}>
              {statusError}
            </Alert>
          </div>
        )}

        {updatingEstadoDeuda && (
          <div className="space-y-3 pt-2">
            {(getDebtStatus(updatingEstadoDeuda) === 'activa' || getDebtStatus(updatingEstadoDeuda) === 'vencida') && (
              <>
                <Button
                  onClick={() => handleTransitionEstado('pagada')}
                  variant="success"
                  className="w-full"
                >
                  Marcar como Pagada
                </Button>
                <Button
                  onClick={() => handleTransitionEstado('cancelada')}
                  variant="danger"
                  className="w-full"
                >
                  Cancelar Deuda
                </Button>
              </>
            )}

            {getDebtStatus(updatingEstadoDeuda) === 'pagada' && (
              <>
                <Button
                  onClick={() => handleTransitionEstado('activa')}
                  variant="primary"
                  className="w-full"
                >
                  Reactivar Deuda
                </Button>
                <Button
                  onClick={() => handleTransitionEstado('cancelada')}
                  variant="danger"
                  className="w-full"
                >
                  Cancelar Deuda
                </Button>
              </>
            )}

            {getDebtStatus(updatingEstadoDeuda) === 'cancelada' && (
              <Button
                onClick={() => handleTransitionEstado('activa')}
                variant="primary"
                className="w-full"
              >
                Reactivar Deuda
              </Button>
            )}
          </div>
        )}

        <div className="flex justify-end pt-6 mt-6 border-t border-linen/50">
          <Button
            type="button"
            onClick={() => {
              setUpdatingEstadoDeuda(null);
              setStatusError(null);
            }}
            variant="secondary"
          >
            Cerrar
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default Deudas;
