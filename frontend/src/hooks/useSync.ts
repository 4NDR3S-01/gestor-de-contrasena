import { useState, useEffect, useCallback } from 'react';
import { syncEvents, SYNC_EVENTS } from '../utils/syncEvents';

interface SyncState {
  lastSync: Date | null;
  isSyncing: boolean;
  updateSync: () => void;
}

export const useSync = (): SyncState => {
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Cargar última sincronización del localStorage al inicializar
  useEffect(() => {
    const syncData = localStorage.getItem('lastSync');
    if (syncData) {
      setLastSync(new Date(syncData));
    }
  }, []);

  // Función para actualizar la sincronización
  const updateSync = useCallback(() => {
    setIsSyncing(true);
    const now = new Date();
    
    // Simular un pequeño delay para la sincronización
    setTimeout(() => {
      setLastSync(now);
      localStorage.setItem('lastSync', now.toISOString());
      setIsSyncing(false);
    }, 500);
  }, []);

  // Escuchar eventos de sincronización
  useEffect(() => {
    const handleSyncEvent = () => {
      updateSync();
    };

    // Registrar listeners para todos los eventos de sincronización
    Object.values(SYNC_EVENTS).forEach(event => {
      syncEvents.on(event, handleSyncEvent);
    });

    return () => {
      // Cleanup listeners
      Object.values(SYNC_EVENTS).forEach(event => {
        syncEvents.off(event, handleSyncEvent);
      });
    };
  }, [updateSync]);

  return {
    lastSync,
    isSyncing,
    updateSync
  };
};
