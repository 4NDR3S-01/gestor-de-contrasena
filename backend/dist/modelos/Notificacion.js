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
const mongoose_1 = __importStar(require("mongoose"));
// Definición del esquema de Mongoose para las notificaciones
const esquemaNotificacion = new mongoose_1.Schema({
    usuarioId: {
        type: mongoose_1.Schema.Types.ObjectId, // ID del usuario relacionado
        ref: 'Usuario', // Referencia al modelo 'Usuario'
        required: true, // Campo obligatorio
        index: true // Se indexa para acelerar búsquedas por usuario
    },
    tipo: {
        type: String,
        required: true,
        enum: [
            'PASSWORD_CREATED',
            'PASSWORD_UPDATED',
            'PASSWORD_DELETED',
            'PASSWORD_VIEWED',
            'PASSWORD_COPIED',
            'PASSWORD_FAVORITED',
            'WEAK_PASSWORD_DETECTED',
            'DUPLICATE_PASSWORD_DETECTED',
            'OLD_PASSWORD_DETECTED',
            'BREACH_CHECK_COMPLETED',
            'SYNC_STARTED',
            'SYNC_COMPLETED',
            'SYNC_FAILED',
            'BACKUP_CREATED',
            'SESSION_STARTED',
            'SESSION_EXPIRED',
            'LOGIN_ATTEMPT',
            'LOGOUT',
            'CONNECTION_LOST',
            'CONNECTION_RESTORED'
        ]
    },
    titulo: {
        type: String,
        required: true,
        maxlength: 200 // Límite de caracteres para evitar textos largos
    },
    mensaje: {
        type: String,
        required: true,
        maxlength: 1000 // Límite más largo para el cuerpo del mensaje
    },
    datos: {
        type: mongoose_1.Schema.Types.Mixed, // Puede contener cualquier tipo de datos adicionales
        default: null
    },
    leida: {
        type: Boolean,
        default: false, // Por defecto, las notificaciones se crean como no leídas
        index: true // Se indexa para filtrar fácilmente entre leídas y no leídas
    },
    fechaCreacion: {
        type: Date,
        default: Date.now, // Se establece automáticamente al momento de crear
        index: true // Facilita ordenar o filtrar por fecha
    },
    fechaLectura: {
        type: Date,
        default: null // Solo se asigna si la notificación ha sido leída
    }
});
// Índice compuesto para mejorar el rendimiento en búsquedas combinadas
esquemaNotificacion.index({ usuarioId: 1, fechaCreacion: -1 }); // Por usuario y fecha descendente
esquemaNotificacion.index({ usuarioId: 1, leida: 1, fechaCreacion: -1 }); // Por usuario, leída y fecha
// Creación y exportación del modelo basado en el esquema
const Notificacion = mongoose_1.default.model('Notificacion', esquemaNotificacion);
exports.default = Notificacion;
