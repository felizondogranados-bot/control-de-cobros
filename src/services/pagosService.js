import { supabase } from './supabase';
import { createMovimiento } from './movimientosService';

/**
 * Pagos Service
 * 
 * Scalability Design:
 * - Multi-tenant isolation: enforces `user_id` query scoping.
 * - Centralizes payment logic and transactional updates for debt balances.
 * - Computes `saldo_pendiente` using aggregate sum of active payments to prevent cumulative drift:
 *   saldo_pendiente = monto_total - SUM(pagos activos)
 * - Supports logical deletion of payments by updating state to 'anulado'.
 * - Prepares architecture for 'comprobante_url' and audit logs.
 */

/**
 * Recalculates the pending balance and state of a debt based on its active payments.
 * @param {number|string} deudaId - Debt ID.
 * @param {string} userId - Auth user ID.
 */
export async function recalculateDebtBalance(deudaId, userId) {
  if (!userId) throw new Error('Usuario no autenticado.');

  // 1. Fetch current total amount and status of the debt
  const { data: debt, error: debtError } = await supabase
    .from('deudas')
    .select('monto_total, estado, descripcion')
    .eq('id', deudaId)
    .eq('user_id', userId)
    .single();

  if (debtError) {
    console.error('Error fetching debt for recalculation:', debtError);
    throw debtError;
  }

  // 2. Fetch all ACTIVE payments of this debt
  const { data: activePayments, error: payError } = await supabase
    .from('pagos')
    .select('monto_abonado')
    .eq('deuda_id', deudaId)
    .eq('user_id', userId)
    .eq('estado', 'activo');

  if (payError) {
    console.error('Error fetching active payments for recalculation:', payError);
    throw payError;
  }

  // 3. Compute new pending balance
  const totalAbonado = activePayments.reduce((sum, p) => sum + Number(p.monto_abonado), 0);
  const newSaldo = Math.max(0, Number(debt.monto_total) - totalAbonado);
  const newEstado = newSaldo === 0 ? 'pagada' : 'activa';

  // 4. Update the debt record in Supabase
  const { error: updateError } = await supabase
    .from('deudas')
    .update({
      saldo_pendiente: newSaldo,
      estado: newEstado
    })
    .eq('id', deudaId)
    .eq('user_id', userId);

  if (updateError) {
    console.error('Error updating debt balance:', updateError);
    throw updateError;
  }

  // Log automated status transition to prevent duplicate logs
  if (debt) {
    try {
      if (debt.estado !== 'pagada' && newEstado === 'pagada') {
        // Log DEUDA_PAGADA_AUTOMATICA
        await createMovimiento({
          tipo: 'DEUDA_PAGADA_AUTOMATICA',
          descripcion: `Deuda pagada automáticamente al liquidar saldo: "${debt.descripcion}"`,
          entidad: 'deudas',
          entidad_id: deudaId
        }, userId);
      } else if (debt.estado === 'pagada' && newEstado === 'activa') {
        // Log ESTADO_MODIFICADO due to payment cancellation
        await createMovimiento({
          tipo: 'ESTADO_MODIFICADO',
          descripcion: `Estado de deuda "${debt.descripcion}" revertido automáticamente a "activa" al anular abonos.`,
          entidad: 'deudas',
          entidad_id: deudaId
        }, userId);
      }
    } catch (logErr) {
      console.error('Error logging automated debt state change:', logErr);
    }
  }

  return { newSaldo, newEstado };
}

/**
 * Fetches all payments registered by the authenticated user.
 * @param {string} userId - Auth user ID.
 */
export async function getPagos(userId) {
  if (!userId) throw new Error('Usuario no autenticado.');

  const { data, error } = await supabase
    .from('pagos')
    .select('*, deudas(descripcion, monto_total, clientes(nombre, apellido))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching payments:', error);
    throw error;
  }

  return data.map(pago => ({
    ...pago,
    deuda_descripcion: pago.deudas?.descripcion || 'Deuda no encontrada',
    deuda_monto_total: pago.deudas?.monto_total || 0,
    cliente_nombre: pago.deudas?.clientes
      ? `${pago.deudas.clientes.nombre} ${pago.deudas.clientes.apellido || ''}`.trim()
      : 'Cliente no encontrado'
  }));
}

/**
 * Fetches the active payment history for a specific debt.
 * @param {number|string} deudaId - Debt ID.
 * @param {string} userId - Auth user ID.
 */
export async function getPagosByDeuda(deudaId, userId) {
  if (!userId) throw new Error('Usuario no autenticado.');

  const { data, error } = await supabase
    .from('pagos')
    .select('*')
    .eq('deuda_id', deudaId)
    .eq('user_id', userId)
    .eq('estado', 'activo')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching payments by debt:', error);
    throw error;
  }

  return data;
}

/**
 * Registers a new payment and updates the debt balance.
 * @param {object} pago - Payment data (deuda_id, monto_abonado, metodo_pago, observaciones).
 * @param {string} userId - Auth user ID.
 */
export async function createPago(pago, userId) {
  if (!userId) throw new Error('Usuario no autenticado.');

  if (!pago.deuda_id) {
    throw new Error('Debe seleccionar una deuda');
  }

  const debtId = pago.deuda_id;
  const abono = Number(pago.monto_abonado);

  // 1. Fetch current pending balance of the debt to perform safety validation
  const { data: debt, error: debtError } = await supabase
    .from('deudas')
    .select('saldo_pendiente')
    .eq('id', debtId)
    .eq('user_id', userId)
    .single();

  if (debtError) throw debtError;

  if (abono > Number(debt.saldo_pendiente)) {
    throw new Error(`El abono ($${abono.toLocaleString()}) supera el saldo pendiente ($${debt.saldo_pendiente.toLocaleString()}) de la deuda.`);
  }

  // 2. Prepare payment payload
  const paymentPayload = {
    user_id: userId,
    deuda_id: debtId,
    monto: abono,
    monto_abonado: abono,
    metodo_pago: pago.metodo_pago,
    observaciones: pago.observaciones?.trim() || '',
    estado: 'activo', // Starts as active
    fecha_pago: new Date().toISOString().split('T')[0],
    
    // Future architectural placeholders (comprobante_url)
    // comprobante_url: pago.comprobante_url || null
  };

  // Temporally log exact UUID and payload sent to Supabase
  console.log('[Supabase - createPago] Enviando UUID de deuda:', debtId);
  console.log('Payload final enviado a Supabase:', paymentPayload);

  // 3. Insert payment record
  const { data: inserted, error: insertError } = await supabase
    .from('pagos')
    .insert([paymentPayload])
    .select();

  if (insertError) throw insertError;

  // Log audit trail
  try {
    const { data: debtInfo } = await supabase
      .from('deudas')
      .select('descripcion')
      .eq('id', debtId)
      .single();

    await createMovimiento({
      tipo: 'PAGO_REGISTRADO',
      descripcion: `Pago registrado de $${abono.toLocaleString()} (Método: ${pago.metodo_pago}) para la deuda: "${debtInfo?.descripcion || 'Deuda'}"`,
      entidad: 'pagos',
      entidad_id: inserted[0].id
    }, userId);
  } catch (logErr) {
    console.error('Error logging PAGO_REGISTRADO movement:', logErr);
  }

  // 4. Recalculate associated debt parameters
  await recalculateDebtBalance(debtId, userId);

  return inserted[0];
}

/**
 * Performs a logical deletion on a payment (sets status to 'anulado') and updates the debt.
 * @param {number|string} id - Payment ID.
 * @param {number|string} deudaId - Debt ID.
 * @param {string} userId - Auth user ID.
 */
export async function deletePago(id, deudaId, userId) {
  if (!userId) throw new Error('Usuario no autenticado.');

  // Fetch payment info before canceling for audit log
  let pagoInfo = null;
  try {
    const { data } = await supabase
      .from('pagos')
      .select('monto_abonado, metodo_pago, deudas(descripcion)')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    pagoInfo = data;
  } catch (fetchErr) {
    console.error('Error fetching payment details for audit trail:', fetchErr);
  }

  // 1. Mark payment as canceled ('anulado')
  const { error: cancelError } = await supabase
    .from('pagos')
    .update({ estado: 'anulado' })
    .eq('id', id)
    .eq('user_id', userId);

  if (cancelError) {
    console.error('Error canceling payment:', cancelError);
    throw cancelError;
  }

  // Log audit trail
  if (pagoInfo) {
    try {
      await createMovimiento({
        tipo: 'PAGO_ANULADO',
        descripcion: `Pago anulado de $${Number(pagoInfo.monto_abonado).toLocaleString()} (Método: ${pagoInfo.metodo_pago}) para la deuda: "${pagoInfo.deudas?.descripcion || 'Deuda'}"`,
        entidad: 'pagos',
        entidad_id: id
      }, userId);
    } catch (logErr) {
      console.error('Error logging PAGO_ANULADO movement:', logErr);
    }
  }

  // 2. Recalculate debt parameters
  await recalculateDebtBalance(deudaId, userId);
}
