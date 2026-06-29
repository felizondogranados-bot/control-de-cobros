import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { CategoriasProvider } from './contexts/CategoriasContext';
import AppRouter from './routes/AppRouter';

/**
 * App Component
 * 
 * - Envelopes the route handlers inside the Auth and Categorias Contexts.
 * - Delegate navigation management completely to React Router.
 */
function App() {
  return (
    <AuthProvider>
      <CategoriasProvider>
        <AppRouter />
      </CategoriasProvider>
    </AuthProvider>
  );
}

export default App;
