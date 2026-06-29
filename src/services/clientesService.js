import { supabase } from './supabase';
import { createMovimiento } from './movimientosService';
import { getCategorias as fetchCategorias } from './categoriasService';

/**
 * Clientes Service
 * 
 * Scalability Design:
 * - Multi-tenant isolation: every operation requires a `userId` parameter to match and enforce user scoping.
 * - Handles join mapping between 'clientes' and 'categorias'.
 */

/**
 * Fetches all clients for the authenticated user, including their category details.
 * @param {string} userId - Auth user ID.
 */
export async function getClientes(userId) {
  if (!userId) throw new Error('Usuario no autenticado.');

  const { data, error } = await supabase
    .from('clientes')
    .select('*, categorias(nombre)')
    .eq('user_id', userId)
    .order('nombre', { ascending: true });

  if (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }

  // Normalizes the joined category name
  return data.map(cliente => ({
    ...cliente,
    categoria_nombre: cliente.categorias?.nombre || 'Sin categoría'
  }));
}

/**
 * Creates a new client record.
 * @param {object} cliente - Client input fields (nombre, apellido, telefono, categoria_id).
 * @param {string} userId - Auth user ID.
 */
export async function createCliente(cliente, userId) {
  if (!userId) throw new Error('Usuario no autenticado.');

  const clientData = {
    user_id: userId,
    nombre: cliente.nombre.trim(),
    apellido: cliente.apellido?.trim() || '',
    telefono: cliente.telefono.trim(),
    categoria_id: cliente.categoria_id || null,
    estado_cliente: 'activo', // Defaults to 'activo'
  };

  const { data, error } = await supabase
    .from('clientes')
    .insert([clientData])
    .select();

  if (error) {
    console.error('Error creating client:', error);
    throw error;
  }

  const inserted = data[0];

  // Log audit trail
  try {
    await createMovimiento({
      tipo: 'CLIENTE_CREADO',
      descripcion: `Cliente creado: ${inserted.nombre} ${inserted.apellido || ''} (Teléfono: ${inserted.telefono})`.trim(),
      entidad: 'clientes',
      entidad_id: inserted.id
    }, userId);
  } catch (logErr) {
    console.error('Error logging CLIENTE_CREADO movement:', logErr);
  }

  return inserted;
}

/**
 * Updates an existing client record.
 * @param {string} id - Client record ID.
 * @param {object} clientData - Updated fields.
 * @param {string} userId - Auth user ID.
 */
export async function updateCliente(id, clientData, userId) {
  if (!userId) throw new Error('Usuario no autenticado.');

  // Fetch old client details for audit trail comparison
  let oldClient = null;
  try {
    const { data } = await supabase
      .from('clientes')
      .select('nombre, apellido, telefono')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    oldClient = data;
  } catch (fetchErr) {
    console.error('Error fetching client details for audit trail:', fetchErr);
  }

  const cleanData = {
    nombre: clientData.nombre.trim(),
    apellido: clientData.apellido?.trim() || '',
    telefono: clientData.telefono.trim(),
    categoria_id: clientData.categoria_id || null,
    estado_cliente: clientData.estado_cliente || 'activo',
  };

  const { data, error } = await supabase
    .from('clientes')
    .update(cleanData)
    .eq('id', id)
    .eq('user_id', userId)
    .select();

  if (error) {
    console.error('Error updating client:', error);
    throw error;
  }

  const updated = data[0];

  // Log audit trail
  try {
    const clientChanges = [];
    if (oldClient) {
      const oldFullName = `${oldClient.nombre} ${oldClient.apellido || ''}`.trim();
      const newFullName = `${updated.nombre} ${updated.apellido || ''}`.trim();
      if (oldFullName !== newFullName) {
        clientChanges.push(`Nombre: "${oldFullName}" -> "${newFullName}"`);
      }
      if (oldClient.telefono !== updated.telefono) {
        clientChanges.push(`Teléfono: ${oldClient.telefono} -> ${updated.telefono}`);
      }
    }
    const description = `Cliente editado: "${updated.nombre} ${updated.apellido || ''}".${clientChanges.length > 0 ? ' Cambios: ' + clientChanges.join(', ') : ' Sin cambios de nombre o teléfono.'}`;

    await createMovimiento({
      tipo: 'CLIENTE_EDITADO',
      descripcion,
      entidad: 'clientes',
      entidad_id: updated.id
    }, userId);
  } catch (logErr) {
    console.error('Error logging CLIENTE_EDITADO movement:', logErr);
  }

  return updated;
}

/**
 * Deletes a client record.
 * @param {string} id - Client record ID.
 * @param {string} userId - Auth user ID.
 */
export async function deleteCliente(id, userId) {
  if (!userId) throw new Error('Usuario no autenticado.');

  const { data, error } = await supabase
    .from('clientes')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select();

  if (error) {
    console.error('Error deleting client:', error);
    throw error;
  }

  const deleted = data[0];

  // Log audit trail
  if (deleted) {
    try {
      await createMovimiento({
        tipo: 'CLIENTE_ELIMINADO',
        descripcion: `Cliente eliminado: ${deleted.nombre} ${deleted.apellido || ''} (Teléfono: ${deleted.telefono})`.trim(),
        entidad: 'clientes',
        entidad_id: deleted.id
      }, userId);
    } catch (logErr) {
      console.error('Error logging CLIENTE_ELIMINADO movement:', logErr);
    }
  }

  return data;
}

/**
 * Fetches categories available to the user from the 'categorias' table.
 * Fetches global categories (user_id is null) and custom categories (user_id = userId).
 * @param {string} userId - Auth user ID.
 */
export async function getCategorias(userId) {
  return fetchCategorias(userId);
}
