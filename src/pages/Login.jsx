import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import Card from '../components/ui/Card';

/**
 * Login Page
 * 
 * - Render an email/password form styled with custom UI components.
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
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-moss flex items-center justify-center text-white font-bold text-2xl shadow-md mb-3 select-none">
            $
          </div>
          <h2 className="text-3xl font-title font-bold text-brand-gray-dark text-center">
            Bienvenido de nuevo
          </h2>
          <p className="text-slate-500 text-base mt-1 text-center">
            Ingresa tus datos para acceder al sistema
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <Alert type="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            id="email"
            label="Correo Electrónico"
            type="email"
            required
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
          />

          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="password" className="block text-sm font-semibold text-slate-600 tracking-wide">
                Contraseña <span className="text-rose-dark">*</span>
              </label>
              <Link 
                to="/forgot-password"
                className="text-sm text-moss-dark hover:underline font-semibold"
              >
                ¿Olvidaste tu clave?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              className="w-full px-4 py-3 bg-white border border-linen-dark rounded-xl text-base text-brand-gray-dark placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-moss/20 focus:border-moss transition-all duration-200 shadow-sm"
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            variant="primary"
            className="w-full mt-2"
          >
            {submitting ? 'Iniciando sesión...' : 'Ingresar'}
          </Button>
        </form>

        <div className="mt-8 text-center text-base text-slate-500 border-t border-linen/50 pt-6">
          ¿No tienes una cuenta?{' '}
          <Link to="/register" className="text-moss-dark hover:underline font-bold">
            Regístrate aquí
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default Login;
