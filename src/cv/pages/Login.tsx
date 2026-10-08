
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { irAEntrar, modoCentral } from '@/lib/auth';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, loading: authLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modo central: el login es de Guarnold ID (id.guarnold.com.ar); se vuelve al editor al terminar.
  useEffect(() => {
    if (modoCentral) irAEntrar(`${window.location.origin}/admin`);
  }, []);

  if (modoCentral) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message === 'Invalid login credentials' 
        ? 'Credenciales inválidas. Verifica tu email y contraseña.' 
        : error.message);
      setIsSubmitting(false);
    } else {
      navigate('/admin');
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-neutral-100 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden p-10 border border-neutral-100 dark:border-gray-700">
        <div className="flex justify-center mb-8">
          <div className="p-3 bg-neutral-900 dark:bg-white rounded-2xl">
            <LogIn className="w-8 h-8 text-white dark:text-neutral-900" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-neutral-900 dark:text-white mb-2">Acceso Administrador</h2>
        <p className="text-neutral-500 dark:text-gray-300 text-center mb-10 font-medium">Ingresa para editar tu CV</p>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-gray-200 mb-2">Email</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-neutral-900 dark:focus:border-white outline-none transition-all placeholder:text-neutral-300 dark:placeholder:text-gray-500 disabled:opacity-50"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-gray-200 mb-2">Contraseña</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-neutral-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-neutral-900 dark:focus:border-white outline-none transition-all placeholder:text-neutral-300 dark:placeholder:text-gray-500 disabled:opacity-50"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting || authLoading}
            className="w-full flex items-center justify-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold py-4 rounded-xl hover:bg-neutral-800 dark:hover:bg-gray-200 transition-all shadow-lg hover:shadow-neutral-200 dark:hover:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <Link to="/" className="text-sm text-neutral-400 dark:text-gray-500 hover:text-neutral-600 dark:hover:text-gray-300 transition-colors">
            Volver al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
