import { supabase } from './supabase';
import { getDebtStatus } from '../utils/debtStatusHelpers';

/**
 * Dashboard Service
 * 
 * Aggregates statistics and alerts for the authenticated user's portfolio.
 */

/**
 * Fetches and computes dashboard metrics for a user.
 * 
 * @param {string} userId - Auth user ID.
 * @returns {Promise<object>} Computed dashboard statistics object.
 */
export async function getDashboardStats(userId) {
  if (!userId) throw new Error('Usuario no autenticado.');

  // Fetch deudas, pagos, count of clients, count of movements, and recent logs in parallel
  const [deudasResult, pagosResult, clientesResult, movimientosCountResult, recentMovimientosResult] = await Promise.all([
    supabase
      .from('deudas')
      .select('*, clientes(nombre, apellido, telefono)')
      .eq('user_id', userId),
    supabase
      .from('pagos')
      .select('monto_abonado')
      .eq('user_id', userId)
      .eq('estado', 'activo'),
    supabase
      .from('clientes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('movimientos')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('movimientos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)
  ]);

  if (deudasResult.error) {
    console.error('Error fetching deudas for dashboard:', deudasResult.error);
    throw deudasResult.error;
  }
  if (pagosResult.error) {
    console.error('Error fetching pagos for dashboard:', pagosResult.error);
    throw pagosResult.error;
  }
  if (clientesResult.error) {
    console.error('Error fetching clientes for dashboard:', clientesResult.error);
    throw clientesResult.error;
  }
  if (movimientosCountResult.error) {
    console.error('Error fetching audit logs count:', movimientosCountResult.error);
    throw movimientosCountResult.error;
  }
  if (recentMovimientosResult.error) {
    console.error('Error fetching recent movements:', recentMovimientosResult.error);
    throw recentMovimientosResult.error;
  }

  const deudas = deudasResult.data || [];
  const pagos = pagosResult.data || [];
  const clientesCount = clientesResult.count || 0;

  // Process data in memory
  let totalPrestado = 0;
  let saldoPendiente = 0;
  let deudasActivasCount = 0;
  let deudasPagadasCount = 0;
  let deudasVencidasCount = 0;
  let deudasCanceladasCount = 0;

  // List of pending collections (debt is active or overdue)
  const cobrosPendientesList = [];

  deudas.forEach((deuda) => {
    // Determine dynamic status
    const status = getDebtStatus(deuda);

    // 1. Total Prestado: sum deudas.monto_total excluding canceled
    if (deuda.estado !== 'cancelada') {
      totalPrestado += Number(deuda.monto_total);
    }

    // 2. Saldo Pendiente: sum deudas.saldo_pendiente of non-paid, non-canceled debts (stored database status 'activa')
    if (deuda.estado === 'activa') {
      saldoPendiente += Number(deuda.saldo_pendiente);
    }

    // 3. Count debts by status
    if (status === 'activa') {
      deudasActivasCount++;
    } else if (status === 'pagada') {
      deudasPagadasCount++;
    } else if (status === 'vencida') {
      deudasVencidasCount++;
    } else if (status === 'cancelada') {
      deudasCanceladasCount++;
    }

    // 4. Collect active or overdue debts with positive pending balance for the warning section
    if ((status === 'activa' || status === 'vencida') && Number(deuda.saldo_pendiente) > 0) {
      cobrosPendientesList.push({
        id: deuda.id,
        cliente_nombre: deuda.clientes
          ? `${deuda.clientes.nombre} ${deuda.clientes.apellido || ''}`.trim()
          : 'Cliente no encontrado',
        cliente_telefono: deuda.clientes?.telefono || '',
        monto_pendiente: Number(deuda.saldo_pendiente),
        proxima_fecha_pago: deuda.proxima_fecha_pago,
        status: status
      });
    }
  });

  // 5. Total Cobrado: sum payments.monto_abonado for active payments
  const totalCobrado = pagos.reduce((sum, p) => sum + Number(p.monto_abonado), 0);

  // 6. Sort pending collections by due date ascending (closest/most overdue first)
  cobrosPendientesList.sort((a, b) => {
    if (!a.proxima_fecha_pago) return 1;
    if (!b.proxima_fecha_pago) return -1;
    return a.proxima_fecha_pago.localeCompare(b.proxima_fecha_pago);
  });

  return {
    totalPrestado,
    totalCobrado,
    saldoPendiente,
    clientesCount,
    deudasActivasCount,
    deudasPagadasCount,
    deudasVencidasCount,
    deudasCanceladasCount,
    movimientosCount: movimientosCountResult.count || 0,
    recentMovimientos: recentMovimientosResult.data || [],
    cobrosPendientes: cobrosPendientesList.slice(0, 5)
  };
}
