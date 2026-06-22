import { supabase } from './supabase';

/**
 * Movimientos (Audit Trails) Service
 * 
 * Scalability Design:
 * - Multi-tenant isolation: enforces `user_id` query scoping.
 * - Centralizes historical log movements for audit and tracking.
 */

/**
 * Creates a new audit log record.
 * 
 * @param {object} movimiento - Movement fields (tipo, descripcion, entidad, entidad_id).
 * @param {string} userId - Auth user ID.
 * @returns {Promise<object>} Created movement record.
 */
export async function createMovimiento({ tipo, descripcion, entidad, entidad_id }, userId) {
  if (!userId) throw new Error('Usuario no autenticado.');

  const payload = {
    user_id: userId,
    tipo,
    descripcion: descripcion.trim(),
    entidad,
    entidad_id: entidad_id || null
  };

  const { data, error } = await supabase
    .from('movimientos')
    .insert([payload])
    .select();

  if (error) {
    console.error('Error creating movement log:', error);
    throw error;
  }

  return data[0];
}

/**
 * Fetches all audit movements for a user.
 * 
 * @param {string} userId - Auth user ID.
 * @returns {Promise<Array>} Historical movements sorted by date descending.
 */
export async function getMovimientos(userId) {
  if (!userId) throw new Error('Usuario no autenticado.');

  const { data, error } = await supabase
    .from('movimientos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }

  return data;
}

/**
 * Fetches audit logs relating to a specific entity.
 * 
 * @param {string} entidad - Entity name (e.g. 'clientes', 'deudas', 'pagos').
 * @param {string} entidadId - Primary key UUID of the entity.
 * @param {string} userId - Auth user ID.
 * @returns {Promise<Array>} List of related historical movements.
 */
export async function getMovimientosByEntidad(entidad, entidadId, userId) {
  if (!userId) throw new Error('Usuario no autenticado.');

  const { data, error } = await supabase
    .from('movimientos')
    .select('*')
    .eq('user_id', userId)
    .eq('entidad', entidad)
    .eq('entidad_id', entidadId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching movements by entity:', error);
    throw error;
  }

  return data;
}
