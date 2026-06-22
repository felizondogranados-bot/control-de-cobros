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
        
        // Find corresponding client locally for immediate mapping update
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
        
        // Map local state properties
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
      throw err; // Form modal catches and renders error banner
    }
  };

  // logical delete handler
  const handleConfirmCancel = async () => {
    if (!cancelingDeuda) return;
    try {
      await deleteDeuda(cancelingDeuda.id, user.id);
      
      // Update local state state to 'cancelada'
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

    // 1. Reactivar validation: if saldo_pendiente === 0, block and show error
    if (nuevoEstado === 'activa') {
      if (pending === 0) {
        setStatusError('La deuda no puede reactivarse porque no tiene saldo pendiente.');
        return;
      }
    }

    // 2. Marcar como pagada validation: if saldo_pendiente > 0, block and show error
    if (nuevoEstado === 'pagada') {
      if (pending > 0) {
        setStatusError('La deuda no puede marcarse como pagada porque aún tiene saldo pendiente.');
        return;
      }
    }

    // 3. Cancelar validation (modal de confirmación)
    if (nuevoEstado === 'cancelada') {
      const confirmText = `¿Desea cancelar esta deuda?\n\nLa deuda permanecerá registrada para efectos históricos, pero dejará de considerarse en los cálculos financieros.`;
      if (!window.confirm(confirmText)) {
        return;
      }
    }

    try {
      await updateDeudaEstado(updatingEstadoDeuda.id, nuevoEstado, user.id);
      
      // Update local state
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

    // Map selected status tabs
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
            { id: 'activas', label: 'Activas' },
            { id: 'pagadas', label: 'Pagadas' },
            { id: 'vencidas', label: 'Vencidas' },
            { id: 'canceladas', label: 'Canceladas' },
            { id: 'todas', label: 'Todas' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                selectedStatus === tab.id
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
            placeholder="Buscar por cliente o descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
        </div>

        {/* Create action */}
        <button
          onClick={() => {
            setEditingDeuda(null);
            setShowFormModal(true);
          }}
          className="btn-primary shrink-0 self-start xl:self-auto"
        >
          ➕ Nueva Deuda
        </button>
      </div>

      {/* Main List Workspace */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-brand-white border border-slate-200 rounded-2xl shadow-premium min-h-[300px]">
          <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 text-sm mt-4 font-semibold">Cargando deudas de Supabase...</span>
        </div>
      ) : filteredDeudas.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-brand-white border border-slate-200 rounded-2xl shadow-premium min-h-[300px] text-center">
          <div className="text-slate-300 text-5xl mb-4 select-none">💸</div>
          <h4 className="font-bold text-lg text-brand-gray-dark">No se encontraron deudas</h4>
          <p className="text-sm text-slate-400 mt-1 max-w-sm">
            {deudas.length === 0 
              ? 'No hay registros de deudas. Agrega una nueva presionando "+ Nueva Deuda".' 
              : 'Prueba a cambiar de pestaña o ajustar los términos de búsqueda.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden border border-slate-200 rounded-2xl bg-brand-white shadow-premium">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Descripción</th>
                  <th>Monto Total</th>
                  <th>Saldo Pendiente</th>
                  <th>Frecuencia</th>
                  <th>Día Cobro</th>
                  <th>Próxima Fecha</th>
                  <th>Estado</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDeudas.map((deuda) => (
                  <tr key={deuda.id}>
                    <td className="font-semibold text-brand-gray-dark">
                      {deuda.cliente_nombre}
                    </td>
                    <td>
                      <div>
                        <div className="text-brand-gray-dark font-medium">{deuda.descripcion}</div>
                        {deuda.observaciones && (
                          <div className="text-xs text-slate-400 italic mt-0.5 max-w-xs truncate" title={deuda.observaciones}>
                            {deuda.observaciones}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="font-mono text-sm font-semibold">
                      ${deuda.monto_total.toLocaleString()}
                    </td>
                    <td className="font-mono text-sm text-brand-blue font-bold">
                      ${deuda.saldo_pendiente.toLocaleString()}
                    </td>
                    <td>
                      <span className="capitalize text-xs font-semibold text-slate-500">
                        {deuda.frecuencia}
                      </span>
                    </td>
                    <td className="text-xs">
                      {deuda.dia_cobro}
                    </td>
                    <td className="font-mono text-xs font-semibold text-slate-600">
                      {deuda.proxima_fecha_pago}
                    </td>
                    <td>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        getDebtStatus(deuda) === 'activa'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : getDebtStatus(deuda) === 'pagada'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : getDebtStatus(deuda) === 'vencida'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {getDebtStatus(deuda)}
                      </span>
                    </td>
                    <td className="text-right whitespace-nowrap text-sm font-medium">
                      <div className="flex justify-end gap-1 sm:gap-2">
                        {/* WhatsApp reminder shortcut */}
                        {(getDebtStatus(deuda) === 'activa' || getDebtStatus(deuda) === 'vencida') && (
                          <button
                            onClick={() => handleSendReminder(deuda)}
                             className="px-2 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 rounded transition-all inline-flex items-center gap-1"
                            title="Enviar Recordatorio por WhatsApp"
                          >
                            💬 <span className="hidden sm:inline">Recordar</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleViewHistory(deuda)}
                          className="px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded transition-all"
                          title="Ver Historial de Abonos"
                        >
                          📄 <span className="hidden sm:inline">Pagos</span>
                        </button>
                        <button
                          onClick={() => setUpdatingEstadoDeuda(deuda)}
                          className="px-2 py-1 text-xs font-semibold text-amber-600 hover:bg-amber-50 rounded transition-all inline-flex items-center gap-1"
                          title="Cambiar Estado Administrativo"
                        >
                          ⚙️ <span className="hidden sm:inline">Estado</span>
                        </button>
                        <button
                          onClick={() => {
                            setEditingDeuda(deuda);
                            setShowFormModal(true);
                          }}
                          className="px-2 py-1 text-xs font-semibold text-brand-blue hover:bg-brand-blue/5 rounded transition-all"
                        >
                          Editar
                        </button>
                        {(getDebtStatus(deuda) === 'activa' || getDebtStatus(deuda) === 'vencida') && (
                          <button
                            onClick={() => setCancelingDeuda(deuda)}
                            className="px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded transition-all"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
      {cancelingDeuda && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-brand-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-brand-gray-dark mb-2">
              Cancelar Deuda
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              ¿Estás seguro de que deseas cancelar la deuda por <strong className="text-brand-gray-dark">${cancelingDeuda.monto_total.toLocaleString()}</strong> de{' '}
              <strong className="text-brand-gray-dark">{cancelingDeuda.cliente_nombre}</strong>?
              <br />
              <span className="text-xs text-rose-600 mt-2 block font-medium">
                Esta acción es una baja lógica; la deuda se marcará como "cancelada" y no será eliminada físicamente.
              </span>
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCancelingDeuda(null)}
                className="btn-secondary"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="btn-danger"
              >
                Sí, Cancelar Deuda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Payments Modal */}
      {viewingHistoryDeuda && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-brand-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => {
                setViewingHistoryDeuda(null);
                setHistoryPayments([]);
              }}
              type="button"
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-lg select-none"
            >
              ✕
            </button>
            
            <h3 className="text-lg font-bold text-brand-gray-dark mb-1">
              Historial de Pagos
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Cliente: <strong className="text-brand-gray-dark">{viewingHistoryDeuda.cliente_nombre}</strong><br />
              Deuda: <strong className="text-brand-gray-dark">{viewingHistoryDeuda.descripcion}</strong> (Total: ${viewingHistoryDeuda.monto_total.toLocaleString()})
            </p>

            {loadingHistory ? (
              <div className="flex justify-center p-8">
                <div className="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : historyPayments.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400 italic">
                No hay abonos activos registrados para esta deuda.
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {historyPayments.map((pago) => (
                  <div key={pago.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <div>
                      <div className="text-xs text-slate-400 font-mono">
                        {new Date(pago.fecha_pago || pago.created_at).toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </div>
                      <div className="text-[11px] font-semibold text-slate-600 mt-0.5">
                        Método: {pago.metodo_pago}
                      </div>
                      {pago.observaciones && (
                        <div className="text-[10px] text-slate-400 italic mt-0.5 max-w-[220px] truncate" title={pago.observaciones}>
                          Obs: {pago.observaciones}
                        </div>
                      )}
                    </div>
                    <div className="font-mono text-sm font-bold text-emerald-600">
                      +${pago.monto_abonado.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-end pt-4 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setViewingHistoryDeuda(null);
                  setHistoryPayments([]);
                }}
                className="btn-secondary"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Status Modal */}
      {updatingEstadoDeuda && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-brand-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => {
                setUpdatingEstadoDeuda(null);
                setStatusError(null);
              }}
              type="button"
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-lg select-none"
            >
              ✕
            </button>

            <h3 className="text-lg font-bold text-brand-gray-dark mb-1">
              Cambiar Estado Administrativo
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Cliente: <strong className="text-brand-gray-dark">{updatingEstadoDeuda.cliente_nombre}</strong><br />
              Deuda: <strong className="text-brand-gray-dark">{updatingEstadoDeuda.descripcion}</strong>
            </p>

            {/* General Debt details (current state, pending balance, total amount) */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Estado actual:</span>
                <span className={`font-bold uppercase ${
                  getDebtStatus(updatingEstadoDeuda) === 'activa' ? 'text-blue-600' :
                  getDebtStatus(updatingEstadoDeuda) === 'pagada' ? 'text-emerald-600' :
                  getDebtStatus(updatingEstadoDeuda) === 'vencida' ? 'text-rose-600' : 'text-slate-500'
                }`}>
                  {getDebtStatus(updatingEstadoDeuda)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Saldo pendiente:</span>
                <span className="font-mono font-bold text-brand-blue">
                  ${updatingEstadoDeuda.saldo_pendiente.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Monto total:</span>
                <span className="font-mono font-semibold">
                  ${updatingEstadoDeuda.monto_total.toLocaleString()}
                </span>
              </div>
            </div>

            {statusError && (
              <div className="mb-4 p-3 bg-rose-50 border-l-4 border-rose-600 text-rose-700 text-xs rounded-r-lg font-medium animate-shake">
                ⚠️ {statusError}
              </div>
            )}

            {/* Actions list based on state */}
            <div className="space-y-2.5 pt-2">
              {/* If active / vencida */}
              {(getDebtStatus(updatingEstadoDeuda) === 'activa' || getDebtStatus(updatingEstadoDeuda) === 'vencida') && (
                <>
                  <button
                    onClick={() => handleTransitionEstado('pagada')}
                    className="w-full btn-success text-xs py-2.5 font-bold rounded-lg shadow-sm"
                  >
                    ✅ Marcar como Pagada
                  </button>
                  <button
                    onClick={() => handleTransitionEstado('cancelada')}
                    className="w-full btn-danger text-xs py-2.5 bg-rose-600 hover:bg-rose-700 text-brand-white font-bold rounded-lg shadow-sm"
                  >
                    🚫 Cancelar Deuda
                  </button>
                </>
              )}

              {/* If pagada */}
              {getDebtStatus(updatingEstadoDeuda) === 'pagada' && (
                <>
                  <button
                    onClick={() => handleTransitionEstado('activa')}
                    className="w-full btn-primary text-xs py-2.5 font-bold rounded-lg shadow-sm"
                  >
                    ⚡ Reactivar Deuda
                  </button>
                  <button
                    onClick={() => handleTransitionEstado('cancelada')}
                    className="w-full btn-danger text-xs py-2.5 bg-rose-600 hover:bg-rose-700 text-brand-white font-bold rounded-lg shadow-sm"
                  >
                    🚫 Cancelar Deuda
                  </button>
                </>
              )}

              {/* If cancelada */}
              {getDebtStatus(updatingEstadoDeuda) === 'cancelada' && (
                <button
                  onClick={() => handleTransitionEstado('activa')}
                  className="w-full btn-primary text-xs py-2.5 font-bold rounded-lg shadow-sm"
                >
                  ⚡ Reactivar Deuda
                </button>
              )}
            </div>

            <div className="flex justify-end pt-4 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setUpdatingEstadoDeuda(null);
                  setStatusError(null);
                }}
                className="btn-secondary text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Deudas;
