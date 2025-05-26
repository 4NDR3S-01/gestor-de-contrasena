import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { apiService } from '../services/api';
import { useAuth } from './AuthContext';
import type { NotificacionLocal, ContextoNotificaciones, NotificacionDB } from '../types/index';

const NotificacionesContext = createContext<ContextoNotificaciones | undefined>(undefined);

interface NotificacionesProviderProps {
  children: React.ReactNode;
}

export const NotificacionesProvider: React.FC<NotificacionesProviderProps> = ({ children }) => {
  const { usuario, estaLogueado } = useAuth();
  const [notificaciones, setNotificaciones] = useState<NotificacionLocal[]>([]);
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);
  const [cargando, setCargando] = useState(false);

  // Función para convertir notificación de BD a local
  const convertirNotificacion = (notifDB: NotificacionDB): NotificacionLocal => ({
    id: notifDB._id,
    tipo: notifDB.tipo,
    titulo: notifDB.titulo,
    mensaje: notifDB.mensaje,
    datos: notifDB.datos,
    leida: notifDB.leida,
    fecha: new Date(notifDB.fechaCreacion)
  });

  // Cargar notificaciones desde la API
  const cargarNotificaciones = useCallback(async (pagina = 1, limite = 50) => {
    if (!estaLogueado || !usuario) return;

    try {
      setCargando(true);
      const response = await apiService.obtenerNotificaciones(pagina, limite);
      
      if (response.exito && response.datos) {
        const notificacionesConvertidas = (response.datos.notificaciones as NotificacionDB[]).map(convertirNotificacion);
        setNotificaciones(notificacionesConvertidas);
        setNotificacionesNoLeidas(response.datos.noLeidas);
      }
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
      toast.error('Error al cargar notificaciones');
    } finally {
      setCargando(false);
    }
  }, [estaLogueado, usuario]);

  // Agregar notificación (solo localmente - la BD se actualiza vía backend)
  const agregarNotificacion = useCallback((notificacion: Omit<NotificacionLocal, 'id' | 'fecha'>) => {
    const nuevaNotificacion: NotificacionLocal = {
      ...notificacion,
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fecha: new Date(),
      leida: false
    };

    setNotificaciones(prev => [nuevaNotificacion, ...prev]);
    setNotificacionesNoLeidas(prev => prev + 1);
  }, []);

  // Marcar notificación como leída
  const marcarComoLeida = useCallback(async (id: string) => {
    if (!estaLogueado) return;

    try {
      // Si es una notificación temporal (no está en BD), solo actualizar localmente
      if (id.startsWith('temp_')) {
        setNotificaciones(prev =>
          prev.map(notif =>
            notif.id === id ? { ...notif, leida: true } : notif
          )
        );
        setNotificacionesNoLeidas(prev => Math.max(0, prev - 1));
        return;
      }

      await apiService.marcarNotificacionComoLeida(id);
      
      // Actualizar estado local
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
      await apiService.marcarTodasNotificacionesComoLeidas();
      
      // Actualizar estado local
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

  // Eliminar notificación
  const eliminarNotificacion = useCallback(async (id: string) => {
    if (!estaLogueado) return;

    try {
      // Si es una notificación temporal, solo eliminar localmente
      if (id.startsWith('temp_')) {
        const notifEliminada = notificaciones.find(n => n.id === id);
        setNotificaciones(prev => prev.filter(notif => notif.id !== id));
        
        if (notifEliminada && !notifEliminada.leida) {
          setNotificacionesNoLeidas(prev => Math.max(0, prev - 1));
        }
        return;
      }

      await apiService.eliminarNotificacion(id);
      
      // Actualizar estado local
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

  // Función para formatear tiempo
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

  // Cargar notificaciones al iniciar sesión
  useEffect(() => {
    if (estaLogueado && usuario) {
      cargarNotificaciones();
    } else {
      // Limpiar notificaciones al cerrar sesión
      setNotificaciones([]);
      setNotificacionesNoLeidas(0);
    }
  }, [estaLogueado, usuario, cargarNotificaciones]);

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

  return (
    <NotificacionesContext.Provider value={contextValue}>
      {children}
    </NotificacionesContext.Provider>
  );
};

export const useNotificaciones = (): ContextoNotificaciones => {
  const context = useContext(NotificacionesContext);
  if (context === undefined) {
    // Retornar un objeto vacío para evitar romper el renderizado
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
