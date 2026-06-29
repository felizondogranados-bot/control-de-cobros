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
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import Alert from '../components/ui/Alert';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';
import Modal from '../components/ui/Modal';
import { Search, Plus, Edit2, Trash2, Users } from 'lucide-react';

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
      throw err;
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
    
    const matchesCategory = selectedCategory === '' || 
                            cliente.categoria_id === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 fade-in-up">
      {/* Alert Banners */}
      {alert && (
        <Alert type={alert.type} onClose={() => setAlert(null)}>
          {alert.message}
        </Alert>
      )}

      {/* Top Filter and Actions Row */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 bg-white border border-linen p-6 rounded-3xl shadow-soft">
        <div className="flex flex-col sm:flex-row gap-4 flex-1 max-w-3xl">
          {/* Search box */}
          <div className="flex-1">
            <Input
              id="search"
              label="Buscar Cliente"
              type="text"
              placeholder="Buscar por nombre o teléfono..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Category Dropdown */}
          <div className="w-full sm:w-64">
            <Select
              id="category"
              label="Filtrar por Grupo"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Todos los grupos</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Create action */}
        <Button
          onClick={() => {
            setEditingCliente(null);
            setShowFormModal(true);
          }}
          variant="primary"
          className="shrink-0 w-full lg:w-auto"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Cliente</span>
        </Button>
      </div>

      {/* Main List Workspace */}
      {loading ? (
        <Card className="flex flex-col items-center justify-center min-h-[300px]">
          <LoadingState message="Cargando clientes..." />
        </Card>
      ) : filteredClientes.length === 0 ? (
        <EmptyState
          title="No se encontraron clientes"
          description={
            clientes.length === 0 
              ? 'Comienza a agregar clientes a tu cartera de cobro presionando el botón "Nuevo Cliente".' 
              : 'Intenta ajustar tus criterios de búsqueda o cambia la categoría filtrada.'
          }
          icon={<Users className="w-8 h-8 text-moss" />}
          actionText={clientes.length === 0 ? "Nuevo Cliente" : null}
          onAction={clientes.length === 0 ? () => {
            setEditingCliente(null);
            setShowFormModal(true);
          } : null}
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-6 py-4">Nombre</th>
                  <th className="px-6 py-4">Apellido</th>
                  <th className="px-6 py-4">Teléfono</th>
                  <th className="px-6 py-4">Grupo</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
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
                    <tr key={cliente.id} className="hover:bg-linen-light/30 transition-colors">
                      <td className="px-6 py-5 font-semibold text-brand-gray-dark text-base">
                        {cliente.nombre}
                      </td>
                      <td className="px-6 py-5 text-base text-slate-700">
                        {cliente.apellido || <span className="text-slate-300">-</span>}
                      </td>
                      <td className="px-6 py-5 font-mono text-sm text-slate-600">
                        {cliente.telefono}
                      </td>
                      <td className="px-6 py-5">
                        {cliente.categoria_id && catInfo ? (
                          <span 
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border"
                            style={badgeStyle}
                          >
                            {catInfo.nombre}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-sm font-medium">
                            Sin grupo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <Badge variant={cliente.estado_cliente === 'activo' ? 'success' : 'info'}>
                          {cliente.estado_cliente === 'activo' ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="px-6 py-5 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEditClick(cliente)}
                            className="p-2.5 text-moss-dark hover:bg-moss/10 rounded-xl transition-all cursor-pointer min-w-[38px] min-h-[38px] inline-flex items-center justify-center border border-transparent hover:border-moss/20"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(cliente)}
                            className="p-2.5 text-rose-dark hover:bg-rose-light rounded-xl transition-all cursor-pointer min-w-[38px] min-h-[38px] inline-flex items-center justify-center border border-transparent hover:border-rose/30"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
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
      <Modal
        isOpen={!!deletingCliente}
        onClose={() => setDeletingCliente(null)}
        title="Confirmar Eliminación"
      >
        <p className="text-base text-slate-500 mb-6">
          ¿Estás seguro de que deseas eliminar permanentemente al cliente{' '}
          <strong className="text-brand-gray-dark">
            {deletingCliente?.nombre} {deletingCliente?.apellido || ''}
          </strong>
          ? Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-3 pt-4 border-t border-linen/50">
          <Button
            type="button"
            onClick={() => setDeletingCliente(null)}
            variant="secondary"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirmDelete}
            variant="danger"
          >
            Sí, Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default Clientes;
