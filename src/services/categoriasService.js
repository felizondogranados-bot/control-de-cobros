import { supabase } from './supabase';
import { createMovimiento } from './movimientosService';

/**
 * Categorias Service
 * 
 * Multi-tenant isolation & system category management:
 * - Read scope includes global categories (user_id IS NULL) and user categories (user_id = userId).
 * - Mutation scopes (create, update, delete) are strictly limited to user-owned categories.
 * - Validates name uniqueness case-insensitively.
 * - Enforces deletion prevention if clients are associated with a category.
 */

/**
 * Fetches all categories available to the user (global + custom).
 * @param {string} userId - Auth user ID.
 */
export async function getCategorias(userId) {
  if (!userId) throw new Error('Usuario no autenticado.');

  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .order('nombre', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }

  return data;
}

/**
 * Creates a new custom category.
 * @param {object} param0 - Category fields (nombre, color, estado).
 * @param {string} userId - Auth user ID.
 */
export async function createCategoria({ nombre, color, estado = 'activa' }, userId) {
  if (!userId) throw new Error('Usuario no autenticado.');

  const cleanNombre = nombre.trim();
  if (!cleanNombre) {
    throw new Error('El nombre de la categoría es obligatorio.');
  }

  // Case-insensitive uniqueness check among all visible categories
  const allCategories = await getCategorias(userId);
  const exists = allCategories.some(
    (cat) => cat.nombre.toLowerCase() === cleanNombre.toLowerCase()
  );
  if (exists) {
    throw new Error(`Ya existe una categoría con el nombre "${cleanNombre}".`);
  }

  const categoryData = {
    user_id: userId,
    nombre: cleanNombre,
    color: color?.trim() || null,
    estado: estado
  };

  const { data, error } = await supabase
    .from('categorias')
    .insert([categoryData])
    .select();

  if (error) {
    console.error('Error creating category:', error);
    throw error;
  }

  const inserted = data[0];

  // Log audit trail
  try {
    await createMovimiento({
      tipo: 'CATEGORIA_CREADA',
      descripcion: `Categoría creada: "${inserted.nombre}" (Color: ${inserted.color || 'Ninguno'}, Estado: ${inserted.estado})`,
      entidad: 'categorias',
      entidad_id: inserted.id
    }, userId);
  } catch (logErr) {
    console.error('Error logging CATEGORIA_CREADA movement:', logErr);
  }

  return inserted;
}

/**
 * Updates an existing custom category.
 * @param {string} id - Category UUID.
 * @param {object} fields - Updated fields (nombre, color, estado).
 * @param {string} userId - Auth user ID.
 */
export async function updateCategoria(id, { nombre, color, estado }, userId) {
  if (!userId) throw new Error('Usuario no autenticado.');

  const cleanNombre = nombre.trim();
  if (!cleanNombre) {
    throw new Error('El nombre de la categoría es obligatorio.');
  }

  // 1. Fetch current category to inspect ownership and construct audit log
  const { data: existing, error: fetchErr } = await supabase
    .from('categorias')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchErr || !existing) {
    throw new Error('La categoría no existe.');
  }

  if (existing.user_id === null) {
    throw new Error('No se pueden editar las categorías globales del sistema.');
  }

  if (existing.user_id !== userId) {
    throw new Error('No tienes permisos para editar esta categoría.');
  }

  // 2. Case-insensitive uniqueness check excluding current category
  const allCategories = await getCategorias(userId);
  const exists = allCategories.some(
    (cat) => cat.nombre.toLowerCase() === cleanNombre.toLowerCase() && cat.id !== id
  );
  if (exists) {
    throw new Error(`Ya existe otra categoría con el nombre "${cleanNombre}".`);
  }

  const cleanColor = color?.trim() || null;
  const updateData = {
    nombre: cleanNombre,
    color: cleanColor,
    estado: estado || 'activa'
  };

  const { data, error } = await supabase
    .from('categorias')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select();

  if (error) {
    console.error('Error updating category:', error);
    throw error;
  }

  const updated = data[0];

  // Log audit trail
  try {
    const changes = [];
    if (existing.nombre !== updated.nombre) {
      changes.push(`Nombre: "${existing.nombre}" -> "${updated.nombre}"`);
    }
    if (existing.color !== updated.color) {
      changes.push(`Color: "${existing.color || 'Ninguno'}" -> "${updated.color || 'Ninguno'}"`);
    }
    if (existing.estado !== updated.estado) {
      changes.push(`Estado: "${existing.estado}" -> "${updated.estado}"`);
    }

    const description = `Categoría editada: "${updated.nombre}".${changes.length > 0 ? ' Cambios: ' + changes.join(', ') : ' Sin cambios.'}`;

    await createMovimiento({
      tipo: 'CATEGORIA_EDITADA',
      descripcion,
      entidad: 'categorias',
      entidad_id: updated.id
    }, userId);
  } catch (logErr) {
    console.error('Error logging CATEGORIA_EDITADA movement:', logErr);
  }

  return updated;
}

/**
 * Deletes a custom category if it has no associated clients.
 * @param {string} id - Category UUID.
 * @param {string} userId - Auth user ID.
 */
export async function deleteCategoria(id, userId) {
  if (!userId) throw new Error('Usuario no autenticado.');

  // 1. Fetch to verify ownership
  const { data: existing, error: fetchErr } = await supabase
    .from('categorias')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchErr || !existing) {
    throw new Error('La categoría no existe.');
  }

  if (existing.user_id === null) {
    throw new Error('No se pueden eliminar las categorías globales del sistema.');
  }

  if (existing.user_id !== userId) {
    throw new Error('No tienes permisos para eliminar esta categoría.');
  }

  // 2. Prevent deletion if clients are using this category
  const hasClients = await categoriaTieneClientes(id);
  if (hasClients) {
    throw new Error('Esta categoría está siendo utilizada por uno o más clientes. Debe reasignar esos clientes antes de eliminarla.');
  }

  const { data, error } = await supabase
    .from('categorias')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select();

  if (error) {
    console.error('Error deleting category:', error);
    throw error;
  }

  // Log audit trail
  try {
    await createMovimiento({
      tipo: 'CATEGORIA_ELIMINADA',
      descripcion: `Categoría eliminada: "${existing.nombre}"`,
      entidad: 'categorias',
      entidad_id: id
    }, userId);
  } catch (logErr) {
    console.error('Error logging CATEGORIA_ELIMINADA movement:', logErr);
  }

  return data;
}

/**
 * Checks if any client uses the given category ID.
 * @param {string} id - Category ID.
 */
export async function categoriaTieneClientes(id) {
  const { count, error } = await supabase
    .from('clientes')
    .select('id', { count: 'exact', head: true })
    .eq('categoria_id', id);

  if (error) {
    console.error('Error checking if category has clients:', error);
    throw error;
  }

  return count > 0;
}
