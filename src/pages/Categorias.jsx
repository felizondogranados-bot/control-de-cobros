import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCategorias } from '../contexts/CategoriasContext';
import { getClientes } from '../services/clientesService';
import CategoriaForm from '../components/ui/CategoriaForm';

/**
 * Categorias Page
 * 
 * - Lists, searches, and manages categories.
 * - Displays category details: name (colored), system vs custom, active status, and client usage counts.
 * - Handles CRUD modals, confirm deletions, loading, success/error banners.
 * - Enforces restrictions (system categories cannot be edited/deleted, categories with clients cannot be deleted).
 */
function Categorias() {
  const { user } = useAuth();
  const { 
    categorias, 
    loading: loadingCategorias, 
    crearCategoria, 
    editarCategoria, 
    eliminarCategoria 
  } = useCategorias();

  // Associated clients state to compute client count per category
  const [clientes, setClientes] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // UI state management
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState(null);
  const [deletingCategoria, setDeletingCategoria] = useState(null);
  const [alert, setAlert] = useState(null); // { type: 'success' | 'error', message: '' }

  // Load clients to calculate counts locally
  const loadClientes = async () => {
    if (!user) return;
    setLoadingClientes(true);
    try {
      const fetchedClientes = await getClientes(user.id);
      setClientes(fetchedClientes);
    } catch (err) {
      console.error('Error loading clients for category counts:', err);
    } finally {
      setLoadingClientes(false);
    }
  };

  useEffect(() => {
    loadClientes();
  }, [user]);

  // Alert helper
  const triggerAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => {
      setAlert(null);
    }, 5000);
  };

  // Form submit handler
  const handleFormSubmit = async (formData) => {
    try {
      if (editingCategoria) {
        await editarCategoria(editingCategoria.id, formData);
        triggerAlert('success', `Categoría "${formData.nombre}" actualizada con éxito.`);
      } else {
        await crearCategoria(formData);
        triggerAlert('success', `Categoría "${formData.nombre}" creada con éxito.`);
      }
      setShowFormModal(false);
      setEditingCategoria(null);
    } catch (err) {
      console.error('Error saving category:', err);
      throw err; // propagates to CategoriaForm to show the error message inside the modal
    }
  };

  // Delete category confirmation handler
  const handleConfirmDelete = async () => {
    if (!deletingCategoria) return;

    // Double check client association count
    const associatedCount = clientes.filter(
      (c) => c.categoria_id === deletingCategoria.id
    ).length;

    if (associatedCount > 0) {
      triggerAlert(
        'error',
        'Esta categoría está siendo utilizada por uno o más clientes. Debe reasignar esos clientes antes de eliminarla.'
      );
      setDeletingCategoria(null);
      return;
    }

    try {
      await eliminarCategoria(deletingCategoria.id);
      triggerAlert('success', `La categoría "${deletingCategoria.nombre}" fue eliminada.`);
    } catch (err) {
      console.error('Error deleting category:', err);
      triggerAlert('error', err.message || 'No se pudo eliminar la categoría.');
    } finally {
      setDeletingCategoria(null);
    }
  };

  const handleEditClick = (cat) => {
    if (cat.user_id === null) {
      triggerAlert('error', 'Las categorías globales del sistema no se pueden editar.');
      return;
    }
    setEditingCategoria(cat);
    setShowFormModal(true);
  };

  const handleDeleteClick = (cat) => {
    if (cat.user_id === null) {
      triggerAlert('error', 'Las categorías globales del sistema no se pueden eliminar.');
      return;
    }
    
    // Check if category has clients and block immediately
    const associatedCount = clientes.filter((c) => c.categoria_id === cat.id).length;
    if (associatedCount > 0) {
      triggerAlert(
        'error',
        'Esta categoría está siendo utilizada por uno o más clientes. Debe reasignar esos clientes antes de eliminarla.'
      );
      return;
    }

    setDeletingCategoria(cat);
  };

  // Filter categories by search query
  const filteredCategorias = categorias.filter((cat) =>
    cat.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getClientCount = (catId) => {
    return clientes.filter((c) => c.categoria_id === catId).length;
  };

  const isLoading = loadingCategorias || (loadingClientes && clientes.length === 0);

  return (
    <div className="space-y-6">
      {/* Alert Banners */}
      {alert && (
        <div
          className={`p-4 rounded-xl border-l-4 font-medium text-sm animate-fade-in ${
            alert.type === 'success'
              ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
              : 'bg-rose-50 border-rose-600 text-rose-800'
          }`}
        >
          {alert.type === 'success' ? '✅' : '⚠️'} {alert.message}
        </div>
      )}

      {/* Top Filter and Actions Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-brand-white border border-slate-200 p-5 rounded-2xl shadow-premium">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-md">
          {/* Search box */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Buscar categoría por nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-4 pr-10 w-full"
            />
          </div>
        </div>

        {/* Create action */}
        <button
          onClick={() => {
            setEditingCategoria(null);
            setShowFormModal(true);
          }}
          className="btn-primary shrink-0 self-start md:self-auto flex items-center gap-1.5"
        >
          ➕ Nueva Categoría
        </button>
      </div>

      {/* Main List Workspace */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-brand-white border border-slate-200 rounded-2xl shadow-premium min-h-[300px]">
          <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 text-sm mt-4 font-semibold">Cargando categorías...</span>
        </div>
      ) : filteredCategorias.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-brand-white border border-slate-200 rounded-2xl shadow-premium min-h-[300px] text-center">
          <div className="text-slate-300 text-5xl mb-4 select-none">📂</div>
          <h4 className="font-bold text-lg text-brand-gray-dark">No se encontraron categorías</h4>
          <p className="text-sm text-slate-400 mt-1 max-w-sm">
            {categorias.length === 0
              ? 'Crea tu primera categoría personalizada presionando "+ Nueva Categoría".'
              : 'Ajusta tu término de búsqueda e intenta de nuevo.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden border border-slate-200 rounded-2xl bg-brand-white shadow-premium">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th className="text-center">Clientes Asociados</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCategorias.map((cat) => {
                  const clientCount = getClientCount(cat.id);
                  const isSystem = cat.user_id === null;
                  
                  // Premium category color badge style
                  const colorBadgeStyle = cat.color
                    ? {
                        backgroundColor: `${cat.color}15`,
                        color: cat.color,
                        borderColor: `${cat.color}30`,
                        borderWidth: '1px'
                      }
                    : {
                        backgroundColor: '#64748b15',
                        color: '#64748b',
                        borderColor: '#64748b30',
                        borderWidth: '1px'
                      };

                  return (
                    <tr key={cat.id} className="hover:bg-slate-50/50 transition-all duration-150">
                      {/* Name with Dynamic Color Badge */}
                      <td className="font-semibold text-brand-gray-dark">
                        <div className="flex items-center gap-2.5">
                          {cat.color ? (
                            <span 
                              className="w-3.5 h-3.5 rounded-full border shadow-sm shrink-0" 
                              style={{ backgroundColor: cat.color, borderColor: `${cat.color}40` }}
                            />
                          ) : (
                            <span className="w-3.5 h-3.5 rounded-full border border-slate-300 bg-slate-100 shrink-0" />
                          )}
                          <span 
                            className="px-2 py-0.5 rounded-md text-sm font-bold"
                            style={colorBadgeStyle}
                          >
                            {cat.nombre}
                          </span>
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td>
                        {isSystem ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-brand-blue border border-blue-100">
                            ⚙️ Sistema
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-purple-50 text-purple-700 border border-purple-100">
                            👤 Personalizada
                          </span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td>
                        {cat.estado === 'inactiva' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                            Inactiva
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Activa
                          </span>
                        )}
                      </td>

                      {/* Associated Clients count */}
                      <td className="text-center font-mono font-bold text-slate-600 text-sm">
                        {loadingClientes ? (
                          <span className="text-xs text-slate-400">...</span>
                        ) : (
                          clientCount
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="text-right whitespace-nowrap text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEditClick(cat)}
                            className={`px-2.5 py-1 text-xs font-semibold rounded transition-all ${
                              isSystem
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-brand-blue hover:bg-brand-blue/5'
                            }`}
                            disabled={isSystem}
                            title={isSystem ? 'No se pueden editar categorías del sistema' : 'Editar categoría'}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteClick(cat)}
                            className={`px-2.5 py-1 text-xs font-semibold rounded transition-all ${
                              isSystem
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-rose-600 hover:bg-rose-55/5'
                            }`}
                            disabled={isSystem}
                            title={isSystem ? 'No se pueden eliminar categorías del sistema' : 'Eliminar categoría'}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal Form */}
      {showFormModal && (
        <CategoriaForm
          initialData={editingCategoria}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowFormModal(false);
            setEditingCategoria(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingCategoria && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-brand-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-brand-gray-dark mb-2">
              Confirmar Eliminación
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              ¿Estás seguro de que deseas eliminar permanentemente la categoría{' '}
              <strong className="text-brand-gray-dark">
                {deletingCategoria.nombre}
              </strong>
              ? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingCategoria(null)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="btn-danger"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Categorias;
