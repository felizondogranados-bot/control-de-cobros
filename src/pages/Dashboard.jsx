import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getDashboardStats } from '../services/dashboardService';
import { getDiasAtraso } from '../utils/debtStatusHelpers';
import { sendDebtReminder } from '../services/whatsapp';
import InstallPWAButton from '../components/ui/InstallPWAButton';
import { useCategorias } from '../contexts/CategoriasContext';
import { 
  getClientes, 
  createCliente 
} from '../services/clientesService';
import { 
  getDeudas, 
  createDeuda 
} from '../services/deudasService';
import { 
  createPago 
} from '../services/pagosService';
import { 
  getMovimientos 
} from '../services/movimientosService';
import { 
  RefreshCw, 
  DollarSign, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  Calendar, 
  MessageSquare,
  PlusCircle,
  FileText,
  Folder,
  Settings,
  User,
  Plus,
  Edit2,
  Trash2,
  History,
  CreditCard,
  ChevronRight
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Alert from '../components/ui/Alert';
import LoadingState from '../components/ui/LoadingState';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';

// Form Components
import ClienteForm from '../components/ui/ClienteForm';
import DeudaForm from '../components/ui/DeudaForm';
import PagoForm from '../components/ui/PagoForm';
import CategoriaForm from '../components/ui/CategoriaForm';
import { Link } from 'react-router-dom';

/**
 * Dashboard Component
 * 
 * - Answers high-priority financial questions directly.
 * - Center of control: allows creating clients, debts, registering payments, and managing categories/activity logs directly.
 */
function Dashboard() {
  const { user } = useAuth();
  const { 
    categorias, 
    crearCategoria, 
    editarCategoria, 
    eliminarCategoria 
  } = useCategorias();

  // General Dashboard stats state
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Entities list states for form dropdowns & validation
  const [clientes, setClientes] = useState([]);
  const [deudas, setDeudas] = useState([]);
  const [allMovimientos, setAllMovimientos] = useState([]);
  const [loadingMovimientos, setLoadingMovimientos] = useState(false);

  // UI modal controls
  const [showClienteForm, setShowClienteForm] = useState(false);
  const [showDeudaForm, setShowDeudaForm] = useState(false);
  const [showPagoForm, setShowPagoForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);

  // Movements pagination states
  const [visibleMovementsCount, setVisibleMovementsCount] = useState(10);

  // Alert system
  const [alert, setAlert] = useState(null);

  const triggerAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => {
      setAlert(null);
    }, 5000);
  };

  const loadStats = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const computedStats = await getDashboardStats(user.id);
      setStats(computedStats);

      // Fetch helper lists for modals
      const fetchedClientes = await getClientes(user.id);
      setClientes(fetchedClientes);

      const fetchedDeudas = await getDeudas(user.id);
      setDeudas(fetchedDeudas);

      // Fetch full movements list
      setLoadingMovimientos(true);
      const fetchedMovimientos = await getMovimientos(user.id);
      setAllMovimientos(fetchedMovimientos);
      setLoadingMovimientos(false);
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
      setError(err.message || 'Error al cargar las estadísticas financieras.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [user]);

  const handleSendReminder = (cobro) => {
    if (!cobro.cliente_telefono) {
      triggerAlert('error', 'El cliente no tiene un teléfono registrado.');
      return;
    }
    const client = {
      name: cobro.cliente_nombre,
      phone: cobro.cliente_telefono
    };
    const debtObj = {
      amount: cobro.monto_pendiente,
      dueDate: cobro.proxima_fecha_pago
    };
    sendDebtReminder(client, debtObj);
  };

  // Submit handlers for quick action modals
  const handleCreateClienteSubmit = async (formData) => {
    try {
      await createCliente(formData, user.id);
      triggerAlert('success', `Cliente "${formData.nombre}" registrado con éxito.`);
      setShowClienteForm(false);
      await loadStats();
    } catch (err) {
      console.error('Error creating client from dashboard:', err);
      throw err;
    }
  };

  const handleCreateDeudaSubmit = async (formData) => {
    try {
      await createDeuda(formData, user.id);
      triggerAlert('success', `Deuda "${formData.descripcion}" registrada con éxito.`);
      setShowDeudaForm(false);
      await loadStats();
    } catch (err) {
      console.error('Error creating debt from dashboard:', err);
      throw err;
    }
  };

  const handleCreatePagoSubmit = async (formData) => {
    try {
      await createPago(formData, user.id);
      triggerAlert('success', `Pago registrado con éxito.`);
      setShowPagoForm(false);
      await loadStats();
    } catch (err) {
      console.error('Error registering payment from dashboard:', err);
      throw err;
    }
  };

  const handleCategorySubmit = async (formData) => {
    try {
      if (editingCategory) {
        await editarCategory(editingCategory.id, formData);
        triggerAlert('success', `Grupo "${formData.nombre}" actualizado.`);
      } else {
        await crearCategoria(formData);
        triggerAlert('success', `Grupo "${formData.nombre}" creado.`);
      }
      setShowCategoryForm(false);
      setEditingCategory(null);
      await loadStats();
    } catch (err) {
      console.error('Error saving category from dashboard:', err);
      throw err;
    }
  };

  const handleConfirmDeleteCategory = async () => {
    if (!deletingCategory) return;
    
    // Check if category has associated clients
    const associatedCount = clientes.filter(c => c.categoria_id === deletingCategory.id).length;
    if (associatedCount > 0) {
      triggerAlert('error', 'Este grupo está siendo utilizado por uno o más clientes. Debe reasignar esos clientes antes de eliminarlo.');
      setDeletingCategory(null);
      return;
    }

    try {
      await eliminarCategoria(deletingCategory.id);
      triggerAlert('success', `El grupo "${deletingCategory.nombre}" fue eliminado.`);
      await loadStats();
    } catch (err) {
      console.error('Error deleting category from dashboard:', err);
      triggerAlert('error', err.message || 'No se pudo eliminar el grupo.');
    } finally {
      setDeletingCategory(null);
    }
  };

  if (loading) {
    return <LoadingState message="Cargando resumen financiero..." />;
  }

  if (error) {
    return (
      <div className="my-6 max-w-2xl mx-auto">
        <Alert type="error">
          <div className="flex flex-col gap-2">
            <span>{error}</span>
            <Button onClick={loadStats} variant="secondary" className="w-fit">
              🔄 Reintentar
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  if (!stats) return null;

  const recoveryRate = stats.totalPrestado > 0 
    ? (stats.totalCobrado / stats.totalPrestado) * 100 
    : 0;

  // Filter cobros to show ONLY "clientes que deben pagar hoy" and "clientes que vencen esta semana"
  const getUpcomingCobros = () => {
    const hoyStr = new Date().toISOString().split('T')[0];
    const hoyDate = new Date(hoyStr);
    const finSemanaDate = new Date(hoyDate);
    finSemanaDate.setDate(finSemanaDate.getDate() + 7);

    return stats.cobrosPendientes.filter(cobro => {
      if (!cobro.proxima_fecha_pago) return false;
      const fechaDeuda = new Date(cobro.proxima_fecha_pago);
      const atraso = getDiasAtraso(cobro.proxima_fecha_pago);
      
      const esHoy = cobro.proxima_fecha_pago === hoyStr;
      const esEstaSemana = fechaDeuda >= hoyDate && fechaDeuda <= finSemanaDate;
      const esAtrasado = atraso > 0;

      return esHoy || esEstaSemana || esAtrasado;
    });
  };

  const upcomingCobros = getUpcomingCobros();

  // Audit Log Icons
  const getMovIcon = (entidad) => {
    if (entidad === 'clientes') return '👥';
    if (entidad === 'deudas') return '💸';
    if (entidad === 'pagos') return '💳';
    return '📜';
  };

  return (
    <div className="space-y-8 fade-in-up">
      {/* Alert Banner */}
      {alert && (
        <Alert type={alert.type} onClose={() => setAlert(null)}>
          {alert.message}
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-linen/50">
        <div>
          <h1 className="text-3xl font-title font-bold text-brand-gray-dark tracking-tight">
            Inicio
          </h1>
          <p className="text-base text-slate-500">
            Administración centralizada y simplificada de cobros.
          </p>
        </div>
        <Button onClick={loadStats} variant="secondary">
          <RefreshCw className="w-5 h-5" />
          <span>Actualizar</span>
        </Button>
      </div>

      {/* 1. Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pendiente por Cobrar */}
        <Card className="relative overflow-hidden border-l-4 border-l-moss p-6 shadow-soft" hoverable>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-sm font-semibold text-slate-500 block mb-1">
                Pendiente por Cobrar
              </span>
              <span className="text-3xl font-bold text-brand-gray-dark tracking-tight">
                ${stats.saldoPendiente.toLocaleString()}
              </span>
            </div>
            <div className="p-3 bg-moss/10 text-moss rounded-2xl">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <span className="text-xs text-slate-400 font-semibold block mt-4">
            De deudas activas sin cancelar
          </span>
        </Card>

        {/* Retrasos / Atención */}
        <Card className="relative overflow-hidden border-l-4 border-l-rose p-6 shadow-soft" hoverable>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-sm font-semibold text-slate-500 block mb-1">
                Atención Requerida
              </span>
              <span className="text-3xl font-bold text-rose-dark tracking-tight">
                {stats.deudasVencidasCount} vencidas
              </span>
            </div>
            <div className="p-3 bg-rose-light text-rose-dark rounded-2xl">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
          <span className="text-xs text-rose-dark/70 font-semibold block mt-4">
            Clientes con cuotas atrasadas
          </span>
        </Card>

        {/* Recuperación */}
        <Card className="relative overflow-hidden border-l-4 border-l-matcha-dark p-6 shadow-soft" hoverable>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-sm font-semibold text-slate-500 block mb-1">
                Tasa de Recuperación
              </span>
              <span className="text-3xl font-bold text-moss-dark tracking-tight">
                {recoveryRate.toFixed(1)}%
              </span>
            </div>
            <div className="p-3 bg-matcha-light text-moss-dark rounded-2xl">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <span className="text-xs text-slate-400 font-semibold block mt-4">
            ${stats.totalCobrado.toLocaleString()} cobrado de ${stats.totalPrestado.toLocaleString()}
          </span>
        </Card>
      </div>

      {/* 2. Acciones Rápidas */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-brand-gray-dark mb-4">
          Acciones Rápidas
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link 
            to="/clientes"
            className="flex items-center justify-between p-5 bg-linen-light/35 hover:bg-linen/50 border border-linen rounded-2xl transition-all font-semibold text-brand-gray-dark cursor-pointer text-base text-left min-h-[52px]"
          >
            <span className="flex items-center gap-3">
              <Users className="w-5 h-5 text-moss" />
              Nuevo Cliente
            </span>
            <span className="text-moss-dark">➕</span>
          </Link>

          <Link 
            to="/deudas"
            className="flex items-center justify-between p-5 bg-linen-light/35 hover:bg-linen/50 border border-linen rounded-2xl transition-all font-semibold text-brand-gray-dark cursor-pointer text-base text-left min-h-[52px]"
          >
            <span className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-moss" />
              Nueva Deuda
            </span>
            <span className="text-moss-dark">➕</span>
          </Link>

          <Link 
            to="/pagos"
            className="flex items-center justify-between p-5 bg-linen-light/35 hover:bg-linen/50 border border-linen rounded-2xl transition-all font-semibold text-brand-gray-dark cursor-pointer text-base text-left min-h-[52px]"
          >
            <span className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-moss" />
              Registrar Pago
            </span>
            <span className="text-moss-dark">➕</span>
          </Link>

          <button 
            onClick={() => setShowCategoryForm(true)}
            className="flex items-center justify-between p-5 bg-linen-light/35 hover:bg-linen/50 border border-linen rounded-2xl transition-all font-semibold text-brand-gray-dark cursor-pointer text-base text-left min-h-[52px] w-full"
          >
            <span className="flex items-center gap-3">
              <Folder className="w-5 h-5 text-moss" />
              Nueva Categoría
            </span>
            <span className="text-moss-dark">➕</span>
          </button>
        </div>
      </Card>

      {/* 3. Próximos Cobros */}
      <Card className="p-6">
        <div className="flex justify-between items-center border-b border-linen/50 pb-4 mb-6">
          <h3 className="text-xl font-bold text-brand-gray-dark flex items-center gap-2">
            <Calendar className="w-5 h-5 text-moss" />
            <span>Próximos Cobros (Hoy y esta semana)</span>
          </h3>
          <Link to="/deudas">
            <Button variant="secondary" className="py-1.5 px-4 text-sm font-semibold rounded-xl min-h-[38px]">
              <span>Ver todas las deudas</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {upcomingCobros.length === 0 ? (
          <div className="py-12 text-center">
            <span className="text-3xl mb-2 block">🤝</span>
            <h4 className="font-bold text-base text-slate-700">No hay cobros pendientes para hoy o esta semana.</h4>
            <p className="text-sm text-slate-400 mt-1">¡Todo al día!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Saldo Pendiente</th>
                  <th className="px-6 py-4">Fecha Vencimiento</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Recordar</th>
                </tr>
              </thead>
              <tbody>
                {upcomingCobros.map((cobro) => {
                  const atraso = getDiasAtraso(cobro.proxima_fecha_pago);
                  return (
                    <tr key={cobro.id} className="hover:bg-linen-light/30 transition-colors">
                      <td className="px-6 py-5 font-semibold text-brand-gray-dark text-base">
                        {cobro.cliente_nombre}
                      </td>
                      <td className="px-6 py-5 font-bold text-moss-dark text-base">
                        ${cobro.monto_pendiente.toLocaleString()}
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-600 font-semibold">
                        {cobro.proxima_fecha_pago}
                      </td>
                      <td className="px-6 py-5">
                        {atraso > 0 ? (
                          <Badge variant="danger">
                            Atrasado {atraso} {atraso === 1 ? 'día' : 'días'}
                          </Badge>
                        ) : cobro.proxima_fecha_pago === new Date().toISOString().split('T')[0] ? (
                          <Badge variant="warning">
                            Hoy
                          </Badge>
                        ) : (
                          <Badge variant="info">
                            Esta semana
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-5 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleSendReminder(cobro)}
                          className="px-4 py-2 text-sm font-bold text-emerald-800 bg-matcha-light hover:bg-matcha rounded-xl transition-all inline-flex items-center gap-1.5 border border-matcha/40 cursor-pointer min-h-[38px]"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>WhatsApp</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 4. Categorías */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-brand-gray-dark border-b border-linen/50 pb-4 mb-6 flex items-center gap-2">
          <Folder className="w-5 h-5 text-moss" />
          <span>Categorías</span>
        </h3>

        {categorias.length === 0 ? (
          <EmptyState
            title="Aún no has registrado ninguna categoría."
            description="Comienza creando la primera."
            icon={<Folder className="w-8 h-8 text-moss" />}
            actionText="Nueva Categoría"
            onAction={() => {
              setEditingCategory(null);
              setShowCategoryForm(true);
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categorias.map((cat) => {
              const clientCount = clientes.filter(c => c.categoria_id === cat.id).length;
              const isSystem = cat.user_id === null;
              
              return (
                <div 
                  key={cat.id} 
                  className="bg-white border border-linen p-5 rounded-2xl flex flex-col justify-between shadow-soft hover:shadow-premium transition-all duration-300 min-h-[140px]"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {cat.color ? (
                        <span 
                          className="w-3.5 h-3.5 rounded-full border shadow-inner shrink-0" 
                          style={{ backgroundColor: cat.color, borderColor: `${cat.color}40` }}
                        />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-300 bg-slate-100 shrink-0" />
                      )}
                      <h4 className="font-bold text-base text-brand-gray-dark truncate">{cat.nombre}</h4>
                    </div>
                    <span className="text-sm text-slate-500 font-semibold block">
                      {clientCount} {clientCount === 1 ? 'cliente asociado' : 'clientes asociados'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-linen/30">
                    <span className="text-xs font-bold text-slate-400">
                      {isSystem ? 'Sistema' : 'Personalizada'}
                    </span>
                    {!isSystem && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditingCategory(cat);
                            setShowCategoryForm(true);
                          }}
                          className="p-1.5 text-moss-dark hover:bg-moss/10 rounded-xl cursor-pointer transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingCategory(cat)}
                          className="p-1.5 text-rose-dark hover:bg-rose-light rounded-xl cursor-pointer transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Tarjeta Adicional "Nueva Categoría" */}
            <div 
              onClick={() => {
                setEditingCategory(null);
                setShowCategoryForm(true);
              }}
              className="border-2 border-dashed border-linen-dark hover:border-moss hover:bg-linen-light/20 transition-all p-5 rounded-2xl flex flex-col items-center justify-center cursor-pointer min-h-[140px] text-slate-500 hover:text-moss-dark group"
            >
              <Plus className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-sm">Nueva Categoría</span>
            </div>
          </div>
        )}
      </Card>

      {/* 5. Registro de actividad reciente */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-brand-gray-dark border-b border-linen/50 pb-4 mb-6 flex items-center gap-2">
          <History className="w-5 h-5 text-moss" />
          <span>Registro de actividad reciente</span>
        </h3>

        {loadingMovimientos && allMovimientos.length === 0 ? (
          <LoadingState message="Cargando historial..." />
        ) : allMovimientos.length === 0 ? (
          <div className="py-12 text-center text-base text-slate-400 italic">
            No hay registros de actividad guardados en esta cuenta.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="divide-y divide-linen/30">
              {allMovimientos.slice(0, visibleMovementsCount).map((mov) => {
                const dateObj = new Date(mov.created_at);
                const fecha = dateObj.toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                const hora = dateObj.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' });

                return (
                  <div key={mov.id} className="py-4 flex items-start gap-4 transition-colors">
                    <div className="text-2xl select-none shrink-0 pt-0.5">
                      {getMovIcon(mov.entidad)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base text-slate-700 font-medium whitespace-normal leading-relaxed">
                        {mov.descripcion}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400 font-semibold">
                        <span>{fecha}</span>
                        <span>•</span>
                        <span>{hora}</span>
                        <span>•</span>
                        <span className="capitalize">{mov.entidad}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Ver Más button */}
            {allMovimientos.length > visibleMovementsCount && (
              <div className="flex justify-center pt-4 border-t border-linen/30">
                <Button 
                  onClick={() => setVisibleMovementsCount(prev => prev + 10)} 
                  variant="secondary"
                  className="w-full sm:w-auto"
                >
                  <History className="w-5 h-5" />
                  <span>Ver más actividad ({allMovimientos.length - visibleMovementsCount} pendientes)</span>
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* PWA Install Button Card */}
      <Card className="max-w-md">
        <h3 className="text-lg font-bold text-brand-gray-dark border-b border-linen/50 pb-3 mb-4">
          Aplicación Móvil
        </h3>
        <InstallPWAButton />
      </Card>

      {/* Modal Forms triggered from Actions */}
      {showClienteForm && (
        <ClienteForm
          onSubmit={handleCreateClienteSubmit}
          onClose={() => setShowClienteForm(false)}
        />
      )}

      {showDeudaForm && (
        <DeudaForm
          clientes={clientes}
          onSubmit={handleCreateDeudaSubmit}
          onClose={() => setShowDeudaForm(false)}
        />
      )}

      {showPagoForm && (
        <PagoForm
          deudas={deudas}
          onSubmit={handleCreatePagoSubmit}
          onClose={() => setShowPagoForm(false)}
        />
      )}

      {showCategoryForm && (
        <CategoriaForm
          initialData={editingCategory}
          onSubmit={handleCategorySubmit}
          onClose={() => {
            setShowCategoryForm(false);
            setEditingCategory(null);
          }}
        />
      )}

      {/* Delete Categoria Dialog */}
      <Modal
        isOpen={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        title="Confirmar Eliminación de Grupo"
      >
        <p className="text-base text-slate-500 mb-6">
          ¿Estás seguro de que deseas eliminar permanentemente el grupo{' '}
          <strong className="text-brand-gray-dark">
            {deletingCategory?.nombre}
          </strong>
          ? Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-3 pt-4 border-t border-linen/50">
          <Button
            type="button"
            onClick={() => setDeletingCategory(null)}
            variant="secondary"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirmDeleteCategory}
            variant="danger"
          >
            Sí, Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default Dashboard;
