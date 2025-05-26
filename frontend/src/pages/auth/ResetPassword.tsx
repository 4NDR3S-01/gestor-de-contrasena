import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Eye, EyeOff, Shield, Lock, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTema } from '../../contexts/TemaContext';
import apiService from '../../services/api';

// Esquema de validación
const esquema = yup.object({
  nuevaContrasena: yup
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .matches(/[a-z]/, 'Debe contener al menos una letra minúscula')
    .matches(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
    .matches(/[0-9]/, 'Debe contener al menos un número')
    .matches(/[^a-zA-Z0-9]/, 'Debe contener al menos un carácter especial')
    .required('La nueva contraseña es obligatoria'),
  confirmarContrasena: yup
    .string()
    .oneOf([yup.ref('nuevaContrasena')], 'Las contraseñas no coinciden')
    .required('Confirma la nueva contraseña'),
});

interface FormData {
  nuevaContrasena: string;
  confirmarContrasena: string;
}

const ResetPassword: React.FC = () => {
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [mostrarConfirmarContrasena, setMostrarConfirmarContrasena] = useState(false);
  const [estaCargando, setEstaCargando] = useState(false);
  const [tokenValido, setTokenValido] = useState<boolean | null>(null);
  const { alternarTema, tema } = useTema();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(esquema),
  });

  useEffect(() => {
    if (!token) {
      setTokenValido(false);
      toast.error('Token de recuperación no válido');
    } else {
      setTokenValido(true);
    }
  }, [token]);


  const [mensajeError, setMensajeError] = useState<string | null>(null);


  const onSubmit = async (datos: FormData) => {
    setMensajeError(null);
    // Validación local del token
    if (!token || typeof token !== 'string' || token.length < 32) {
      setMensajeError('El enlace de recuperación es inválido o ha expirado. Solicita uno nuevo.');
      toast.error('El enlace de recuperación es inválido o ha expirado. Solicita uno nuevo.');
      return;
    }

    try {
      setEstaCargando(true);
      await apiService.restablecerContrasena(token, datos.nuevaContrasena);
      toast.success('Contraseña restablecida exitosamente');
      navigate('/login');
    } catch (error: unknown) {
      let mensajeError = 'Error al restablecer la contraseña';
      if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'mensaje' in error.response.data) {
        mensajeError = (error.response.data as { mensaje?: string }).mensaje || mensajeError;
      }
      setMensajeError(mensajeError);
      toast.error(mensajeError);
    } finally {
      setEstaCargando(false);
    }
  };


  if (tokenValido === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 px-8 py-10 text-center">
            <Shield className="w-12 h-12 text-red-600 mx-auto mb-2" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              Token Inválido
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              El enlace de recuperación no es válido o ha expirado.
            </p>
            <Link
              to="/olvide-contrasena"
              className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 inline-flex items-center justify-center"
            >
              Solicitar Nuevo Enlace
            </Link>
            <Link
              to="/login"
              className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-gray-400 to-gray-600 text-white font-bold shadow-lg hover:from-gray-500 hover:to-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 inline-flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
              Nueva Contraseña
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Ingresa tu nueva contraseña para tu cuenta
            </p>
          </div>

          {/* Formulario */}
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              {/* Nueva contraseña */}
              <div>
                <label htmlFor="nuevaContrasena" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nueva contraseña
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('nuevaContrasena')}
                    type={mostrarContrasena ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 px-4 py-3 pl-10 pr-10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.nuevaContrasena ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Tu nueva contraseña"
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
                {errors.nuevaContrasena && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.nuevaContrasena.message}
                  </p>
                )}
              </div>

              {/* Confirmar contraseña */}
              <div>
                <label htmlFor="confirmarContrasena" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Confirmar nueva contraseña
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('confirmarContrasena')}
                    type={mostrarConfirmarContrasena ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 px-4 py-3 pl-10 pr-10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.confirmarContrasena ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Confirma tu nueva contraseña"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setMostrarConfirmarContrasena(!mostrarConfirmarContrasena)}
                  >
                    {mostrarConfirmarContrasena ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmarContrasena && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.confirmarContrasena.message}
                  </p>
                )}
              </div>
            </div>

            {/* Botón de envío */}
            <div>
              <button
                type="submit"
                disabled={estaCargando}
                className={`w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${estaCargando ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {estaCargando ? 'Restableciendo...' : 'Restablecer Contraseña'}
              </button>
              {mensajeError && (
                <div className="mt-4 text-center">
                  <span className="text-sm text-red-600 dark:text-red-400 font-semibold bg-red-50 dark:bg-red-900/30 px-3 py-2 rounded-lg inline-block shadow-sm animate-fade-in">
                    {mensajeError}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-2 mt-2">
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 inline-flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Login
              </Link>
            </div>

            {/* Botón de tema */}
            <div className="flex justify-center mt-4">
              <button
                type="button"
                onClick={alternarTema}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {tema === 'claro' ? '🌙' : '☀️'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
