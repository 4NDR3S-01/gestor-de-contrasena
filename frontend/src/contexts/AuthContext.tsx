import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'react-hot-toast';
import type { ContextoAuth, Usuario, DatosLogin, DatosRegistro } from '../types/index';
import apiService from '../services/api';
import { syncEvents, SYNC_EVENTS } from '../utils/syncEvents';

// Estados del reducer
interface EstadoAuth {
  usuario: Usuario | null;
  token: string | null;
  estaLogueado: boolean;
  estaVerificandoContrasenaMaestra: boolean;
  contrasenaMaestraVerificada: boolean;
  estaCargando: boolean;
}

// Acciones del reducer
type AccionAuth =
  | { type: 'INICIAR_CARGA' }
  | { type: 'LOGIN_EXITOSO'; payload: { usuario: Usuario; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'VERIFICAR_CONTRASENA_MAESTRA_INICIO' }
  | { type: 'VERIFICAR_CONTRASENA_MAESTRA_EXITO' }
  | { type: 'VERIFICAR_CONTRASENA_MAESTRA_ERROR' }
  | { type: 'LIMPIAR_VERIFICACION_CONTRASENA_MAESTRA' }
  | { type: 'DETENER_CARGA' };

// Estado inicial
const estadoInicial: EstadoAuth = {
  usuario: null,
  token: null,
  estaLogueado: false,
  estaVerificandoContrasenaMaestra: false,
  contrasenaMaestraVerificada: false,
  estaCargando: false,
};

// Reducer
function authReducer(estado: EstadoAuth, accion: AccionAuth): EstadoAuth {
  switch (accion.type) {
    case 'INICIAR_CARGA':
      return { ...estado, estaCargando: true };
    
    case 'LOGIN_EXITOSO':
      return {
        ...estado,
        usuario: accion.payload.usuario,
        token: accion.payload.token,
        estaLogueado: true,
        estaCargando: false,
      };
    
    case 'LOGOUT':
      return {
        ...estadoInicial,
      };
    
    case 'VERIFICAR_CONTRASENA_MAESTRA_INICIO':
      return {
        ...estado,
        estaVerificandoContrasenaMaestra: true,
      };
    
    case 'VERIFICAR_CONTRASENA_MAESTRA_EXITO':
      return {
        ...estado,
        estaVerificandoContrasenaMaestra: false,
        contrasenaMaestraVerificada: true,
      };
    
    case 'VERIFICAR_CONTRASENA_MAESTRA_ERROR':
      return {
        ...estado,
        estaVerificandoContrasenaMaestra: false,
        contrasenaMaestraVerificada: false,
      };
    
    case 'LIMPIAR_VERIFICACION_CONTRASENA_MAESTRA':
      return {
        ...estado,
        contrasenaMaestraVerificada: false,
      };
    
    case 'DETENER_CARGA':
      return { ...estado, estaCargando: false };
    
    default:
      return estado;
  }
}

// Crear el contexto
const AuthContext = createContext<ContextoAuth | undefined>(undefined);

// Hook para usar el contexto
export const useAuth = (): ContextoAuth => {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return contexto;
};

// Provider del contexto
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [estado, dispatch] = useReducer(authReducer, estadoInicial);

  // Verificar si hay un token guardado al cargar la aplicación
  useEffect(() => {
    const tokenGuardado = localStorage.getItem('token');
    const usuarioGuardado = localStorage.getItem('usuario');

    if (tokenGuardado && usuarioGuardado) {
      try {
        const usuario = JSON.parse(usuarioGuardado);
        dispatch({
          type: 'LOGIN_EXITOSO',
          payload: { usuario, token: tokenGuardado }
        });
      } catch (error) {
        console.error('Error al parsear usuario guardado:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
      }
    }
  }, []);

  // Función de login
  const login = async (datos: DatosLogin): Promise<void> => {
    try {
      dispatch({ type: 'INICIAR_CARGA' });
      
      const respuesta = await apiService.login(datos);
      
      if (respuesta.exito && respuesta.datos) {
        const { token, usuario } = respuesta.datos;
        
        // Guardar en localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('usuario', JSON.stringify(usuario));
        
        dispatch({
          type: 'LOGIN_EXITOSO',
          payload: { usuario, token }
        });

        // Emitir evento de sesión iniciada
        syncEvents.emit(SYNC_EVENTS.SESSION_STARTED);

        toast.success('¡Bienvenido de vuelta!');
      } else {
        throw new Error(respuesta.mensaje || 'Error en el login');
      }
    } catch (error: unknown) {
      dispatch({ type: 'DETENER_CARGA' });
      let mensajeError = 'Error al iniciar sesión';
      if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'mensaje' in error.response.data) {
        mensajeError = (error.response as { data: { mensaje?: string } }).data.mensaje ?? mensajeError;
      } else if (error instanceof Error) {
        mensajeError = error.message;
      }
      toast.error(mensajeError);
      throw error;
    }
  };

  // Función de registro
  const registro = async (datos: DatosRegistro): Promise<void> => {
    try {
      dispatch({ type: 'INICIAR_CARGA' });
      
      const respuesta = await apiService.registro(datos);
      
      if (respuesta.exito && respuesta.datos) {
        const { token, usuario } = respuesta.datos;
        
        // Guardar en localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('usuario', JSON.stringify(usuario));
        
        dispatch({
          type: 'LOGIN_EXITOSO',
          payload: { usuario, token }
        });

        toast.success('¡Cuenta creada exitosamente!');
      } else {
        throw new Error(respuesta.mensaje || 'Error en el registro');
      }
    } catch (error: unknown) {
      dispatch({ type: 'DETENER_CARGA' });
      let mensajeError = 'Error al registrar usuario';
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'data' in error.response &&
        error.response.data &&
        typeof error.response.data === 'object' &&
        'mensaje' in error.response.data
      ) {
        mensajeError = (error.response as { data: { mensaje?: string } }).data.mensaje ?? mensajeError;
      } else if (error instanceof Error) {
        mensajeError = error.message;
      }
      toast.error(mensajeError);
      throw error;
    }
  };

  // Función de logout
  const logout = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    dispatch({ type: 'LOGOUT' });
    
    // Emitir evento de logout
    syncEvents.emit(SYNC_EVENTS.LOGOUT);
    
    toast.success('Sesión cerrada correctamente');
  };

  // Función para verificar contraseña maestra
  const verificarContrasenaMaestra = async (contrasenaMaestra: string): Promise<boolean> => {
    try {
      dispatch({ type: 'VERIFICAR_CONTRASENA_MAESTRA_INICIO' });
      
      const respuesta = await apiService.verificarContrasenaMaestra(contrasenaMaestra);
      
      if (respuesta.exito && respuesta.datos?.esValida) {
        dispatch({ type: 'VERIFICAR_CONTRASENA_MAESTRA_EXITO' });
        toast.success('Contraseña maestra verificada');
        return true;
      } else {
        dispatch({ type: 'VERIFICAR_CONTRASENA_MAESTRA_ERROR' });
        toast.error('Contraseña maestra incorrecta');
        return false;
      }
    } catch (error: unknown) {
      dispatch({ type: 'VERIFICAR_CONTRASENA_MAESTRA_ERROR' });
      let mensajeError = 'Error al verificar contraseña maestra';
      if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'mensaje' in error.response.data) {
        mensajeError = (error.response as { data: { mensaje?: string } }).data.mensaje ?? mensajeError;
      }
      toast.error(mensajeError);
      return false;
    }
  };

  // Función para limpiar verificación de contraseña maestra
  const limpiarVerificacionContrasenaMaestra = (): void => {
    dispatch({ type: 'LIMPIAR_VERIFICACION_CONTRASENA_MAESTRA' });
  };

  const valor: ContextoAuth = {
    usuario: estado.usuario,
    token: estado.token,
    estaLogueado: estado.estaLogueado,
    estaVerificandoContrasenaMaestra: estado.estaVerificandoContrasenaMaestra,
    contrasenaMaestraVerificada: estado.contrasenaMaestraVerificada,
    login,
    registro,
    logout,
    verificarContrasenaMaestra,
    limpiarVerificacionContrasenaMaestra,
  };

  return (
    <AuthContext.Provider value={valor}>
      {children}
    </AuthContext.Provider>
  );
};