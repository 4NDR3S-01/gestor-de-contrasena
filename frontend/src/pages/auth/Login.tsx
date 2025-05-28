import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Para navegación y enlaces
import { useForm } from 'react-hook-form'; // Para manejo y validación de formularios
import { yupResolver } from '@hookform/resolvers/yup'; // Resolver para integrar yup con react-hook-form
import * as yup from 'yup'; // Librería para esquemas de validación
import { Eye, EyeOff, Shield, Mail, Lock } from 'lucide-react'; // Íconos usados en la UI
import { useAuth } from '../../contexts/AuthContext'; // Contexto para autenticación
import { useTema } from '../../contexts/TemaContext'; // Contexto para manejo de tema claro/oscuro

// Definición del esquema de validación con yup
const esquema = yup.object({
  email: yup
    .string()
    .email('Formato de email inválido') // Valida que el email tenga formato correcto
    .required('El email es obligatorio'), // Email es requerido
  contrasena: yup
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres') // Mínimo 8 caracteres
    .required('La contraseña es obligatoria'), // Contraseña es requerida
});

const Login: React.FC = () => {
  // Estado para mostrar/ocultar la contraseña
  const [mostrarContrasena, setMostrarContrasena] = useState(false);

  // Estado para indicar si la petición está en proceso (loading)
  const [estaCargando, setEstaCargando] = useState(false);

  // Función login del contexto de autenticación
  const { login } = useAuth();

  // Funciones para alternar y obtener el tema actual (claro/oscuro)
  const { alternarTema, tema } = useTema();

  // Hook para navegación programática después del login exitoso
  const navigate = useNavigate();

  // Configuración del formulario con react-hook-form y validación con yup
  const {
    register, // Función para registrar inputs
    handleSubmit, // Función para manejar el submit
    formState: { errors } // Objeto con errores de validación
  } = useForm<{ email: string; contrasena: string }>({
    resolver: yupResolver(esquema), // Integrar esquema yup con react-hook-form
  });

  // Estado para almacenar y mostrar mensajes de error
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  // Función que se ejecuta al enviar el formulario correctamente
  const onSubmit = async (datos: { email: string; contrasena: string }) => {
    setMensajeError(null); // Limpiar mensaje de error previo
    try {
      setEstaCargando(true); // Activar indicador de carga
      await login(datos); // Intentar hacer login con los datos ingresados
      navigate('/dashboard'); // Navegar a la página principal después del login
    } catch (error: any) {
      // Manejar error que proviene del contexto de autenticación o la petición
      const mensaje = error?.response?.data?.mensaje || error?.message || 'Error al iniciar sesión';
      setMensajeError(mensaje); // Mostrar mensaje de error en la UI
    } finally {
      setEstaCargando(false); // Desactivar indicador de carga
    }
  };

  return (
    // Contenedor principal centrado y con gradiente de fondo (tema claro/oscuro)
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 px-8 py-10">
          
          {/* Header del formulario con ícono y título */}
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

          {/* Formulario de login */}
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-5">
              {/* Campo Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <div className="mt-1 relative">
                  {/* Ícono de correo dentro del input */}
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  {/* Input email con validación y estilos */}
                  <input
                    {...register('email')} // Registro del input para react-hook-form
                    type="email"
                    autoComplete="email"
                    className={`w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 px-4 py-3 pl-10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="tu@email.com"
                  />
                </div>
                {/* Mostrar mensaje de error si existe */}
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Campo Contraseña */}
              <div>
                <label htmlFor="contrasena" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Contraseña
                </label>
                <div className="mt-1 relative">
                  {/* Ícono de candado dentro del input */}
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  {/* Input contraseña con opción para mostrar/ocultar */}
                  <input
                    {...register('contrasena')} // Registro del input para react-hook-form
                    type={mostrarContrasena ? 'text' : 'password'} // Alterna tipo input
                    autoComplete="current-password"
                    className={`w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 px-4 py-3 pl-10 pr-10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.contrasena ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Tu contraseña"
                  />
                  {/* Botón para alternar mostrar/ocultar contraseña */}
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
                {/* Mostrar mensaje de error si existe */}
                {errors.contrasena && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.contrasena.message}
                  </p>
                )}
              </div>
            </div>

            {/* Botón para cambiar tema claro/oscuro */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={alternarTema}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {tema === 'claro' ? '🌙' : '☀️'}
              </button>
            </div>

            {/* Botón de enviar formulario */}
            <div>
              <button
                type="submit"
                disabled={estaCargando} // Deshabilita mientras carga
                className={`w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${estaCargando ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {estaCargando ? 'Ingresando...' : 'Iniciar Sesión'}
              </button>
              {/* Mostrar error general de login si existe */}
              {mensajeError && (
                <div className="mt-4 text-center">
                  <span className="text-sm text-red-600 dark:text-red-400 font-semibold bg-red-50 dark:bg-red-900/30 px-3 py-2 rounded-lg inline-block shadow-sm animate-fade-in">
                    {mensajeError}
                  </span>
                </div>
              )}
            </div>

            {/* Enlaces para registro y recuperación de contraseña */}
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
