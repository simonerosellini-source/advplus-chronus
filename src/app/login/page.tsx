'use client';

// Pagina di Login - Presency+
import { useState } from 'react';
import { Logo } from '@/components/ui/Logo';
import { login } from './actions';

export default function LoginPage() {
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(event.currentTarget);

    try {
      const result = await login(formData);
      if (result?.error) {
        setError(result.error);
      }
      // Se il login ha successo, il redirect viene gestito dalla server action
    } catch (err) {
      setError('Errore durante il login. Riprova.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary-light to-secondary p-4">
      <div className="w-full max-w-md">
        {/* Card principale */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="mb-12 mt-4">
            <Logo />
          </div>

          {/* Form di login */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={loading}
                className="input bg-gray-50"
                placeholder="simone.rosellini@advisoryplus.it"
              />
            </div>

            {/* Campo Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={loading}
                className="input bg-gray-50"
                placeholder="••••••••"
              />
            </div>

            {/* Messaggio di errore */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Bottone Accedi */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <span className="spinner mr-2 h-5 w-5 border-2"></span>
                  Accesso in corso...
                </>
              ) : (
                'Accedi'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Problemi di accesso? Contatta l&apos;amministratore</p>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 text-center text-white text-sm">
          <p>&copy; {new Date().getFullYear()} Advisory+. Tutti i diritti riservati.</p>
        </div>
      </div>
    </div>
  );
}
