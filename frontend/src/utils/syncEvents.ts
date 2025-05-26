// Sistema de eventos para notificar actualizaciones y eventos del gestor de contraseñas

type EventCallback = (data?: unknown) => void;

class EventEmitter {
  private events: Record<string, EventCallback[]> = {};

  on(event: string, callback: EventCallback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  off(event: string, callback: EventCallback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  emit(event: string, data?: unknown) {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => callback(data));
  }
}

export const syncEvents = new EventEmitter();

// Eventos disponibles
export const SYNC_EVENTS = {
  // Eventos de contraseñas
  PASSWORD_CREATED: 'password_created',
  PASSWORD_UPDATED: 'password_updated',
  PASSWORD_DELETED: 'password_deleted',
  PASSWORD_VIEWED: 'password_viewed',
  PASSWORD_COPIED: 'password_copied',
  PASSWORD_FAVORITED: 'password_favorited',
  
  // Eventos de seguridad
  WEAK_PASSWORD_DETECTED: 'weak_password_detected',
  DUPLICATE_PASSWORD_DETECTED: 'duplicate_password_detected',
  OLD_PASSWORD_DETECTED: 'old_password_detected',
  BREACH_CHECK_COMPLETED: 'breach_check_completed',
  
  // Eventos de sistema
  DATA_FETCHED: 'data_fetched',
  SYNC_STARTED: 'sync_started',
  SYNC_COMPLETED: 'sync_completed',
  SYNC_FAILED: 'sync_failed',
  BACKUP_CREATED: 'backup_created',
  
  // Eventos de sesión
  SESSION_STARTED: 'session_started',
  SESSION_EXPIRED: 'session_expired',
  LOGIN_ATTEMPT: 'login_attempt',
  LOGOUT: 'logout',
  
  // Eventos de conexión
  CONNECTION_LOST: 'connection_lost',
  CONNECTION_RESTORED: 'connection_restored',
} as const;
