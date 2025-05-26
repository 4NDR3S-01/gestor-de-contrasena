import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Eye, EyeOff, Shield, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTema } from '../../contexts/TemaContext';

// Esquema de validación
const esquema = yup.object({
  email: yup
    .string()
    .email('Formato de email inválido')
    .required('El email es obligatorio'),
  contrasena: yup
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .required('La contraseña es obligatoria'),
});

const Login: React.FC = () => {
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [estaCargando, setEstaCargando] = useState(false);
  const { login } = useAuth();
  const { alternarTema, tema } = useTema();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<{ email: string; contrasena: string }>({
    resolver: yupResolver(esquema),
  });


  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const onSubmit = async (datos: { email: string; contrasena: string }) => {
    setMensajeError(null);
    try {
      setEstaCargando(true);
      await login(datos);
      navigate('/dashboard');
    } catch (error: any) {
      // El error ya se maneja en el contexto (toast), pero también lo mostramos visualmente
      const mensaje = error?.response?.data?.mensaje || error?.message || 'Error al iniciar sesión';
      setMensajeError(mensaje);
    } finally {
      setEstaCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 px-8 py-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-2">
              <Shield className="w-12 h-12 text-blue-600 dark:text-blue-400 drop-shadow-lg" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              Iniciar Sesión
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Accede a tu bóveda segura de contraseñas
            </p>
          </div>

          {/* Formulario */}
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('email')}
                    type="email"
                    autoComplete="email"
                    className={`w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 px-4 py-3 pl-10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="tu@email.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Contraseña */}
              <div>
                <label htmlFor="contrasena" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Contraseña
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('contrasena')}
                    type={mostrarContrasena ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={`w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 px-4 py-3 pl-10 pr-10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.contrasena ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Tu contraseña"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setMostrarContrasena(!mostrarContrasena)}
                  >
                    {mostrarContrasena ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.contrasena && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.contrasena.message}
                  </p>
                )}
              </div>
            </div>

            {/* Botón de tema */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={alternarTema}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {tema === 'claro' ? '🌙' : '☀️'}
              </button>
            </div>


            {/* Botón de envío */}
            <div>
              <button
                type="submit"
                disabled={estaCargando}
                className={`w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${estaCargando ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {estaCargando ? 'Ingresando...' : 'Iniciar Sesión'}
              </button>
              {mensajeError && (
                <div className="mt-4 text-center">
                  <span className="text-sm text-red-600 dark:text-red-400 font-semibold bg-red-50 dark:bg-red-900/30 px-3 py-2 rounded-lg inline-block shadow-sm animate-fade-in">
                    {mensajeError}
                  </span>
                </div>
              )}
            </div>

            {/* Enlaces de ayuda */}
            <div className="flex flex-col items-center gap-2 mt-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                ¿No tienes cuenta?{' '}
                <Link
                  to="/register"
                  className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                >
                  Regístrate aquí
                </Link>
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                <Link
                  to="/forgot-password"
                  className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
