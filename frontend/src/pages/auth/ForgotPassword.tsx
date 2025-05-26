import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Mail, Shield, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTema } from '../../contexts/TemaContext';
import apiService from '../../services/api';

// Esquema de validación
const esquema = yup.object({
  email: yup
    .string()
    .email('Formato de email inválido')
    .required('El email es obligatorio'),
});

interface FormData {
  email: string;
}

const ForgotPassword: React.FC = () => {
  const [estaCargando, setEstaCargando] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState(false);
  const { alternarTema, tema } = useTema();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(esquema),
  });


  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const onSubmit = async (datos: FormData) => {
    setMensajeError(null);
    try {
      setEstaCargando(true);
      await apiService.solicitarRecuperacion(datos.email);
      setEmailEnviado(true);
      toast.success('Si el email existe, recibirás un enlace de recuperación');
    } catch (error: any) {
      const mensajeError = error.response?.data?.mensaje || 'Error al enviar email de recuperación';
      setMensajeError(mensajeError);
      toast.error(mensajeError);
    } finally {
      setEstaCargando(false);
    }
  };


  if (emailEnviado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 px-8 py-10 text-center">
            <Shield className="w-12 h-12 text-blue-600 dark:text-blue-400 drop-shadow-lg mx-auto mb-2" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              Email Enviado
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Si el email existe en nuestro sistema, hemos enviado un enlace de recuperación.
            </p>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
            </p>
            <Link
              to="/login"
              className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 inline-flex items-center justify-center"
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
              Recuperar Contraseña
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
            </p>
          </div>

          {/* Formulario */}
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
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

            {/* Botón de envío */}
            <div>
              <button
                type="submit"
                disabled={estaCargando}
                className={`w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${estaCargando ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {estaCargando ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
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

export default ForgotPassword;
