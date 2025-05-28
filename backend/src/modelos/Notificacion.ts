import mongoose, { Document, Schema } from 'mongoose';

// Interfaz que define la estructura de una notificación
export interface INotificacion extends Document {
  usuarioId: mongoose.Types.ObjectId; // Referencia al usuario dueño de la notificación
  tipo: string;                        // Tipo de notificación (ver lista de enums más abajo)
  titulo: string;                     // Título de la notificación
  mensaje: string;                    // Contenido del mensaje
  datos?: any;                        // Información adicional asociada
  leida: boolean;                     // Estado de lectura
  fechaCreacion: Date;               // Fecha en que se creó
  fechaLectura?: Date;               // Fecha en que fue leída
}

// Definición del esquema de Mongoose para las notificaciones
const esquemaNotificacion: Schema = new Schema({
  usuarioId: {
    type: Schema.Types.ObjectId,     // ID del usuario relacionado
    ref: 'Usuario',                  // Referencia al modelo 'Usuario'
    required: true,                  // Campo obligatorio
    index: true                      // Se indexa para acelerar búsquedas por usuario
  },
  tipo: {
    type: String,
    required: true,
    enum: [                          // Lista de tipos válidos de notificación
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
    maxlength: 200                   // Límite de caracteres para evitar textos largos
  },
  mensaje: {
    type: String,
    required: true,
    maxlength: 1000                 // Límite más largo para el cuerpo del mensaje
  },
  datos: {
    type: Schema.Types.Mixed,       // Puede contener cualquier tipo de datos adicionales
    default: null
  },
  leida: {
    type: Boolean,
    default: false,                 // Por defecto, las notificaciones se crean como no leídas
    index: true                     // Se indexa para filtrar fácilmente entre leídas y no leídas
  },
  fechaCreacion: {
    type: Date,
    default: Date.now,              // Se establece automáticamente al momento de crear
    index: true                     // Facilita ordenar o filtrar por fecha
  },
  fechaLectura: {
    type: Date,
    default: null                   // Solo se asigna si la notificación ha sido leída
  }
});

// Índice compuesto para mejorar el rendimiento en búsquedas combinadas
esquemaNotificacion.index({ usuarioId: 1, fechaCreacion: -1 }); // Por usuario y fecha descendente
esquemaNotificacion.index({ usuarioId: 1, leida: 1, fechaCreacion: -1 }); // Por usuario, leída y fecha

// Creación y exportación del modelo basado en el esquema
const Notificacion = mongoose.model<INotificacion>('Notificacion', esquemaNotificacion);

export default Notificacion;
