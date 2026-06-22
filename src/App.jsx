import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import AppRouter from './routes/AppRouter';

/**
 * App Component
 * 
 * - Envelopes the route handlers inside the Auth Context.
 * - Delegate navigation management completely to React Router.
 */
function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
