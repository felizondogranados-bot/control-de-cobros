/**
 * Application route definitions.
 * This file serves as a single source of truth for all routes in the system.
 * It is structured to easily integrate with React Router or any custom routing logic in the future.
 */
export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD: '/dashboard',
  CATEGORIAS: '/categorias',
  CLIENTES: '/clientes',
  DEUDAS: '/deudas',
  PAGOS: '/pagos',
};

export const publicRoutes = [
  {
    path: ROUTES.LOGIN,
    label: 'Login',
  },
  {
    path: ROUTES.REGISTER,
    label: 'Registro',
  },
  {
    path: ROUTES.FORGOT_PASSWORD,
    label: 'Recuperar Contraseña',
  },
];

export const privateRoutes = [
  {
    path: ROUTES.DASHBOARD,
    label: 'Dashboard',
    icon: 'dashboard',
  },
  {
    path: ROUTES.CATEGORIAS,
    label: 'Categorías',
    icon: 'folder',
  },
  {
    path: ROUTES.CLIENTES,
    label: 'Clientes',
    icon: 'users',
  },
  {
    path: ROUTES.DEUDAS,
    label: 'Deudas',
    icon: 'credit-card',
  },
  {
    path: ROUTES.PAGOS,
    label: 'Pagos',
    icon: 'dollar-sign',
  },
];
