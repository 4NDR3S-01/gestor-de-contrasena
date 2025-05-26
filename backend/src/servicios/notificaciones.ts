import { crearNotificacion } from '../controladores/notificaciones';

// Mapeo de tipos de eventos a títulos y mensajes de notificaciones
const NOTIFICATION_TEMPLATES = {
  PASSWORD_CREATED: {
    titulo: 'Nueva contraseña guardada',
    mensaje: (datos: any) => `Se ha guardado una nueva contraseña para ${datos?.sitio || 'un sitio'}`
  },
  PASSWORD_UPDATED: {
    titulo: 'Contraseña actualizada',
    mensaje: (datos: any) => `Se ha actualizado la contraseña de ${datos?.sitio || 'un sitio'}`
  },
  PASSWORD_DELETED: {
    titulo: 'Contraseña eliminada',
    mensaje: (datos: any) => `Se ha eliminado la contraseña de ${datos?.sitio || 'un sitio'}`
  },
  PASSWORD_VIEWED: {
    titulo: 'Contraseña visualizada',
    mensaje: (datos: any) => `Se ha visualizado la contraseña de ${datos?.sitio || 'un sitio'}`
  },
  PASSWORD_COPIED: {
    titulo: 'Contraseña copiada',
    mensaje: (datos: any) => `Se ha copiado la contraseña de ${datos?.sitio || 'un sitio'}`
  },
  PASSWORD_FAVORITED: {
    titulo: 'Favorito actualizado',
    mensaje: (datos: any) => `Se ha ${datos?.esFavorito ? 'agregado a' : 'removido de'} favoritos: ${datos?.sitio || 'un sitio'}`
  },
  WEAK_PASSWORD_DETECTED: {
    titulo: 'Contraseña débil detectada',
    mensaje: (datos: any) => `Se detectó una contraseña débil para ${datos?.sitio || 'un sitio'}. Considera actualizarla.`
  },
  DUPLICATE_PASSWORD_DETECTED: {
    titulo: 'Contraseña duplicada detectada',
    mensaje: (datos: any) => `La contraseña de ${datos?.sitio || 'un sitio'} se repite en otras cuentas. Considera usar contraseñas únicas.`
  },
  OLD_PASSWORD_DETECTED: {
    titulo: 'Contraseña antigua detectada',
    mensaje: (datos: any) => `La contraseña de ${datos?.sitio || 'un sitio'} no se ha actualizado en mucho tiempo.`
  },
  BREACH_CHECK_COMPLETED: {
    titulo: 'Verificación de seguridad completada',
    mensaje: (datos: any) => `Se completó la verificación de seguridad. ${datos?.problemasEncontrados || 0} problemas encontrados.`
  },
  SYNC_STARTED: {
    titulo: 'Sincronización iniciada',
    mensaje: () => 'Se ha iniciado la sincronización de datos'
  },
  SYNC_COMPLETED: {
    titulo: 'Sincronización completada',
    mensaje: () => 'La sincronización de datos se completó exitosamente'
  },
  SYNC_FAILED: {
    titulo: 'Error en sincronización',
    mensaje: () => 'Hubo un error durante la sincronización de datos'
  },
  BACKUP_CREATED: {
    titulo: 'Respaldo creado',
    mensaje: () => 'Se ha creado un respaldo de tus datos'
  },
  SESSION_STARTED: {
    titulo: 'Sesión iniciada',
    mensaje: () => 'Has iniciado sesión exitosamente'
  },
  SESSION_EXPIRED: {
    titulo: 'Sesión expirada',
    mensaje: () => 'Tu sesión ha expirado por seguridad'
  },
  LOGIN_ATTEMPT: {
    titulo: 'Intento de acceso',
    mensaje: (datos: any) => `Intento de acceso ${datos?.exitoso ? 'exitoso' : 'fallido'} desde ${datos?.ip || 'IP desconocida'}`
  },
  LOGOUT: {
    titulo: 'Sesión cerrada',
    mensaje: () => 'Has cerrado sesión correctamente'
  },
  CONNECTION_LOST: {
    titulo: 'Conexión perdida',
    mensaje: () => 'Se perdió la conexión con el servidor'
  },
  CONNECTION_RESTORED: {
    titulo: 'Conexión restaurada',
    mensaje: () => 'La conexión con el servidor se ha restaurado'
  }
};

export class ServicioNotificaciones {
  /**
   * Crear una notificación para un usuario específico
   */
  static async crear(
    usuarioId: string,
    tipo: string,
    datos?: any
  ): Promise<void> {
    try {
      const template = NOTIFICATION_TEMPLATES[tipo as keyof typeof NOTIFICATION_TEMPLATES];
      
      if (!template) {
        console.warn(`Tipo de notificación desconocido: ${tipo}`);
        return;
      }

      const titulo = template.titulo;
      const mensaje = template.mensaje(datos);

      await crearNotificacion(usuarioId, tipo, titulo, mensaje, datos);
      
      console.log(`Notificación creada para usuario ${usuarioId}: ${tipo}`);
    } catch (error) {
      console.error('Error al crear notificación:', error);
    }
  }

  /**
   * Crear múltiples notificaciones en lote
   */
  static async crearEnLote(
    usuarioId: string,
    notificaciones: Array<{ tipo: string; datos?: any }>
  ): Promise<void> {
    try {
      for (const notif of notificaciones) {
        await this.crear(usuarioId, notif.tipo, notif.datos);
      }
    } catch (error) {
      console.error('Error al crear notificaciones en lote:', error);
    }
  }

  /**
   * Limpiar notificaciones antiguas (más de 30 días)
   */
  static async limpiarAntiguas(): Promise<void> {
    try {
      const hace30Dias = new Date();
      hace30Dias.setDate(hace30Dias.getDate() - 30);

      // Solo se pueden importar modelos dentro de funciones para evitar dependencias circulares
      const Notificacion = (await import('../modelos/Notificacion')).default;
      
      const resultado = await Notificacion.deleteMany({
        fechaCreacion: { $lt: hace30Dias },
        leida: true
      });

      console.log(`Limpieza de notificaciones: ${resultado.deletedCount} notificaciones eliminadas`);
    } catch (error) {
      console.error('Error al limpiar notificaciones antiguas:', error);
    }
  }
}

export default ServicioNotificaciones;
