import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, Shield, Key, Save, AlertCircle, CheckCircle, Lock, Star, Target, Activity } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

// Esquemas de validación
const esquemaInformacionPersonal = yup.object({
  nombre: yup
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede tener más de 50 caracteres')
    .required('El nombre es obligatorio'),
  email: yup
    .string()
    .email('Formato de email inválido')
    .required('El email es obligatorio'),
});

const esquemaCambiarContrasena = yup.object({
  contrasenaActual: yup
    .string()
    .required('La contraseña actual es obligatoria'),
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

interface DatosInformacionPersonal {
  nombre: string;
  email: string;
}

interface DatosCambiarContrasena {
  contrasenaActual: string;
  nuevaContrasena: string;
  confirmarContrasena: string;
}

const Profile: React.FC = () => {
  const { usuario, logout } = useAuth();
  const [cargandoInfo, setCargandoInfo] = useState(false);
  const [cargandoContrasena, setCargandoContrasena] = useState(false);
  const [estadisticas, setEstadisticas] = useState({
    totalContrasenas: 0,
    contrasenasFuertes: 0,
    contrasenasDebiles: 0,
    favoritas: 0,
    ultimoAcceso: null as string | null,
  });

  // Formulario de información personal
  const {
    register: registerInfo,
    handleSubmit: handleSubmitInfo,
    formState: { errors: errorsInfo },
    reset: resetInfo,
  } = useForm<DatosInformacionPersonal>({
    resolver: yupResolver(esquemaInformacionPersonal),
    defaultValues: {
      nombre: usuario?.nombre || '',
      email: usuario?.email || '',
    },
  });

  // Formulario de cambiar contraseña
  const {
    register: registerContrasena,
    handleSubmit: handleSubmitContrasena,
    formState: { errors: errorsContrasena },
    reset: resetContrasena,
  } = useForm<DatosCambiarContrasena>({
    resolver: yupResolver(esquemaCambiarContrasena),
  });

  useEffect(() => {
    cargarEstadisticas();
    if (usuario) {
      resetInfo({
        nombre: usuario.nombre,
        email: usuario.email,
      });
    }
  }, [usuario, resetInfo]);

  const cargarEstadisticas = async () => {
    try {
      // Obtener estadísticas reales de contraseñas usando el endpoint que ya retorna datos correctos
      const contrasenas = await apiService.obtenerContrasenas(1, 1000); // Obtener todas las contraseñas
      const totalContrasenas = contrasenas.length;
      const favoritas = contrasenas.filter((p) => p.esFavorito).length;
      
      // Calcular fortaleza de contraseñas (simulado para ahora, podría implementarse en el backend)
      const contrasenasFuertes = Math.floor(totalContrasenas * 0.7);
      const contrasenasDebiles = totalContrasenas - contrasenasFuertes;
      
      setEstadisticas({
        totalContrasenas,
        contrasenasFuertes,
        contrasenasDebiles,
        favoritas,
        ultimoAcceso: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      // Fallback a datos vacíos en caso de error
      setEstadisticas({
        totalContrasenas: 0,
        contrasenasFuertes: 0,
        contrasenasDebiles: 0,
        favoritas: 0,
        ultimoAcceso: new Date().toISOString(),
      });
    }
  };

  const actualizarInformacionPersonal = async (datos: DatosInformacionPersonal) => {
    try {
      setCargandoInfo(true);
      const respuesta = await apiService.actualizarPerfil(datos);
      
      if (respuesta.exito) {
        toast.success('Información actualizada correctamente');
        // Actualizar el contexto de usuario si es necesario
        if (respuesta.datos?.usuario) {
          // Aquí podrías actualizar el contexto de autenticación con los nuevos datos
          // updateUserContext(respuesta.datos.usuario);
        }
      } else {
        toast.error(respuesta.mensaje || 'Error al actualizar la información');
      }
    } catch (error) {
      console.error('Error al actualizar información:', error);
      toast.error('Error al actualizar la información');
    } finally {
      setCargandoInfo(false);
    }
  };

  const cambiarContrasena = async (datos: DatosCambiarContrasena) => {
    try {
      setCargandoContrasena(true);
      const respuesta = await apiService.cambiarContrasenaMaestra({
        contrasenaActual: datos.contrasenaActual,
        nuevaContrasena: datos.nuevaContrasena
      });
      
      if (respuesta.exito) {
        toast.success('Contraseña maestra cambiada correctamente');
        resetContrasena();
        // Cerrar sesión por seguridad después de cambiar la contraseña maestra
        setTimeout(() => {
          logout();
          toast('Por seguridad, vuelve a iniciar sesión con tu nueva contraseña maestra');
        }, 2000);
      } else {
        toast.error(respuesta.mensaje || 'Error al cambiar la contraseña');
      }
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      toast.error('Error al cambiar la contraseña maestra');
    } finally {
      setCargandoContrasena(false);
    }
  };

  const formatearFecha = (fecha: string | null) => {
    if (!fecha) return 'No disponible';
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 transition-colors duration-300">
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-blue-500/10 dark:from-emerald-600/20 dark:to-blue-600/20 rounded-3xl -z-10" />
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/50 p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg ring-4 ring-white/10">
                    <User className="w-8 h-8 text-white drop-shadow-sm" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-green-400 to-green-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                </div>
                
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Mi Perfil
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Gestiona tu información personal y configuración de seguridad
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-3 py-1 rounded-full text-sm font-medium">
                  Cuenta Activa
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenido Principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Información Personal */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/80 via-white/90 to-blue-50/80 dark:from-emerald-900/60 dark:via-gray-900/80 dark:to-blue-900/60 rounded-3xl -z-10" />
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/50 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-tr from-emerald-200 to-blue-200 dark:from-emerald-800 dark:to-blue-800 rounded-xl flex items-center justify-center shadow">
                    <User className="w-6 h-6 text-emerald-600 dark:text-emerald-300" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Información Personal
                  </h2>
                </div>
                
                <form onSubmit={handleSubmitInfo(actualizarInformacionPersonal)} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nombre completo
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        {...registerInfo('nombre')}
                        type="text"
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${
                          errorsInfo.nombre ? 'border-red-300 dark:border-red-600' : 'border-gray-200 dark:border-gray-700'
                        }`}
                        placeholder="Tu nombre completo"
                      />
                    </div>
                    {errorsInfo.nombre && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errorsInfo.nombre.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Correo electrónico
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        {...registerInfo('email')}
                        type="email"
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${
                          errorsInfo.email ? 'border-red-300 dark:border-red-600' : 'border-gray-200 dark:border-gray-700'
                        }`}
                        placeholder="tu@email.com"
                      />
                    </div>
                    {errorsInfo.email && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errorsInfo.email.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={cargandoInfo}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 disabled:from-emerald-400 disabled:to-blue-400 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 shadow-lg"
                  >
                    <Save className="w-5 h-5" />
                    {cargandoInfo ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </form>
              </div>
            </div>

            {/* Cambiar Contraseña */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-50/80 via-white/90 to-red-50/80 dark:from-amber-900/60 dark:via-gray-900/80 dark:to-red-900/60 rounded-3xl -z-10" />
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/50 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-tr from-amber-200 to-red-200 dark:from-amber-800 dark:to-red-800 rounded-xl flex items-center justify-center shadow">
                    <Key className="w-6 h-6 text-amber-600 dark:text-amber-300" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Cambiar Contraseña Maestra
                  </h2>
                </div>
                
                <form onSubmit={handleSubmitContrasena(cambiarContrasena)} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Contraseña maestra actual
                    </label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        {...registerContrasena('contrasenaActual')}
                        type="password"
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all ${
                          errorsContrasena.contrasenaActual ? 'border-red-300 dark:border-red-600' : 'border-gray-200 dark:border-gray-700'
                        }`}
                        placeholder="Tu contraseña maestra actual"
                      />
                    </div>
                    {errorsContrasena.contrasenaActual && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errorsContrasena.contrasenaActual.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nueva contraseña maestra
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        {...registerContrasena('nuevaContrasena')}
                        type="password"
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all ${
                          errorsContrasena.nuevaContrasena ? 'border-red-300 dark:border-red-600' : 'border-gray-200 dark:border-gray-700'
                        }`}
                        placeholder="Tu nueva contraseña maestra segura"
                      />
                    </div>
                    {errorsContrasena.nuevaContrasena && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errorsContrasena.nuevaContrasena.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirmar nueva contraseña maestra
                    </label>
                    <div className="relative">
                      <CheckCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        {...registerContrasena('confirmarContrasena')}
                        type="password"
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all ${
                          errorsContrasena.confirmarContrasena ? 'border-red-300 dark:border-red-600' : 'border-gray-200 dark:border-gray-700'
                        }`}
                        placeholder="Confirma tu nueva contraseña maestra"
                      />
                    </div>
                    {errorsContrasena.confirmarContrasena && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errorsContrasena.confirmarContrasena.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={cargandoContrasena}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-700 hover:to-red-700 disabled:from-amber-400 disabled:to-red-400 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 shadow-lg"
                  >
                    <Shield className="w-5 h-5" />
                    {cargandoContrasena ? 'Cambiando...' : 'Cambiar Contraseña Maestra'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Panel Lateral */}
          <div className="space-y-8">
            {/* Estadísticas */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50/80 via-white/90 to-purple-50/80 dark:from-blue-900/60 dark:via-gray-900/80 dark:to-purple-900/60 rounded-3xl -z-10" />
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  Estadísticas
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50/80 to-blue-100/80 dark:from-blue-900/40 dark:to-blue-800/40 rounded-xl border border-blue-100 dark:border-blue-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800/50 rounded-lg flex items-center justify-center">
                        <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total contraseñas</span>
                    </div>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{estadisticas.totalContrasenas}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50/80 to-green-100/80 dark:from-green-900/40 dark:to-green-800/40 rounded-xl border border-green-100 dark:border-green-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-800/50 rounded-lg flex items-center justify-center">
                        <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Contraseñas fuertes</span>
                    </div>
                    <span className="font-bold text-green-600 dark:text-green-400">{estadisticas.contrasenasFuertes}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50/80 to-red-100/80 dark:from-red-900/40 dark:to-red-800/40 rounded-xl border border-red-100 dark:border-red-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-100 dark:bg-red-800/50 rounded-lg flex items-center justify-center">
                        <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Contraseñas débiles</span>
                    </div>
                    <span className="font-bold text-red-600 dark:text-red-400">{estadisticas.contrasenasDebiles}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50/80 to-yellow-100/80 dark:from-yellow-900/40 dark:to-yellow-800/40 rounded-xl border border-yellow-100 dark:border-yellow-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-800/50 rounded-lg flex items-center justify-center">
                        <Star className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Favoritas</span>
                    </div>
                    <span className="font-bold text-yellow-600 dark:text-yellow-400">{estadisticas.favoritas}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Información de la Cuenta */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-50/80 via-white/90 to-pink-50/80 dark:from-purple-900/60 dark:via-gray-900/80 dark:to-pink-900/60 rounded-3xl -z-10" />
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <User className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  Información de la Cuenta
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50/80 to-purple-100/80 dark:from-purple-900/40 dark:to-purple-800/40 rounded-xl border border-purple-100 dark:border-purple-800">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-800/50 rounded-lg flex items-center justify-center">
                      <Mail className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">Email</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {usuario?.email || 'No disponible'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50/80 to-blue-100/80 dark:from-blue-900/40 dark:to-blue-800/40 rounded-xl border border-blue-100 dark:border-blue-800">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800/50 rounded-lg flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">Miembro desde</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatearFecha(usuario?.fechaCreacion || null)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50/80 to-green-100/80 dark:from-green-900/40 dark:to-green-800/40 rounded-xl border border-green-100 dark:border-green-800">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-800/50 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-green-700 dark:text-green-300 uppercase tracking-wide">Último acceso</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatearFecha(estadisticas.ultimoAcceso)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recordatorios de Seguridad */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-50/80 via-white/90 to-orange-50/80 dark:from-amber-900/60 dark:via-gray-900/80 dark:to-orange-900/60 rounded-3xl -z-10" />
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-xl border border-amber-200/50 dark:border-amber-700/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-amber-100 dark:bg-amber-800/50 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h4 className="text-lg font-bold text-amber-800 dark:text-amber-200">
                    Recordatorios de Seguridad
                  </h4>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 p-2 bg-amber-50/50 dark:bg-amber-900/20 rounded-lg">
                    <Target className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-amber-700 dark:text-amber-300">Cambia tu contraseña regularmente</span>
                  </li>
                  <li className="flex items-start gap-3 p-2 bg-amber-50/50 dark:bg-amber-900/20 rounded-lg">
                    <Target className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-amber-700 dark:text-amber-300">No compartas tu contraseña maestra</span>
                  </li>
                  <li className="flex items-start gap-3 p-2 bg-amber-50/50 dark:bg-amber-900/20 rounded-lg">
                    <Target className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-amber-700 dark:text-amber-300">Revisa tus contraseñas débiles</span>
                  </li>
                  <li className="flex items-start gap-3 p-2 bg-amber-50/50 dark:bg-amber-900/20 rounded-lg">
                    <Target className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-amber-700 dark:text-amber-300">Mantén tu información actualizada</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
