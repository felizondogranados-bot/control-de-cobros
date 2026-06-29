import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import Card from '../components/ui/Card';

/**
 * Register Page
 * 
 * - Render sign-up form with input validations.
 * - Call Supabase Auth signUp, handle redirection or confirmation notice.
 */
function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Basic password validation
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setSubmitting(true);

    try {
      await register(email, password);
      setSuccess(true);
      // Clean inputs
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Registration error details:', err);
      setError(err.message || 'Error al intentar crear la cuenta.');
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
            Crear una cuenta
          </h2>
          <p className="text-slate-500 text-base mt-1 text-center">
            Únete para administrar tus cobros con tranquilidad
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <Alert type="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </div>
        )}

        {success && (
          <div className="mb-6">
            <Alert type="success" onClose={() => setSuccess(false)}>
              ¡Registro exitoso! Por favor revisa tu correo electrónico para confirmar tu cuenta antes de iniciar sesión.
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

          <Input
            id="password"
            label="Contraseña"
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            helperText="Debe tener al menos 6 caracteres"
          />

          <Input
            id="confirmPassword"
            label="Confirmar Contraseña"
            type="password"
            required
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={submitting}
          />

          <Button
            type="submit"
            disabled={submitting}
            variant="primary"
            className="w-full mt-2"
          >
            {submitting ? 'Creando cuenta...' : 'Registrarse'}
          </Button>
        </form>

        <div className="mt-8 text-center text-base text-slate-500 border-t border-linen/50 pt-6">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-moss-dark hover:underline font-bold">
            Inicia sesión
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default Register;
