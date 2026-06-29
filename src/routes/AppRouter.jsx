import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PublicRoute from './PublicRoute';
import PrivateRoute from './PrivateRoute';
import Layout from '../components/layout/Layout';

// Pages
import Dashboard from '../pages/Dashboard';
import Clientes from '../pages/Clientes';
import Deudas from '../pages/Deudas';
import Pagos from '../pages/Pagos';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';

/**
 * AppRouter Component
 * 
 * Scalability Design:
 * - Declares routing paths and assigns pages.
 * - Protects authenticated views under PrivateRoute and guest views under PublicRoute.
 * - Mounts Layout as a parent layout component for all private dashboard subroutes.
 */
function AppRouter() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      {/* Private Routes (Dashboard, Clients, Debts, Payments) */}
      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/deudas" element={<Deudas />} />
          <Route path="/pagos" element={<Pagos />} />
        </Route>
      </Route>

      {/* Redirect wildcards back to home/dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRouter;
