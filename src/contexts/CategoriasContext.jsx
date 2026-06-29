import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import * as categoriasService from '../services/categoriasService';

/**
 * Categorias Context
 * 
 * Scalability Design:
 * - Caches visible categories (global + user-owned) in memory to avoid duplicate requests.
 * - Exposes methods to create, update, and delete categories.
 * - Automatically initializes/invalidates the cache on auth state changes.
 */
const CategoriasContext = createContext(null);

export function CategoriasProvider({ children }) {
  const { user } = useAuth();
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshCategorias = async () => {
    if (!user) {
      setCategorias([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await categoriasService.getCategorias(user.id);
      setCategorias(data);
    } catch (err) {
      console.error('Error refreshing categories context:', err);
      setError(err.message || 'Error al cargar las categorías.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCategorias();
  }, [user]);

  const crearCategoria = async (categoriaData) => {
    if (!user) throw new Error('Usuario no autenticado.');
    setError(null);
    try {
      const newCat = await categoriasService.createCategoria(categoriaData, user.id);
      await refreshCategorias();
      return newCat;
    } catch (err) {
      console.error('Error creating category in context:', err);
      throw err;
    }
  };

  const editarCategoria = async (id, categoriaData) => {
    if (!user) throw new Error('Usuario no autenticado.');
    setError(null);
    try {
      const updatedCat = await categoriasService.updateCategoria(id, categoriaData, user.id);
      await refreshCategorias();
      return updatedCat;
    } catch (err) {
      console.error('Error updating category in context:', err);
      throw err;
    }
  };

  const eliminarCategoria = async (id) => {
    if (!user) throw new Error('Usuario no autenticado.');
    setError(null);
    try {
      const deleted = await categoriasService.deleteCategoria(id, user.id);
      await refreshCategorias();
      return deleted;
    } catch (err) {
      console.error('Error deleting category in context:', err);
      throw err;
    }
  };

  const value = {
    categorias,
    loading,
    error,
    refreshCategorias,
    crearCategoria,
    editarCategoria,
    eliminarCategoria
  };

  return (
    <CategoriasContext.Provider value={value}>
      {children}
    </CategoriasContext.Provider>
  );
}

export function useCategorias() {
  const context = useContext(CategoriasContext);
  if (!context) {
    throw new Error('useCategorias must be used within a CategoriasProvider');
  }
  return context;
}
