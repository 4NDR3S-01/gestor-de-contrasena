import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Eye, EyeOff, Shield, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTema } from '../../contexts/TemaContext';
import type { DatosRegistro } from '../../types/index';

// Esquema de validación
const esquema = yup.object({
  nombre: yup
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede tener más de 50 caracteres')
    .required('El nombre es obligatorio'),
  email: yup
    .string()
    .email('Formato de email inválido')
    .required('El email es obligatorio'),
  contrasena: yup
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .matches(/[a-z]/, 'Debe contener al menos una letra minúscula')
    .matches(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
    .matches(/[0-9]/, 'Debe contener al menos un número')
    .matches(/[^a-zA-Z0-9]/, 'Debe contener al menos un carácter especial')
    .required('La contraseña es obligatoria'),
  contrasenaMaestra: yup
    .string()
    .min(12, 'La contraseña maestra debe tener al menos 12 caracteres')
    .matches(/[a-z]/, 'Debe contener al menos una letra minúscula')
    .matches(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
    .matches(/[0-9]/, 'Debe contener al menos un número')
    .matches(/[^a-zA-Z0-9]/, 'Debe contener al menos un carácter especial')
    .required('La contraseña maestra es obligatoria'),
  confirmarContrasenaMaestra: yup
    .string()
    .oneOf([yup.ref('contrasenaMaestra')], 'Las contraseñas maestras no coinciden')
    .required('Confirma la contraseña maestra'),
});

const Register: React.FC = () => {
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [mostrarContrasenaMaestra, setMostrarContrasenaMaestra] = useState(false);
  const [mostrarConfirmarContrasenaMaestra, setMostrarConfirmarContrasenaMaestra] = useState(false);
  const [estaCargando, setEstaCargando] = useState(false);
  const { registro } = useAuth();
  const { alternarTema, tema } = useTema();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<DatosRegistro & { confirmarContrasenaMaestra: string }>({
    resolver: yupResolver(esquema),
  });



  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const onSubmit = async (datos: DatosRegistro & { confirmarContrasenaMaestra: string }) => {
    setMensajeError(null);
    try {
      setEstaCargando(true);
      // Remover el campo de confirmación antes de enviar
      const { confirmarContrasenaMaestra, ...datosRegistro } = datos;
      await registro(datosRegistro);
      navigate('/dashboard');
    } catch (error: any) {
      // El error ya se maneja en el contexto (toast), pero también lo mostramos visualmente
      const mensaje = error?.response?.data?.mensaje || error?.message || 'Error al registrar usuario';
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
              Crear Cuenta
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Únete y protege tus contraseñas de forma segura
            </p>
          </div>

          {/* Formulario */}
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
            {/* Nombre */}
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre completo
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('nombre')}
                  type="text"
                  autoComplete="name"
                  className={`w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 px-4 py-3 pl-10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.nombre ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Tu nombre completo"
                />
              </div>
              {errors.nombre && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.nombre.message}
                </p>
              )}
            </div>

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

            {/* Contraseña de cuenta */}
            <div>
              <label htmlFor="contrasena" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Contraseña de cuenta
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('contrasena')}
                  type={mostrarContrasena ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 px-4 py-3 pl-10 pr-10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.contrasena ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Contraseña para tu cuenta"
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

            {/* Contraseña maestra */}
            <div>
              <label htmlFor="contrasenaMaestra" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Contraseña maestra
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('contrasenaMaestra')}
                  type={mostrarContrasenaMaestra ? 'text' : 'password'}
                  className={`w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 px-4 py-3 pl-10 pr-10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.contrasenaMaestra ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Contraseña para desbloquear tus datos"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setMostrarContrasenaMaestra(!mostrarContrasenaMaestra)}
                >
                  {mostrarContrasenaMaestra ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.contrasenaMaestra && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.contrasenaMaestra.message}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Esta contraseña protegerá todas tus contraseñas guardadas. Debe ser muy segura.
              </p>
            </div>

            {/* Confirmar contraseña maestra */}
            <div>
              <label htmlFor="confirmarContrasenaMaestra" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirmar contraseña maestra
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('confirmarContrasenaMaestra')}
                  type={mostrarConfirmarContrasenaMaestra ? 'text' : 'password'}
                  className={`w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 px-4 py-3 pl-10 pr-10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.confirmarContrasenaMaestra ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Confirma tu contraseña maestra"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setMostrarConfirmarContrasenaMaestra(!mostrarConfirmarContrasenaMaestra)}
                >
                  {mostrarConfirmarContrasenaMaestra ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirmarContrasenaMaestra && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.confirmarContrasenaMaestra.message}
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
              {estaCargando ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
            {mensajeError && (
              <div className="mt-4 text-center">
                <span className="text-sm text-red-600 dark:text-red-400 font-semibold bg-red-50 dark:bg-red-900/30 px-3 py-2 rounded-lg inline-block shadow-sm animate-fade-in">
                  {mensajeError}
                </span>
              </div>
            )}
          </div>

          {/* Enlace de login */}
          <div className="flex flex-col items-center gap-2 mt-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              ¿Ya tienes cuenta?{' '}
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                Inicia sesión aquí
              </Link>
            </span>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
