import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

/**
 * Authentication Context
 * 
 * Scalability Design:
 * - Integrates directly with Supabase Auth.
 * - Rest of the application consumes this context to verify sessions.
 * - Handles authentication state transitions (SIGNED_IN, SIGNED_OUT, etc.) in real time.
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get active session on application mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((err) => {
      console.error('Error fetching Supabase session:', err);
      setLoading(false);
    });

    // 2. Subscribe to auth changes (login, logout, token refresh, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Registers a new user.
   */
  const register = async (email, password) => {
    setLoading(true);
    const redirectToUrl = window.location.origin;
    console.log('[Supabase Auth - SignUp] Iniciando registro para:', email);
    console.log('[Supabase Auth - SignUp] URL de redirección (emailRedirectTo):', redirectToUrl);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectToUrl,
        }
      });
      if (error) {
        console.error('[Supabase Auth - SignUp Error]:', error);
        throw error;
      }
      console.log('[Supabase Auth - SignUp Exitoso]:', data);
      return data;
    } catch (err) {
      console.error('[Supabase Auth - SignUp Excepción]:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Log in an existing user with email and password.
   */
  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Signs out the current user session.
   */
  const logout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sends a password reset email link.
   */
  const resetPassword = async (email) => {
    setLoading(true);
    const redirectToUrl = window.location.origin;
    console.log('[Supabase Auth - ResetPassword] Solicitando recuperación para:', email);
    console.log('[Supabase Auth - ResetPassword] URL de redirección (redirectTo):', redirectToUrl);
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectToUrl,
      });
      if (error) {
        console.error('[Supabase Auth - ResetPassword Error]:', error);
        throw error;
      }
      console.log('[Supabase Auth - ResetPassword Exitoso]:', data);
      return data;
    } catch (err) {
      console.error('[Supabase Auth - ResetPassword Excepción]:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    register,
    login,
    logout,
    resetPassword,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
