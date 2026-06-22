import { supabase } from './supabase';
import { calculateNextPaymentDate, formatDateToYYYYMMDD } from '../utils/dateHelpers';
import { createMovimiento } from './movimientosService';

/**
 * Deudas Service
 * 
 * Scalability Design:
 * - Multi-tenant isolation: enforces `user_id` query scoping.
 * - Handles join mapping between 'deudas' and 'clientes'.
 * - Implements automated calculation of the next payment date upon insertion and updates.
 * - Supports logical deletion by updating status to 'cancelada'.
 */

/**
 * Fetches all debts of the authenticated user, including client details.
 * @param {string} userId - Auth user ID.
 */
export async function getDeudas(userId) {
  if (!userId) throw new Error('Usuario no autenticado.');

  const { data, error } = await supabase
    .from('deudas')
    .select('*, clientes(nombre, apellido, telefono)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching debts:', error);
    throw error;
  }

  // Normalizes client details inside the object
  return data.map(deuda => ({
    ...deuda,
    cliente_nombre: deuda.clientes 
      ? `${deuda.clientes.nombre} ${deuda.clientes.apellido || ''}`.trim()
      : 'Cliente no encontrado',
    cliente_telefono: deuda.clientes?.telefono || ''
  }));
}

/**
 * Creates a new debt record.
 * @param {object} deuda - Debt fields (cliente_id, descripcion, monto_total, frecuencia, dia_cobro, observaciones).
 * @param {string} userId - Auth user ID.
 */
export async function createDeuda(deuda, userId) {
  if (!userId) throw new Error('Usuario no autenticado.');

  // Validation
  if (!deuda.cliente_id) {
    throw new Error('Debe seleccionar un cliente');
  }

  const nextPayment = calculateNextPaymentDate(deuda.frecuencia, deuda.dia_cobro);
  const monto = Number(deuda.monto_total);
  const fechaInicio = new Date().toISOString().split('T')[0];

  console.log('[createDeuda] fecha_inicio:', fechaInicio);

  const debtData = {
    user_id: userId,
    cliente_id: deuda.cliente_id, // Saved as raw ID (e.g. UUID string)
    descripcion: deuda.descripcion.trim(),
    monto_total: monto,
    saldo_pendiente: monto, // Initially matches the total amount
    frecuencia: deuda.frecuencia,
    dia_cobro: deuda.dia_cobro,
    proxima_fecha_pago: formatDateToYYYYMMDD(nextPayment),
    fecha_inicio: fechaInicio,
    estado: 'activa', // Defaults to 'activa'
    observaciones: deuda.observaciones?.trim() || '',
  };

  console.log('[createDeuda] payload:', debtData);
  console.log('[Supabase - createDeuda] Sending payload to Supabase:', debtData);

  const { data, error } = await supabase
    .from('deudas')
    .insert([debtData])
    .select();

  if (error) {
    console.error('Error creating debt:', error);
    throw error;
  }

  const inserted = data[0];

  // Log audit trail
  try {
    await createMovimiento({
      tipo: 'DEUDA_CREADA',
      descripcion: `Deuda creada por $${inserted.monto_total.toLocaleString()}: "${inserted.descripcion}"`,
      entidad: 'deudas',
      entidad_id: inserted.id
    }, userId);
  } catch (logErr) {
    console.error('Error logging DEUDA_CREADA movement:', logErr);
  }

  return inserted;
}

/**
 * Updates an existing debt record.
 * @param {string} id - Debt record ID.
 * @param {object} deudaData - Updated fields.
 * @param {string} userId - Auth user ID.
 */
export async function updateDeuda(id, deudaData, userId) {
  if (!userId) throw new Error('Usuario no autenticado.');

  // Validation
  if (!deudaData.cliente_id) {
    throw new Error('Debe seleccionar un cliente');
  }

  // Fetch old debt details for audit trail comparison
  let oldDebt = null;
  try {
    const { data } = await supabase
      .from('deudas')
      .select('descripcion, monto_total, frecuencia, dia_cobro')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    oldDebt = data;
  } catch (fetchErr) {
    console.error('Error fetching old debt details for audit trail:', fetchErr);
  }

  const nextPayment = calculateNextPaymentDate(deudaData.frecuencia, deudaData.dia_cobro);
  const monto = Number(deudaData.monto_total);

  const cleanData = {
    cliente_id: deudaData.cliente_id, // Saved as raw ID (e.g. UUID string)
    descripcion: deudaData.descripcion.trim(),
    monto_total: monto,
    frecuencia: deudaData.frecuencia,
    dia_cobro: deudaData.dia_cobro,
    proxima_fecha_pago: formatDateToYYYYMMDD(nextPayment),
    observaciones: deudaData.observaciones?.trim() || '',
  };

  console.log('[Supabase - updateDeuda] Sending update payload to Supabase:', cleanData);

  const { data, error } = await supabase
    .from('deudas')
    .update(cleanData)
    .eq('id', id)
    .eq('user_id', userId)
    .select();

  if (error) {
    console.error('Error updating debt:', error);
    throw error;
  }

  const updated = data[0];

  // Log audit trail
  try {
    const debtChanges = [];
    if (oldDebt) {
      if (oldDebt.descripcion !== updated.descripcion) {
        debtChanges.push(`Descripción: "${oldDebt.descripcion}" -> "${updated.descripcion}"`);
      }
      if (Number(oldDebt.monto_total) !== updated.monto_total) {
        debtChanges.push(`Monto total: $${oldDebt.monto_total} -> $${updated.monto_total}`);
      }
      if (oldDebt.frecuencia !== updated.frecuencia) {
        debtChanges.push(`Frecuencia: ${oldDebt.frecuencia} -> ${updated.frecuencia}`);
      }
      if (oldDebt.dia_cobro !== updated.dia_cobro) {
        debtChanges.push(`Día cobro: ${oldDebt.dia_cobro} -> ${updated.dia_cobro}`);
      }
    }
    const description = `Deuda editada: "${updated.descripcion}".${debtChanges.length > 0 ? ' Cambios: ' + debtChanges.join(', ') : ' Sin cambios relevantes.'}`;

    await createMovimiento({
      tipo: 'DEUDA_EDITADA',
      descripcion,
      entidad: 'deudas',
      entidad_id: updated.id
    }, userId);
  } catch (logErr) {
    console.error('Error logging DEUDA_EDITADA movement:', logErr);
  }

  return updated;
}

/**
 * Performs a logical deletion of a debt record (sets status to 'cancelada').
 * @param {string} id - Debt record ID.
 * @param {string} userId - Auth user ID.
 */
export async function deleteDeuda(id, userId) {
  if (!userId) throw new Error('Usuario no autenticado.');

  const { data, error } = await supabase
    .from('deudas')
    .update({ estado: 'cancelada' })
    .eq('id', id)
    .eq('user_id', userId)
    .select();

  if (error) {
    console.error('Error canceling debt:', error);
    throw error;
  }

  const canceled = data[0];

  // Log audit trail
  if (canceled) {
    try {
      await createMovimiento({
        tipo: 'DEUDA_CANCELADA',
        descripcion: `Deuda cancelada: "${canceled.descripcion}" (Monto total: $${canceled.monto_total.toLocaleString()}, Saldo pendiente: $${canceled.saldo_pendiente.toLocaleString()})`,
        entidad: 'deudas',
        entidad_id: canceled.id
      }, userId);
    } catch (logErr) {
      console.error('Error logging DEUDA_CANCELADA movement:', logErr);
    }
  }

  return data;
}

/**
 * Updates only the status field of a debt.
 * @param {string} id - Debt record ID.
 * @param {'activa' | 'pagada' | 'cancelada'} nuevoEstado - New debt status.
 * @param {string} userId - Auth user ID.
 */
export async function updateDeudaEstado(id, nuevoEstado, userId) {
  if (!userId) throw new Error('Usuario no autenticado.');

  // Fetch old debt details for rich logging
  let oldDeuda = null;
  try {
    const { data } = await supabase
      .from('deudas')
      .select('descripcion, estado, monto_total, saldo_pendiente')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    oldDeuda = data;
  } catch (fetchErr) {
    console.error('Error fetching old debt for status audit trail:', fetchErr);
  }

  const { data, error } = await supabase
    .from('deudas')
    .update({ estado: nuevoEstado })
    .eq('id', id)
    .eq('user_id', userId)
    .select();

  if (error) {
    console.error('Error updating debt status:', error);
    throw error;
  }

  const updated = data[0];

  // Log audit trail (differentiating manual transitions)
  try {
    let tipoMov = 'ESTADO_MODIFICADO';
    let description = `Estado de deuda "${updated.descripcion}" modificado de "${oldDeuda?.estado || 'desconocido'}" a "${nuevoEstado}"`;

    if (nuevoEstado === 'cancelada') {
      tipoMov = 'DEUDA_CANCELADA';
      description = `Deuda cancelada: "${updated.descripcion}" (Monto total: $${updated.monto_total.toLocaleString()}, Saldo pendiente: $${updated.saldo_pendiente.toLocaleString()})`;
    } else if (nuevoEstado === 'activa') {
      tipoMov = 'DEUDA_REACTIVADA';
      description = `Deuda reactivada: "${updated.descripcion}" (Saldo pendiente: $${updated.saldo_pendiente.toLocaleString()})`;
    } else if (nuevoEstado === 'pagada') {
      tipoMov = 'DEUDA_PAGADA_MANUAL';
      description = `Deuda pagada administrativamente (manual): "${updated.descripcion}"`;
    }

    await createMovimiento({
      tipo: tipoMov,
      descripcion: description,
      entidad: 'deudas',
      entidad_id: updated.id
    }, userId);
  } catch (logErr) {
    console.error('Error logging update status movement:', logErr);
  }

  return updated;
}
