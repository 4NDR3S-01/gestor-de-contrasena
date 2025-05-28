"use strict"; // Activa el modo estricto de JavaScript para evitar errores comunes

// Funciones auxiliares generadas por TypeScript para manejar enlaces y compatibilidad entre módulos
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

// Define que este archivo es un módulo ES exportable
Object.defineProperty(exports, "__esModule", { value: true });

// Importa mongoose y todo su contenido para usar schemas y modelos
const mongoose_1 = __importStar(require("mongoose"));

// Definición del esquema de notificaciones en la base de datos
const esquemaNotificacion = new mongoose_1.Schema({
    // Referencia al usuario al que pertenece la notificación (obligatorio)
    usuarioId: {
        type: mongoose_1.Schema.Types.ObjectId, // Tipo ObjectId de MongoDB
        ref: 'Usuario', // Referencia a la colección Usuario
        required: true,
        index: true // Índice para optimizar consultas por usuario
    },
    // Tipo de notificación, restringido a un conjunto definido de valores (enum)
    tipo: {
        type: String,
        required: true,
        enum: [
            'PASSWORD_CREATED',            // Contraseña creada
            'PASSWORD_UPDATED',            // Contraseña actualizada
            'PASSWORD_DELETED',            // Contraseña eliminada
            'PASSWORD_VIEWED',             // Contraseña vista
            'PASSWORD_COPIED',             // Contraseña copiada
            'PASSWORD_FAVORITED',          // Contraseña marcada como favorita
            'WEAK_PASSWORD_DETECTED',      // Contraseña débil detectada
            'DUPLICATE_PASSWORD_DETECTED', // Contraseña duplicada detectada
            'OLD_PASSWORD_DETECTED',       // Contraseña antigua detectada
            'BREACH_CHECK_COMPLETED',      // Revisión de brechas completada
            'SYNC_STARTED',                // Sincronización iniciada
            'SYNC_COMPLETED',              // Sincronización completada
            'SYNC_FAILED',                 // Sincronización fallida
            'BACKUP_CREATED',              // Respaldo creado
            'SESSION_STARTED',             // Sesión iniciada
            'SESSION_EXPIRED',             // Sesión expirada
            'LOGIN_ATTEMPT',               // Intento de inicio de sesión
            'LOGOUT',                     // Cierre de sesión
            'CONNECTION_LOST',             // Conexión perdida
            'CONNECTION_RESTORED'          // Conexión restaurada
        ]
    },
    // Título breve de la notificación (obligatorio, max 200 caracteres)
    titulo: {
        type: String,
        required: true,
        maxlength: 200
    },
    // Mensaje completo de la notificación (obligatorio, max 1000 caracteres)
    mensaje: {
        type: String,
        required: true,
        maxlength: 1000
    },
    // Datos extra o adicionales que puedan venir con la notificación
    datos: {
        type: mongoose_1.Schema.Types.Mixed, // Tipo libre (puede ser cualquier dato)
        default: null // Valor por defecto null si no hay datos adicionales
    },
    // Marca si la notificación ha sido leída o no (default: false)
    leida: {
        type: Boolean,
        default: false,
        index: true // Índice para consultas por estado leído/no leído
    },
    // Fecha de creación de la notificación (default: fecha actual)
    fechaCreacion: {
        type: Date,
        default: Date.now,
        index: true // Índice para orden y consultas por fecha
    },
    // Fecha en que la notificación fue leída, null si no se ha leído aún
    fechaLectura: {
        type: Date,
        default: null
    }
});

// Índices compuestos para mejorar rendimiento de consultas frecuentes:
// Buscar notificaciones por usuario ordenadas de más reciente a más antigua
esquemaNotificacion.index({ usuarioId: 1, fechaCreacion: -1 });

// Buscar notificaciones filtrando además por estado leído o no leído, ordenadas por fecha
esquemaNotificacion.index({ usuarioId: 1, leida: 1, fechaCreacion: -1 });

// Crear el modelo de Mongoose basado en el esquema definido, llamado 'Notificacion'
const Notificacion = mongoose_1.default.model('Notificacion', esquemaNotificacion);

// Exporta el modelo para usarlo en otras partes de la aplicación
exports.default = Notificacion;
