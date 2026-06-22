import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getDashboardStats } from '../services/dashboardService';
import { getDiasAtraso } from '../utils/debtStatusHelpers';
import { sendDebtReminder } from '../services/whatsapp';
import InstallPWAButton from '../components/ui/InstallPWAButton';


/**
 * Dashboard Component
 * 
 * Displays key financial statistics, collection recovery rates, progress tracking,
 * and lists upcoming or overdue collections with direct WhatsApp reminder triggers.
 */
function Dashboard() {
  const { user } = useAuth();

  // Data states
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStats = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const computedStats = await getDashboardStats(user.id);
      setStats(computedStats);
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
      alert('El cliente no tiene un teléfono registrado.');
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
        <span className="text-slate-500 text-sm mt-4 font-semibold">Cargando métricas financieras...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-50 border-l-4 border-rose-600 text-rose-800 rounded-r-xl font-medium text-sm my-6">
        ⚠️ {error}
        <button 
          onClick={loadStats} 
          className="ml-4 underline text-rose-950 font-bold hover:text-rose-700 block sm:inline mt-2 sm:mt-0"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!stats) return null;

  // Recovery Rate
  const recoveryRate = stats.totalPrestado > 0 
    ? (stats.totalCobrado / stats.totalPrestado) * 100 
    : 0;

  // Pending Rate
  const pendingRate = stats.totalPrestado > 0 
    ? (stats.saldoPendiente / stats.totalPrestado) * 100 
    : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner / Header */}
      <div className="bg-brand-blue-dark text-brand-white p-6 md:p-8 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-blue/20 to-transparent pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-extrabold text-brand-white mb-2 leading-tight">
            Panel de Control Financiero
          </h1>
          <p className="text-slate-300 text-sm md:text-base font-medium">
            Resumen en tiempo real de tus préstamos, cobros y estado de morosidad.
          </p>
        </div>
        <button 
          onClick={loadStats} 
          className="px-4 py-2 bg-brand-blue hover:bg-brand-blue/90 active:scale-[0.98] text-brand-white text-xs font-bold rounded-lg transition-all shadow-md z-10 flex items-center gap-1.5"
        >
          🔄 Actualizar Datos
        </button>
      </div>

      {/* Métricas Financieras Principales (Fila 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Prestado */}
        <div className="bg-brand-white border border-slate-100 rounded-2xl p-5 shadow-premium hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-blue"></div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Total Prestado
              </span>
              <span className="text-2xl font-black text-brand-gray-dark block tracking-tight">
                ${stats.totalPrestado.toLocaleString()}
              </span>
            </div>
            <div className="p-2.5 bg-blue-50 text-brand-blue rounded-xl text-lg font-bold">
              💰
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold block mt-3">
            Excluye deudas canceladas
          </span>
        </div>

        {/* Total Cobrado */}
        <div className="bg-brand-white border border-slate-100 rounded-2xl p-5 shadow-premium hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Total Cobrado
              </span>
              <span className="text-2xl font-black text-emerald-600 block tracking-tight">
                ${stats.totalCobrado.toLocaleString()}
              </span>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-lg font-bold">
              💵
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold block mt-3">
            Suma de abonos activos
          </span>
        </div>

        {/* Saldo Pendiente */}
        <div className="bg-brand-white border border-slate-100 rounded-2xl p-5 shadow-premium hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Saldo Pendiente
              </span>
              <span className="text-2xl font-black text-amber-600 block tracking-tight">
                ${stats.saldoPendiente.toLocaleString()}
              </span>
            </div>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl text-lg font-bold">
              📄
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold block mt-3">
            Deudas activas por cobrar
          </span>
        </div>

        {/* Tasa de Recuperación */}
        <div className="bg-brand-white border border-slate-100 rounded-2xl p-5 shadow-premium hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Tasa de Recuperación
              </span>
              <span className="text-2xl font-black text-indigo-600 block tracking-tight">
                {recoveryRate.toFixed(1)}%
              </span>
            </div>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-lg font-bold">
              📈
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold block mt-3">
            {stats.totalCobrado > 0 ? 'Cobrado vs. Prestado' : 'Sin abonos registrados'}
          </span>
        </div>
      </div>

      {/* Volúmenes de Cartera (Fila 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
        {/* Clientes */}
        <div className="bg-brand-white border border-slate-100 rounded-2xl p-5 shadow-premium hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Clientes
              </span>
              <span className="text-2xl font-black text-brand-gray-dark block tracking-tight">
                {stats.clientesCount}
              </span>
            </div>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl text-lg font-bold">
              👥
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold block mt-3">
            Clientes registrados
          </span>
        </div>

        {/* Deudas Activas */}
        <div className="bg-brand-white border border-slate-100 rounded-2xl p-5 shadow-premium hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-sky-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Deudas Activas
              </span>
              <span className="text-2xl font-black text-sky-600 block tracking-tight">
                {stats.deudasActivasCount}
              </span>
            </div>
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl text-lg font-bold">
              📌
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold block mt-3">
            Al día y en plazo
          </span>
        </div>

        {/* Deudas Pagadas */}
        <div className="bg-brand-white border border-slate-100 rounded-2xl p-5 shadow-premium hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Deudas Pagadas
              </span>
              <span className="text-2xl font-black text-emerald-600 block tracking-tight">
                {stats.deudasPagadasCount}
              </span>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-lg font-bold">
              ✅
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold block mt-3">
            Liquidadas al 100%
          </span>
        </div>

        {/* Deudas Vencidas */}
        <div className="bg-brand-white border border-slate-100 rounded-2xl p-5 shadow-premium hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Deudas Vencidas
              </span>
              <span className="text-2xl font-black text-rose-600 block tracking-tight">
                {stats.deudasVencidasCount}
              </span>
            </div>
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl text-lg font-bold">
              ⚠️
            </div>
          </div>
          <span className="text-[10px] text-rose-600 font-bold block mt-3">
            Fuera de plazo
          </span>
        </div>

        {/* Deudas Canceladas */}
        <div className="bg-brand-white border border-slate-100 rounded-2xl p-5 shadow-premium hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-400"></div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Deudas Canceladas
              </span>
              <span className="text-2xl font-black text-slate-600 block tracking-tight">
                {stats.deudasCanceladasCount}
              </span>
            </div>
            <div className="p-2.5 bg-slate-100 text-slate-500 rounded-xl text-lg font-bold">
              🚫
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold block mt-3">
            Historial de cancelaciones
          </span>
        </div>

        {/* Movimientos */}
        <div className="bg-brand-white border border-slate-100 rounded-2xl p-5 shadow-premium hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-sky-600"></div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Movimientos
              </span>
              <span className="text-2xl font-black text-sky-700 block tracking-tight">
                {stats.movimientosCount}
              </span>
            </div>
            <div className="p-2.5 bg-sky-50 text-sky-700 rounded-xl text-lg font-bold">
              📜
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold block mt-3">
            Bitácora de auditoría
          </span>
        </div>
      </div>

      {/* Progress metrics and cobros pendientes section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Performance Metrics & Mobile App Card */}
        <div className="lg:col-span-1 space-y-6">
          {/* Métricas Rápidas / Progress Card */}
          <div className="bg-brand-white border border-slate-100 rounded-2xl p-6 shadow-premium flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-brand-gray-dark border-b border-slate-50 pb-3 mb-5">
                📊 Métricas de Rendimiento
              </h3>

              <div className="space-y-6">
                {/* Porcentaje Recuperado */}
                <div>
                  <div className="flex justify-between items-center text-xs font-bold mb-2">
                    <span className="text-slate-500 uppercase tracking-wider">Porcentaje Recuperado</span>
                    <span className="text-emerald-600">{recoveryRate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, recoveryRate)}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    Proporción del capital devuelto por abonos.
                  </p>
                </div>

                {/* Porcentaje Pendiente */}
                <div>
                  <div className="flex justify-between items-center text-xs font-bold mb-2">
                    <span className="text-slate-500 uppercase tracking-wider">Porcentaje Pendiente</span>
                    <span className="text-amber-600">{pendingRate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, pendingRate)}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    Proporción del capital aún por recuperar.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-50 text-[11px] text-slate-400 font-semibold bg-slate-50/50 p-3 rounded-xl">
              💡 <strong>Tasa de Cobro:</strong> Una tasa superior al 80% indica un rendimiento saludable del flujo de efectivo.
            </div>
          </div>

          {/* Tarjeta Aplicación Móvil */}
          <div className="bg-brand-white border border-slate-100 rounded-2xl p-6 shadow-premium">
            <h3 className="text-base font-bold text-brand-gray-dark border-b border-slate-50 pb-3 mb-4 flex items-center gap-2">
              📱 Aplicación Móvil
            </h3>
            <InstallPWAButton />
          </div>
        </div>


        {/* Cobros Pendientes (Alerts section) */}
        <div className="lg:col-span-2 bg-brand-white border border-slate-100 rounded-2xl p-6 shadow-premium h-full">
          <h3 className="text-base font-bold text-brand-gray-dark border-b border-slate-50 pb-3 mb-4 flex items-center justify-between">
            <span>📅 Próximos Cobros / Pendientes</span>
            {stats.cobrosPendientes.length > 0 && (
              <span className="bg-rose-50 text-rose-600 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">
                Acción requerida
              </span>
            )}
          </h3>

          {stats.cobrosPendientes.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center min-h-[220px]">
              <span className="text-3xl mb-2">🤝</span>
              <h4 className="font-bold text-sm text-brand-gray-dark">Sin cobros pendientes</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                ¡Excelente! No tienes deudas activas o vencidas con saldos pendientes por reclamar en este momento.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Saldo Pendiente</th>
                    <th>Próxima Fecha</th>
                    <th>Días de Atraso</th>
                    <th className="text-right">Recordatorio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.cobrosPendientes.map((cobro) => {
                    const atraso = getDiasAtraso(cobro.proxima_fecha_pago);
                    
                    return (
                      <tr key={cobro.id} className="hover:bg-slate-50/70 transition-colors duration-150">
                        <td className="font-semibold text-brand-gray-dark">
                          {cobro.cliente_nombre}
                        </td>
                        <td className="font-mono text-sm font-bold text-brand-blue">
                          ${cobro.monto_pendiente.toLocaleString()}
                        </td>
                        <td className="font-mono text-xs text-slate-600 font-semibold">
                          {cobro.proxima_fecha_pago || <span className="text-slate-300">-</span>}
                        </td>
                        <td>
                          {atraso > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-100 animate-pulse">
                              🚨 {atraso} {atraso === 1 ? 'día' : 'días'} de atraso
                            </span>
                          ) : cobro.proxima_fecha_pago === new Date().toISOString().split('T')[0] ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-100">
                              ⚡ Hoy
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500">
                              En plazo
                            </span>
                          )}
                        </td>
                        <td className="text-right whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleSendReminder(cobro)}
                            className="px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all inline-flex items-center gap-1 border border-emerald-100"
                            title="Enviar aviso de cobro inmediato"
                          >
                            💬 WhatsApp
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Actividad Reciente / Auditoría (Últimos 10 movimientos) */}
      <div className="bg-brand-white border border-slate-200 rounded-2xl p-6 shadow-premium">
        <h3 className="text-base font-bold text-brand-gray-dark border-b border-slate-50 pb-3 mb-4 flex items-center justify-between">
          <span>📜 Actividad Reciente / Bitácora de Auditoría</span>
          <span className="text-[10px] text-slate-400 font-semibold">
            Últimos 10 movimientos del sistema
          </span>
        </h3>

        {stats.recentMovimientos.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400 italic">
            No hay actividades registradas en la bitácora.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Descripción</th>
                  <th>Entidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.recentMovimientos.map((mov) => (
                  <tr key={mov.id} className="hover:bg-slate-50/70 transition-colors duration-150">
                    <td className="font-mono text-xs text-slate-500">
                      {new Date(mov.created_at).toLocaleString('es-CR', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        mov.tipo.includes('CREADO') || mov.tipo.includes('REGISTRADO') || mov.tipo.includes('CREADA')
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : mov.tipo.includes('ELIMINADO') || mov.tipo.includes('ANULADO') || mov.tipo.includes('CANCELADA')
                          ? 'bg-rose-50 text-rose-700 border border-rose-100'
                          : 'bg-blue-50 text-blue-700 border border-blue-100'
                      }`}>
                        {mov.tipo}
                      </span>
                    </td>
                    <td className="text-xs text-slate-700 font-medium truncate max-w-md" title={mov.descripcion}>
                      {mov.descripcion}
                    </td>
                    <td>
                      <span className="capitalize text-xs font-semibold text-slate-500">
                        {mov.entidad}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
