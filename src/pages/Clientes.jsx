import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  getClientes, 
  createCliente, 
  updateCliente, 
  deleteCliente
} from '../services/clientesService';
import { useCategorias } from '../contexts/CategoriasContext';
import ClienteForm from '../components/ui/ClienteForm';

/**
 * Clientes Page
 * 
 * - Lists, searches, and filters clients by category.
 * - Handles CRUD modals, confirm deletions, loading, success/error banners.
 * - Restricts actions based on the authenticated user.
 */
function Clientes() {
  const { user } = useAuth();
  const { categorias, loading: loadingCategorias } = useCategorias();

  // Data states
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter/Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // UI state management
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [deletingCliente, setDeletingCliente] = useState(null);

  // Alert banners
  const [alert, setAlert] = useState(null); // { type: 'success' | 'error', message: '' }

  // Load clients
  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    setAlert(null);
    try {
      const fetchedClientes = await getClientes(user.id);
      setClientes(fetchedClientes);
    } catch (err) {
      console.error('Error loading page data:', err);
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

  // Alert auto-cleanup helper
  const triggerAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => {
      setAlert(null);
    }, 5000);
  };

  // Create or Update handler passed to ClienteForm
  const handleFormSubmit = async (formData) => {
    try {
      if (editingCliente) {
        // Edit mode
        const updated = await updateCliente(editingCliente.id, formData, user.id);
        
        // Find corresponding category name local update
        const categoryObj = categorias.find(c => c.id === formData.categoria_id);
        const mappedUpdated = {
          ...updated,
          categoria_nombre: categoryObj ? categoryObj.nombre : 'Sin categoría'
        };

        setClientes(prev => prev.map(c => c.id === editingCliente.id ? mappedUpdated : c));
        triggerAlert('success', `Cliente "${formData.nombre}" actualizado con éxito.`);
      } else {
        // Create mode
        const newClient = await createCliente(formData, user.id);
        
        // Local state mapping
        const categoryObj = categorias.find(c => c.id === formData.categoria_id);
        const mappedNew = {
          ...newClient,
          categoria_nombre: categoryObj ? categoryObj.nombre : 'Sin categoría'
        };

        setClientes(prev => [mappedNew, ...prev]);
        triggerAlert('success', `Cliente "${formData.nombre}" registrado con éxito.`);
      }
      setShowFormModal(false);
      setEditingCliente(null);
    } catch (err) {
      console.error('Error saving client:', err);
      throw err; // propagates to let the form modal display the error locally
    }
  };

  // Delete execution handler
  const handleConfirmDelete = async () => {
    if (!deletingCliente) return;
    try {
      await deleteCliente(deletingCliente.id, user.id);
      setClientes(prev => prev.filter(c => c.id !== deletingCliente.id));
      triggerAlert('success', `El cliente "${deletingCliente.nombre}" fue eliminado.`);
    } catch (err) {
      console.error('Error deleting client:', err);
      triggerAlert('error', err.message || 'No se pudo eliminar el cliente.');
    } finally {
      setDeletingCliente(null);
    }
  };

  const handleEditClick = (cliente) => {
    setEditingCliente(cliente);
    setShowFormModal(true);
  };

  const handleDeleteClick = (cliente) => {
    setDeletingCliente(cliente);
  };

  // Helper to retrieve category details from cache
  const getClienteCategoriaInfo = (categoriaId) => {
    if (!categoriaId) return null;
    return categorias.find((c) => c.id === categoriaId);
  };

  // Filter clients locally for real-time reactivity
  const filteredClientes = clientes.filter(cliente => {
    const fullName = `${cliente.nombre} ${cliente.apellido || ''}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || 
                          cliente.telefono.includes(searchQuery);
    
    // Category ID is a UUID string, match directly without Number() conversion
    const matchesCategory = selectedCategory === '' || 
                            cliente.categoria_id === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Alert Banners */}
      {alert && (
        <div className={`p-4 rounded-xl border-l-4 font-medium text-sm animate-fade-in ${
          alert.type === 'success' 
            ? 'bg-emerald-50 border-emerald-600 text-emerald-800' 
            : 'bg-rose-50 border-rose-600 text-rose-800'
        }`}>
          {alert.type === 'success' ? '✅' : '⚠️'} {alert.message}
        </div>
      )}

      {/* Top Filter and Actions Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-brand-white border border-slate-200 p-5 rounded-2xl shadow-premium">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-2xl">
          {/* Search box */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Buscar cliente por nombre o teléfono..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-4 pr-10"
            />
          </div>
          
          {/* Category Dropdown */}
          <div className="w-full sm:w-60">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Create action */}
        <button
          onClick={() => {
            setEditingCliente(null);
            setShowFormModal(true);
          }}
          className="btn-primary shrink-0 self-start md:self-auto"
        >
          ➕ Nuevo Cliente
        </button>
      </div>

      {/* Main List Workspace */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-brand-white border border-slate-200 rounded-2xl shadow-premium min-h-[300px]">
          <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 text-sm mt-4 font-semibold">Cargando clientes de Supabase...</span>
        </div>
      ) : filteredClientes.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-brand-white border border-slate-200 rounded-2xl shadow-premium min-h-[300px] text-center">
          <div className="text-slate-300 text-5xl mb-4 select-none">👥</div>
          <h4 className="font-bold text-lg text-brand-gray-dark">No se encontraron clientes</h4>
          <p className="text-sm text-slate-400 mt-1 max-w-sm">
            {clientes.length === 0 
              ? 'Comienza a agregar clientes a tu cartera de cobro presionando "+ Nuevo Cliente".' 
              : 'Intenta ajustar tus criterios de búsqueda o cambia la categoría filtrada.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden border border-slate-200 rounded-2xl bg-brand-white shadow-premium">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Apellido</th>
                  <th>Teléfono</th>
                  <th>Categoría</th>
                  <th className="text-center">Deudas</th>
                  <th>Estado</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClientes.map((cliente) => {
                  const catInfo = getClienteCategoriaInfo(cliente.categoria_id);
                  const badgeStyle = catInfo?.color
                    ? {
                        backgroundColor: `${catInfo.color}15`,
                        color: catInfo.color,
                        borderColor: `${catInfo.color}30`,
                        borderWidth: '1px'
                      }
                    : {
                        backgroundColor: '#64748b15',
                        color: '#64748b',
                        borderColor: '#64748b30',
                        borderWidth: '1px'
                      };

                  return (
                    <tr key={cliente.id}>
                      <td className="font-semibold text-brand-gray-dark">
                        {cliente.nombre}
                      </td>
                      <td>
                        {cliente.apellido || <span className="text-slate-300">-</span>}
                      </td>
                      <td className="font-mono text-xs">
                        {cliente.telefono}
                      </td>
                      <td>
                        {cliente.categoria_id && catInfo ? (
                          <span 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                            style={badgeStyle}
                          >
                            {catInfo.nombre}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs font-medium">
                            Sin categoría
                          </span>
                        )}
                      </td>
                      <td className="text-center font-mono text-slate-400 text-xs">
                        -
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold uppercase ${
                          cliente.estado_cliente === 'activo'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {cliente.estado_cliente}
                        </span>
                      </td>
                      <td className="text-right whitespace-nowrap text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEditClick(cliente)}
                            className="px-2.5 py-1 text-xs font-semibold text-brand-blue hover:bg-brand-blue/5 rounded transition-all"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteClick(cliente)}
                            className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded transition-all"
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
        <ClienteForm
          initialData={editingCliente}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowFormModal(false);
            setEditingCliente(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingCliente && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-brand-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-brand-gray-dark mb-2">
              Confirmar Eliminación
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              ¿Estás seguro de que deseas eliminar permanentemente al cliente{' '}
              <strong className="text-brand-gray-dark">
                {deletingCliente.nombre} {deletingCliente.apellido || ''}
              </strong>
              ? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingCliente(null)}
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

export default Clientes;
