import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

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
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md bg-brand-white border border-slate-200 rounded-2xl p-8 shadow-premium">
        <h2 className="text-2xl font-bold text-brand-gray-dark text-center mb-2">
          Recuperar Clave
        </h2>
        <p className="text-sm text-slate-500 text-center mb-6">
          Ingresa tu dirección de correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
        </p>

        {error && (
          <div className="mb-4 p-3.5 bg-rose-50 border-l-4 border-rose-600 text-rose-700 text-xs rounded-r-lg font-medium">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-emerald-50 border-l-4 border-emerald-600 text-emerald-700 text-xs rounded-r-lg font-medium">
            ✅ ¡Enlace enviado! Hemos despachado un enlace para recuperar tu clave. Revisa tu casilla de correo.
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
              placeholder="tu-correo@proveedor.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full btn-primary mt-2"
          >
            {submitting ? 'Enviando enlace...' : 'Enviar Enlace de Recuperación'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          <Link to="/login" className="text-brand-blue hover:underline font-semibold">
            Volver a Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
