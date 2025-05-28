import { useState, useEffect, useCallback } from 'react';
import { syncEvents, SYNC_EVENTS } from '../utils/syncEvents';

// Interfaz que define el estado y funciones del hook useSync
interface SyncState {
  lastSync: Date | null;   // Fecha de la última sincronización
  isSyncing: boolean;      // Estado de si está sincronizando ahora
  updateSync: () => void;  // Función para actualizar la sincronización
}

// Hook personalizado para manejar sincronización basada en eventos
export const useSync = (): SyncState => {
  // Estado local para la fecha de la última sincronización
  const [lastSync, setLastSync] = useState<Date | null>(null);
  // Estado local para indicar si está sincronizando
  const [isSyncing, setIsSyncing] = useState(false);

  // Al montar el componente, cargar la última fecha de sincronización guardada en localStorage
  useEffect(() => {
    const syncData = localStorage.getItem('lastSync');
    if (syncData) {
      setLastSync(new Date(syncData)); // Convertir string a Date y actualizar estado
    }
  }, []);

  // Función para actualizar la sincronización (usando useCallback para memorizar la función)
  const updateSync = useCallback(() => {
    setIsSyncing(true);  // Indicar que empieza la sincronización
    const now = new Date();

    // Simular una espera de 500ms para la sincronización (p.ej. llamada a API)
    setTimeout(() => {
      setLastSync(now);  // Actualizar la última sincronización con la hora actual
      localStorage.setItem('lastSync', now.toISOString()); // Guardar en localStorage
      setIsSyncing(false); // Indicar que terminó la sincronización
    }, 500);
  }, []);

  // useEffect para registrar los listeners de eventos de sincronización al montar el componente
  useEffect(() => {
    // Función que se ejecuta cuando ocurre un evento de sincronización
    const handleSyncEvent = () => {
      updateSync();  // Actualizar sincronización cuando se detecta un evento
    };

    // Registrar handleSyncEvent para todos los eventos definidos en SYNC_EVENTS
    Object.values(SYNC_EVENTS).forEach(event => {
      syncEvents.on(event, handleSyncEvent);
    });

    // Cleanup: eliminar los listeners al desmontar el componente
    return () => {
      Object.values(SYNC_EVENTS).forEach(event => {
        syncEvents.off(event, handleSyncEvent);
      });
    };
  }, [updateSync]);

  // Devolver el estado y función para usar en componentes que consuman este hook
  return {
    lastSync,
    isSyncing,
    updateSync
  };
};
