import React, { useState, useEffect } from 'react';
import { Activity, Wifi, WifiOff, Clock } from 'lucide-react'; // Importar íconos para el estado visual
import { useAuth } from '../../contexts/AuthContext'; // Contexto para obtener info del usuario autenticado
import { useSync } from '../../hooks/useSync'; // Hook personalizado para manejar sincronización

interface StatusInfoProps {
  className?: string; // Permite recibir clases CSS externas opcionales
}

const StatusInfo: React.FC<StatusInfoProps> = ({ className = '' }) => {
  // Obtener usuario autenticado desde contexto
  const { usuario } = useAuth();
  // Obtener info de sincronización (última sincronización, estado y función para actualizar)
  const { lastSync, isSyncing, updateSync } = useSync();
  
  // Estado para saber si hay conexión a internet (inicial con el estado actual del navegador)
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Estado para guardar la fecha/hora de la última actividad del usuario
  const [lastActivity, setLastActivity] = useState<Date>(new Date());

  // Efecto para detectar cambios en la conexión (online/offline)
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Si el usuario está autenticado, sincronizar datos automáticamente cuando vuelve la conexión
      if (usuario) {
        updateSync();
      }
    };
    const handleOffline = () => setIsOnline(false);

    // Escuchar eventos de cambio en estado de conexión
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Limpiar listeners al desmontar el componente
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [usuario, updateSync]); // Solo se vuelve a ejecutar si cambia el usuario o la función de sincronización

  // Efecto para actualizar la última actividad según eventos de interacción del usuario
  useEffect(() => {
    // Función que actualiza el estado con la fecha/hora actual
    const updateActivity = () => {
      setLastActivity(new Date());
    };

    // Eventos que indican actividad del usuario
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // Variable para manejar el throttling (limitar la frecuencia de llamadas)
    let timeout: number;
    const throttledUpdate = () => {
      clearTimeout(timeout); // Limpiar timeout anterior
      timeout = setTimeout(updateActivity, 1000); // Esperar 1 segundo antes de actualizar
    };

    // Añadir event listeners para cada evento de actividad
    events.forEach(event => {
      document.addEventListener(event, throttledUpdate, true);
    });

    // Limpiar listeners y timeouts al desmontar
    return () => {
      clearTimeout(timeout);
      events.forEach(event => {
        document.removeEventListener(event, throttledUpdate, true);
      });
    };
  }, []); // Este efecto se ejecuta solo una vez al montar

  // Efecto para sincronizar periódicamente si el usuario está en línea y activo
  useEffect(() => {
    // Si no hay conexión o usuario no autenticado, no hacer nada
    if (!isOnline || !usuario) return;

    // Configurar intervalo para sincronizar cada 2 minutos
    const interval = setInterval(() => {
      const now = new Date();
      const timeSinceActivity = now.getTime() - lastActivity.getTime();
      
      // Solo sincronizar si el usuario ha estado activo en los últimos 5 minutos
      if (timeSinceActivity < 5 * 60 * 1000) {
        updateSync();
      }
    }, 2 * 60 * 1000); // 2 minutos en milisegundos

    // Limpiar intervalo al desmontar o cuando cambien las dependencias
    return () => clearInterval(interval);
  }, [isOnline, usuario, lastActivity, updateSync]);

  // Función para formatear fechas en texto relativo (minutos, horas, días)
  const formatTime = (date: Date | null) => {
    if (!date) return 'Nunca';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins} min`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} h`;
    return `${Math.floor(diffMins / 1440)} días`;
  };

  // Renderizado del componente
  return (
    <div className={`hidden lg:flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 ${className}`}>
      
      {/* Estado de conexión */}
      <div className="flex items-center gap-1">
        {isOnline ? (
          <>
            <Wifi size={14} className="text-green-500" /> {/* Icono wifi verde si está en línea */}
            <span>En línea</span>
          </>
        ) : (
          <>
            <WifiOff size={14} className="text-red-500" /> {/* Icono wifi rojo si está offline */}
            <span>Sin conexión</span>
          </>
        )}
      </div>

      {/* Separador visual */}
      <div className="w-px h-3 bg-gray-300 dark:bg-gray-600" />

      {/* Información de última sincronización */}
      <div className="flex items-center gap-1">
        <Clock size={14} className={isSyncing ? 'animate-spin' : ''} /> {/* Reloj que gira si sincroniza */}
        <span>
          Sync: {isSyncing ? 'Sincronizando...' : formatTime(lastSync)} {/* Texto de estado o tiempo desde última sincronización */}
        </span>
      </div>

      {/* Separador visual */}
      <div className="w-px h-3 bg-gray-300 dark:bg-gray-600" />

      {/* Última actividad del usuario */}
      <div className="flex items-center gap-1">
        <Activity size={14} /> {/* Icono de actividad */}
        <span>Activo: {formatTime(lastActivity)}</span> {/* Tiempo desde la última interacción */}
      </div>
    </div>
  );
};

export default StatusInfo;
