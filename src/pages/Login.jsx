import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';

/**
 * Login Page
 * 
 * - Render an email/password form styled with Tailwind.
 * - Authenticates against Supabase and handles redirect and errors.
 */
function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      console.error('Login error details:', err);
      setError(err.message || 'Credenciales inválidas o error de conexión.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md bg-brand-white border border-slate-200 rounded-2xl p-8 shadow-premium">
        <h2 className="text-2xl font-bold text-brand-gray-dark text-center mb-6">
          Iniciar Sesión
        </h2>

        {error && (
          <div className="mb-4 p-3.5 bg-rose-50 border-l-4 border-rose-600 text-rose-700 text-xs rounded-r-lg font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              placeholder="ejemplo@cobros.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Contraseña
              </label>
              <Link 
                to="/forgot-password"
                className="text-xs text-brand-blue hover:underline font-medium"
              >
                ¿Olvidaste tu clave?
              </Link>
            </div>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full btn-primary mt-2"
          >
            {submitting ? 'Iniciando sesión...' : 'Ingresar'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          ¿No tienes una cuenta?{' '}
          <Link to="/register" className="text-brand-blue hover:underline font-semibold">
            Regístrate aquí
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
