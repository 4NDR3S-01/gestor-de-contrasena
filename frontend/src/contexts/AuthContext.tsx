import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'react-hot-toast';
import type { ContextoAuth, Usuario, DatosLogin, DatosRegistro } from '../types/index';
import apiService from '../services/api';
import { syncEvents, SYNC_EVENTS } from '../utils/syncEvents';

// Define la estructura del estado del contexto de autenticación
interface EstadoAuth {
  usuario: Usuario | null; // Usuario logueado o null si no hay sesión
  token: string | null; // Token JWT o similar para autenticación
  estaLogueado: boolean; // Indica si el usuario está autenticado
  estaVerificandoContrasenaMaestra: boolean; // Estado durante la verificación de contraseña maestra
  contrasenaMaestraVerificada: boolean; // Resultado de la verificación de la contraseña maestra
  estaCargando: boolean; // Indica si hay una acción asíncrona en curso (login, registro, etc.)
}

// Define las acciones que puede recibir el reducer para cambiar el estado
type AccionAuth =
  | { type: 'INICIAR_CARGA' }
  | { type: 'LOGIN_EXITOSO'; payload: { usuario: Usuario; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'VERIFICAR_CONTRASENA_MAESTRA_INICIO' }
  | { type: 'VERIFICAR_CONTRASENA_MAESTRA_EXITO' }
  | { type: 'VERIFICAR_CONTRASENA_MAESTRA_ERROR' }
  | { type: 'LIMPIAR_VERIFICACION_CONTRASENA_MAESTRA' }
  | { type: 'DETENER_CARGA' };

// Estado inicial por defecto al cargar la aplicación
const estadoInicial: EstadoAuth = {
  usuario: null,
  token: null,
  estaLogueado: false,
  estaVerificandoContrasenaMaestra: false,
  contrasenaMaestraVerificada: false,
  estaCargando: false,
};

// Función reducer para actualizar el estado basado en las acciones
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
        ...estadoInicial, // Reinicia el estado al inicial
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
      return estado; // En caso de acción desconocida, retorna el estado actual sin cambios
  }
}

// Crear el contexto de autenticación con tipo ContextoAuth o undefined (para control de errores)
const AuthContext = createContext<ContextoAuth | undefined>(undefined);

// Hook personalizado para consumir el contexto de autenticación de forma segura
export const useAuth = (): ContextoAuth => {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return contexto;
};

// Props para el proveedor del contexto, recibe componentes hijos
interface AuthProviderProps {
  children: ReactNode;
}

// Componente proveedor que encapsula la lógica de autenticación y estado global
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Usa useReducer para manejar el estado y despachar acciones
  const [estado, dispatch] = useReducer(authReducer, estadoInicial);

  // Al montar el componente, verifica si ya hay token y usuario guardados en localStorage para mantener sesión activa
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
        // Si hay error al parsear, limpia datos almacenados
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
      }
    }
  }, []);

  // Función para realizar login con API externa
  const login = async (datos: DatosLogin): Promise<void> => {
    try {
      dispatch({ type: 'INICIAR_CARGA' });
      
      const respuesta = await apiService.login(datos);
      
      if (respuesta.exito && respuesta.datos) {
        const { token, usuario } = respuesta.datos;
        
        // Guarda token y usuario en localStorage para persistencia
        localStorage.setItem('token', token);
        localStorage.setItem('usuario', JSON.stringify(usuario));
        
        // Actualiza estado con usuario y token
        dispatch({
          type: 'LOGIN_EXITOSO',
          payload: { usuario, token }
        });

        // Emitir evento para sincronizar sesión en otras pestañas o componentes
        syncEvents.emit(SYNC_EVENTS.SESSION_STARTED);

        toast.success('¡Bienvenido de vuelta!');
      } else {
        throw new Error(respuesta.mensaje || 'Error en el login');
      }
    } catch (error: unknown) {
      dispatch({ type: 'DETENER_CARGA' });
      let mensajeError = 'Error al iniciar sesión';

      // Intentar extraer mensaje de error detallado si existe en la respuesta
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

  // Función para registrar un nuevo usuario mediante API externa
  const registro = async (datos: DatosRegistro): Promise<void> => {
    try {
      dispatch({ type: 'INICIAR_CARGA' });
      
      const respuesta = await apiService.registro(datos);
      
      if (respuesta.exito && respuesta.datos) {
        const { token, usuario } = respuesta.datos;
        
        // Guardar datos en localStorage para sesión persistente
        localStorage.setItem('token', token);
        localStorage.setItem('usuario', JSON.stringify(usuario));
        
        // Actualizar estado global con usuario y token
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

      // Extraer mensaje de error detallado si está disponible
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

  // Función para cerrar sesión
  const logout = (): void => {
    // Limpia datos en localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');

    // Reinicia el estado de autenticación
    dispatch({ type: 'LOGOUT' });
    
    // Emitir evento para sincronizar cierre de sesión en otras pestañas
    syncEvents.emit(SYNC_EVENTS.LOGOUT);
    
    toast.success('Sesión cerrada correctamente');
  };

  // Función para verificar contraseña maestra, puede usarse para seguridad adicional
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

      // Intenta obtener mensaje de error detallado
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
      }
      toast.error(mensajeError);
      return false;
    }
  };

  // Limpia el estado relacionado a la verificación de la contraseña maestra
  const limpiarVerificacionContrasenaMaestra = (): void => {
    dispatch({ type: 'LIMPIAR_VERIFICACION_CONTRASENA_MAESTRA' });
  };

  // Objeto que contiene estado y funciones para proveer a los componentes hijos
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
    // Provee el contexto a todos los componentes hijos dentro del árbol React
    <AuthContext.Provider value={valor}>
      {children}
    </AuthContext.Provider>
  );
};
