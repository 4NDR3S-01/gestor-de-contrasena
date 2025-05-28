import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { apiService } from '../services/api';
import { useAuth } from './AuthContext';
import type { NotificacionLocal, ContextoNotificaciones, NotificacionDB } from '../types/index';

// Crear contexto para las notificaciones, inicialmente indefinido
const NotificacionesContext = createContext<ContextoNotificaciones | undefined>(undefined);

// Props que recibe el provider, que es un contenedor para proveer contexto
interface NotificacionesProviderProps {
  children: React.ReactNode;
}

// Componente provider que envuelve la aplicación y provee estado y funciones de notificaciones
export const NotificacionesProvider: React.FC<NotificacionesProviderProps> = ({ children }) => {
  // Obtener usuario y estado de login desde el contexto de autenticación
  const { usuario, estaLogueado } = useAuth();

  // Estado local para las notificaciones cargadas
  const [notificaciones, setNotificaciones] = useState<NotificacionLocal[]>([]);
  // Estado local para la cantidad de notificaciones no leídas
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);
  // Estado para indicar si está cargando notificaciones
  const [cargando, setCargando] = useState(false);

  // Función para convertir una notificación obtenida de la base de datos a formato local para la app
  const convertirNotificacion = (notifDB: NotificacionDB): NotificacionLocal => ({
    id: notifDB._id,
    tipo: notifDB.tipo,
    titulo: notifDB.titulo,
    mensaje: notifDB.mensaje,
    datos: notifDB.datos,
    leida: notifDB.leida,
    fecha: new Date(notifDB.fechaCreacion)
  });

  // Función para cargar notificaciones desde la API (paginación por defecto 50)
  const cargarNotificaciones = useCallback(async (pagina = 1, limite = 50) => {
    // Si no está logueado o no hay usuario, no cargar nada
    if (!estaLogueado || !usuario) return;

    try {
      setCargando(true); // Mostrar spinner o estado de carga
      const response = await apiService.obtenerNotificaciones(pagina, limite);
      
      // Si la respuesta es exitosa, convertir y guardar notificaciones y cantidad no leídas
      if (response.exito && response.datos) {
        const notificacionesConvertidas = (response.datos.notificaciones as NotificacionDB[]).map(convertirNotificacion);
        setNotificaciones(notificacionesConvertidas);
        setNotificacionesNoLeidas(response.datos.noLeidas);
      }
    } catch (error) {
      // Mostrar error en consola y notificación en UI si falla la carga
      console.error('Error al cargar notificaciones:', error);
      toast.error('Error al cargar notificaciones');
    } finally {
      setCargando(false); // Quitar estado de carga
    }
  }, [estaLogueado, usuario]);

  // Agregar una nueva notificación solo localmente (no se envía a BD)
  const agregarNotificacion = useCallback((notificacion: Omit<NotificacionLocal, 'id' | 'fecha'>) => {
    // Crear una notificación temporal con id único local y fecha actual
    const nuevaNotificacion: NotificacionLocal = {
      ...notificacion,
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fecha: new Date(),
      leida: false
    };

    // Agregar al inicio del arreglo y aumentar contador de no leídas
    setNotificaciones(prev => [nuevaNotificacion, ...prev]);
    setNotificacionesNoLeidas(prev => prev + 1);
  }, []);

  // Marcar una notificación como leída, actualizando backend y estado local
  const marcarComoLeida = useCallback(async (id: string) => {
    if (!estaLogueado) return;

    try {
      // Si es notificación temporal (id local), solo actualizar localmente
      if (id.startsWith('temp_')) {
        setNotificaciones(prev =>
          prev.map(notif =>
            notif.id === id ? { ...notif, leida: true } : notif
          )
        );
        setNotificacionesNoLeidas(prev => Math.max(0, prev - 1));
        return;
      }

      // Marcar como leída en backend
      await apiService.marcarNotificacionComoLeida(id);
      
      // Actualizar estado local reflejando el cambio
      setNotificaciones(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, leida: true } : notif
        )
      );
      setNotificacionesNoLeidas(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
      toast.error('Error al actualizar notificación');
    }
  }, [estaLogueado]);

  // Marcar todas las notificaciones como leídas
  const marcarTodasComoLeidas = useCallback(async () => {
    if (!estaLogueado) return;

    try {
      // Llamar a API para marcar todas como leídas
      await apiService.marcarTodasNotificacionesComoLeidas();
      
      // Actualizar estado local para marcar todo como leído
      setNotificaciones(prev =>
        prev.map(notif => ({ ...notif, leida: true }))
      );
      setNotificacionesNoLeidas(0);
      
      toast.success('Todas las notificaciones marcadas como leídas');
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error);
      toast.error('Error al actualizar notificaciones');
    }
  }, [estaLogueado]);

  // Eliminar notificación (temporal o permanente)
  const eliminarNotificacion = useCallback(async (id: string) => {
    if (!estaLogueado) return;

    try {
      // Si es notificación temporal, eliminar localmente y ajustar contador
      if (id.startsWith('temp_')) {
        const notifEliminada = notificaciones.find(n => n.id === id);
        setNotificaciones(prev => prev.filter(notif => notif.id !== id));
        
        if (notifEliminada && !notifEliminada.leida) {
          setNotificacionesNoLeidas(prev => Math.max(0, prev - 1));
        }
        return;
      }

      // Eliminar notificación en backend
      await apiService.eliminarNotificacion(id);
      
      // Actualizar estado local eliminando la notificación y actualizar contador
      const notifEliminada = notificaciones.find(n => n.id === id);
      setNotificaciones(prev => prev.filter(notif => notif.id !== id));
      
      if (notifEliminada && !notifEliminada.leida) {
        setNotificacionesNoLeidas(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
      toast.error('Error al eliminar notificación');
    }
  }, [estaLogueado, notificaciones]);

  // Función para formatear fechas en tiempo relativo (minutos, horas, días)
  const formatTime = useCallback((fecha: Date | string): string => {
    const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
    const ahora = new Date();
    const diferencia = ahora.getTime() - fechaObj.getTime();
    
    const minutos = Math.floor(diferencia / (1000 * 60));
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `${minutos}m`;
    if (horas < 24) return `${horas}h`;
    if (dias < 7) return `${dias}d`;
    
    return fechaObj.toLocaleDateString();
  }, []);

  // Cargar notificaciones cuando el usuario inicia sesión y limpiar cuando cierra sesión
  useEffect(() => {
    if (estaLogueado && usuario) {
      cargarNotificaciones();
    } else {
      setNotificaciones([]);
      setNotificacionesNoLeidas(0);
    }
  }, [estaLogueado, usuario, cargarNotificaciones]);

  // Valor del contexto que será provisto a los consumidores
  const contextValue: ContextoNotificaciones = {
    notificaciones,
    notificacionesNoLeidas,
    cargando,
    agregarNotificacion,
    marcarComoLeida,
    marcarTodasComoLeidas,
    eliminarNotificacion,
    cargarNotificaciones,
    formatTime
  };

  // Proveer contexto a los hijos
  return (
    <NotificacionesContext.Provider value={contextValue}>
      {children}
    </NotificacionesContext.Provider>
  );
};

// Hook para consumir el contexto de notificaciones
export const useNotificaciones = (): ContextoNotificaciones => {
  const context = useContext(NotificacionesContext);
  if (context === undefined) {
    // Retornar un objeto vacío para evitar errores si se usa fuera del provider
    return {
      notificaciones: [],
      notificacionesNoLeidas: 0,
      cargando: false,
      agregarNotificacion: () => {},
      marcarComoLeida: async () => {},
      marcarTodasComoLeidas: async () => {},
      eliminarNotificacion: async () => {},
      cargarNotificaciones: async () => {},
      formatTime: () => ''
    };
  }
  return context;
};
