import React, { useState, useEffect } from 'react';
import { Activity, Wifi, WifiOff, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSync } from '../../hooks/useSync';

interface StatusInfoProps {
  className?: string;
}

const StatusInfo: React.FC<StatusInfoProps> = ({ className = '' }) => {
  const { usuario } = useAuth();
  const { lastSync, isSyncing, updateSync } = useSync();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastActivity, setLastActivity] = useState<Date>(new Date());

  // Detectar cambios en la conexión
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Sincronizar automáticamente cuando se recupere la conexión
      if (usuario) {
        updateSync();
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [usuario, updateSync]);

  // Actualizar última actividad en movimientos del mouse, clicks, etc.
  useEffect(() => {
    const updateActivity = () => {
      setLastActivity(new Date());
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // Throttle para evitar actualizaciones excesivas
    let timeout: number;
    const throttledUpdate = () => {
      clearTimeout(timeout);
      timeout = setTimeout(updateActivity, 1000);
    };

    events.forEach(event => {
      document.addEventListener(event, throttledUpdate, true);
    });

    return () => {
      clearTimeout(timeout);
      events.forEach(event => {
        document.removeEventListener(event, throttledUpdate, true);
      });
    };
  }, []);

  // Sincronización periódica cuando el usuario está activo
  useEffect(() => {
    if (!isOnline || !usuario) return;

    const interval = setInterval(() => {
      const now = new Date();
      const timeSinceActivity = now.getTime() - lastActivity.getTime();
      
      // Solo sincronizar si el usuario ha estado activo en los últimos 5 minutos
      if (timeSinceActivity < 5 * 60 * 1000) {
        updateSync();
      }
    }, 2 * 60 * 1000); // Cada 2 minutos

    return () => clearInterval(interval);
  }, [isOnline, usuario, lastActivity, updateSync]);

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

  return (
    <div className={`hidden lg:flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 ${className}`}>
      {/* Estado de conexión */}
      <div className="flex items-center gap-1">
        {isOnline ? (
          <>
            <Wifi size={14} className="text-green-500" />
            <span>En línea</span>
          </>
        ) : (
          <>
            <WifiOff size={14} className="text-red-500" />
            <span>Sin conexión</span>
          </>
        )}
      </div>

      {/* Separador */}
      <div className="w-px h-3 bg-gray-300 dark:bg-gray-600" />

      {/* Última sincronización */}
      <div className="flex items-center gap-1">
        <Clock size={14} className={isSyncing ? 'animate-spin' : ''} />
        <span>
          Sync: {isSyncing ? 'Sincronizando...' : formatTime(lastSync)}
        </span>
      </div>

      {/* Separador */}
      <div className="w-px h-3 bg-gray-300 dark:bg-gray-600" />

      {/* Última actividad */}
      <div className="flex items-center gap-1">
        <Activity size={14} />
        <span>Activo: {formatTime(lastActivity)}</span>
      </div>
    </div>
  );
};

export default StatusInfo;
