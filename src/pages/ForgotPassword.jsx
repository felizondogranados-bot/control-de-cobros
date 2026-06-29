import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import Card from '../components/ui/Card';

/**
 * ForgotPassword Page
 * 
 * - Render email input form.
 * - Call Supabase resetPasswordForEmail to trigger recovery link dispatch.
 */
function ForgotPassword() {
  const { resetPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);

    try {
      await resetPassword(email);
      setSuccess(true);
      setEmail('');
    } catch (err) {
      console.error('Password reset error details:', err);
      setError(err.message || 'Error al intentar enviar el correo de recuperación.');
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
            Recuperar clave
          </h2>
          <p className="text-slate-500 text-base mt-1 text-center">
            Te enviaremos un enlace para restablecer tu contraseña
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
              ¡Enlace enviado! Hemos despachado un enlace para recuperar tu clave. Revisa tu casilla de correo.
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

          <Button
            type="submit"
            disabled={submitting}
            variant="primary"
            className="w-full mt-2"
          >
            {submitting ? 'Enviando enlace...' : 'Enviar Enlace de Recuperación'}
          </Button>
        </form>

        <div className="mt-8 text-center text-base text-slate-500 border-t border-linen/50 pt-6">
          <Link to="/login" className="text-moss-dark hover:underline font-bold">
            Volver a Iniciar Sesión
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default ForgotPassword;
