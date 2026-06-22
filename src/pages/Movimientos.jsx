import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getMovimientos } from '../services/movimientosService';

/**
 * Movimientos Component (Audit Bitacora)
 * 
 * - Lists all logged operations sequentially (newest first).
 * - Implements entity category tab filters: Todos, Clientes, Deudas, Pagos.
 * - Text search bar matches description text or status names.
 */
function Movimientos() {
  const { user } = useAuth();

  // Data states
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('todos'); // 'todos', 'clientes', 'deudas', 'pagos'

  const loadMovimientos = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getMovimientos(user.id);
      setMovimientos(data);
    } catch (err) {
      console.error('Error loading audit log page:', err);
      setError(err.message || 'Error al conectar con la base de datos de auditoría.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovimientos();
  }, [user]);

  // Local filter mapping
  const filtered = movimientos.filter((mov) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      mov.descripcion.toLowerCase().includes(searchLower) ||
      mov.tipo.toLowerCase().includes(searchLower) ||
      mov.entidad.toLowerCase().includes(searchLower);

    let matchesType = false;
    if (selectedTab === 'clientes') {
      matchesType = mov.entidad === 'clientes';
    } else if (selectedTab === 'deudas') {
      matchesType = mov.entidad === 'deudas';
    } else if (selectedTab === 'pagos') {
      matchesType = mov.entidad === 'pagos';
    } else {
      matchesType = true; // Todos
    }

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title section */}
      <div>
        <h1 className="text-2xl font-extrabold text-brand-gray-dark tracking-tight mb-1">
          Bitácora de Movimientos
        </h1>
        <p className="text-slate-400 text-xs font-semibold">
          Historial completo de auditoría y acciones realizadas en el sistema.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-600 text-rose-800 rounded-r-xl font-medium text-sm">
          ⚠️ {error}
          <button 
            onClick={loadMovimientos} 
            className="ml-4 underline text-rose-950 font-bold hover:text-rose-700 block sm:inline mt-2"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Filter Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-brand-white border border-slate-200 p-5 rounded-2xl shadow-premium">
        {/* Status Tab buttons */}
        <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 self-start">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'clientes', label: 'Clientes' },
            { id: 'deudas', label: 'Deudas' },
            { id: 'pagos', label: 'Pagos' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                selectedTab === tab.id
                  ? 'bg-brand-white text-brand-gray-dark shadow-sm'
                  : 'text-slate-500 hover:text-brand-gray-dark'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-xl w-full">
          {/* Search bar */}
          <input
            type="text"
            placeholder="Buscar por cliente, descripción o tipo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

      {/* Main List Workspace */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-brand-white border border-slate-200 rounded-2xl shadow-premium min-h-[300px]">
          <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 text-sm mt-4 font-semibold">Cargando bitácora de Supabase...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-brand-white border border-slate-200 rounded-2xl shadow-premium min-h-[300px] text-center">
          <div className="text-slate-300 text-5xl mb-4 select-none">📜</div>
          <h4 className="font-bold text-lg text-brand-gray-dark">No se encontraron movimientos</h4>
          <p className="text-sm text-slate-400 mt-1 max-w-sm">
            {movimientos.length === 0 
              ? 'No hay registros de auditoría guardados todavía en tu cuenta.' 
              : 'Intenta ajustar tus criterios de búsqueda o filtros de entidad.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden border border-slate-200 rounded-2xl bg-brand-white shadow-premium">
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
                {filtered.map((mov) => (
                  <tr key={mov.id}>
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
                    <td className="text-xs text-slate-700 font-medium whitespace-normal max-w-lg leading-relaxed">
                      {mov.descripcion}
                    </td>
                    <td>
                      <span className="capitalize text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {mov.entidad}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Movimientos;
