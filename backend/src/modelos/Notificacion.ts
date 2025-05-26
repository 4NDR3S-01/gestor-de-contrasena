import mongoose, { Document, Schema } from 'mongoose';

export interface INotificacion extends Document {
  usuarioId: mongoose.Types.ObjectId;
  tipo: string;
  titulo: string;
  mensaje: string;
  datos?: any;
  leida: boolean;
  fechaCreacion: Date;
  fechaLectura?: Date;
}

const esquemaNotificacion: Schema = new Schema({
  usuarioId: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
    index: true
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
    maxlength: 200
  },
  mensaje: {
    type: String,
    required: true,
    maxlength: 1000
  },
  datos: {
    type: Schema.Types.Mixed,
    default: null
  },
  leida: {
    type: Boolean,
    default: false,
    index: true
  },
  fechaCreacion: {
    type: Date,
    default: Date.now,
    index: true
  },
  fechaLectura: {
    type: Date,
    default: null
  }
});

// Índices compuestos para consultas eficientes
esquemaNotificacion.index({ usuarioId: 1, fechaCreacion: -1 });
esquemaNotificacion.index({ usuarioId: 1, leida: 1, fechaCreacion: -1 });

const Notificacion = mongoose.model<INotificacion>('Notificacion', esquemaNotificacion);

export default Notificacion;
