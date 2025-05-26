"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServicioNotificaciones = void 0;
const notificaciones_1 = require("../controladores/notificaciones");
// Mapeo de tipos de eventos a títulos y mensajes de notificaciones
const NOTIFICATION_TEMPLATES = {
    PASSWORD_CREATED: {
        titulo: 'Nueva contraseña guardada',
        mensaje: (datos) => `Se ha guardado una nueva contraseña para ${datos?.sitio || 'un sitio'}`
    },
    PASSWORD_UPDATED: {
        titulo: 'Contraseña actualizada',
        mensaje: (datos) => `Se ha actualizado la contraseña de ${datos?.sitio || 'un sitio'}`
    },
    PASSWORD_DELETED: {
        titulo: 'Contraseña eliminada',
        mensaje: (datos) => `Se ha eliminado la contraseña de ${datos?.sitio || 'un sitio'}`
    },
    PASSWORD_VIEWED: {
        titulo: 'Contraseña visualizada',
        mensaje: (datos) => `Se ha visualizado la contraseña de ${datos?.sitio || 'un sitio'}`
    },
    PASSWORD_COPIED: {
        titulo: 'Contraseña copiada',
        mensaje: (datos) => `Se ha copiado la contraseña de ${datos?.sitio || 'un sitio'}`
    },
    PASSWORD_FAVORITED: {
        titulo: 'Favorito actualizado',
        mensaje: (datos) => `Se ha ${datos?.esFavorito ? 'agregado a' : 'removido de'} favoritos: ${datos?.sitio || 'un sitio'}`
    },
    WEAK_PASSWORD_DETECTED: {
        titulo: 'Contraseña débil detectada',
        mensaje: (datos) => `Se detectó una contraseña débil para ${datos?.sitio || 'un sitio'}. Considera actualizarla.`
    },
    DUPLICATE_PASSWORD_DETECTED: {
        titulo: 'Contraseña duplicada detectada',
        mensaje: (datos) => `La contraseña de ${datos?.sitio || 'un sitio'} se repite en otras cuentas. Considera usar contraseñas únicas.`
    },
    OLD_PASSWORD_DETECTED: {
        titulo: 'Contraseña antigua detectada',
        mensaje: (datos) => `La contraseña de ${datos?.sitio || 'un sitio'} no se ha actualizado en mucho tiempo.`
    },
    BREACH_CHECK_COMPLETED: {
        titulo: 'Verificación de seguridad completada',
        mensaje: (datos) => `Se completó la verificación de seguridad. ${datos?.problemasEncontrados || 0} problemas encontrados.`
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
        mensaje: (datos) => `Intento de acceso ${datos?.exitoso ? 'exitoso' : 'fallido'} desde ${datos?.ip || 'IP desconocida'}`
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
class ServicioNotificaciones {
    /**
     * Crear una notificación para un usuario específico
     */
    static async crear(usuarioId, tipo, datos) {
        try {
            const template = NOTIFICATION_TEMPLATES[tipo];
            if (!template) {
                console.warn(`Tipo de notificación desconocido: ${tipo}`);
                return;
            }
            const titulo = template.titulo;
            const mensaje = template.mensaje(datos);
            await (0, notificaciones_1.crearNotificacion)(usuarioId, tipo, titulo, mensaje, datos);
            console.log(`Notificación creada para usuario ${usuarioId}: ${tipo}`);
        }
        catch (error) {
            console.error('Error al crear notificación:', error);
        }
    }
    /**
     * Crear múltiples notificaciones en lote
     */
    static async crearEnLote(usuarioId, notificaciones) {
        try {
            for (const notif of notificaciones) {
                await this.crear(usuarioId, notif.tipo, notif.datos);
            }
        }
        catch (error) {
            console.error('Error al crear notificaciones en lote:', error);
        }
    }
    /**
     * Limpiar notificaciones antiguas (más de 30 días)
     */
    static async limpiarAntiguas() {
        try {
            const hace30Dias = new Date();
            hace30Dias.setDate(hace30Dias.getDate() - 30);
            // Solo se pueden importar modelos dentro de funciones para evitar dependencias circulares
            const Notificacion = (await Promise.resolve().then(() => __importStar(require('../modelos/Notificacion')))).default;
            const resultado = await Notificacion.deleteMany({
                fechaCreacion: { $lt: hace30Dias },
                leida: true
            });
            console.log(`Limpieza de notificaciones: ${resultado.deletedCount} notificaciones eliminadas`);
        }
        catch (error) {
            console.error('Error al limpiar notificaciones antiguas:', error);
        }
    }
}
exports.ServicioNotificaciones = ServicioNotificaciones;
exports.default = ServicioNotificaciones;
