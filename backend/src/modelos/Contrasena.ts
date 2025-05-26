import mongoose, { Document, Schema } from 'mongoose';

// Enumeración para categorías
export enum CategoriaContrasena {
  TRABAJO = 'trabajo',
  PERSONAL = 'personal',
  REDES_SOCIALES = 'redes_sociales',
  BANCOS = 'bancos',
  COMPRAS = 'compras',
  ENTRETENIMIENTO = 'entretenimiento',
  OTROS = 'otros'
}

// Interfaz para el documento de Contraseña
export interface IContrasena extends Document {
  usuarioId: mongoose.Types.ObjectId;
  titulo: string;
  url?: string;
  usuario?: string;
  email?: string;
  contrasenaEncriptada: string;
  notas?: string;
  categoria: CategoriaContrasena;
  esFavorito: boolean;
  fechaCreacion: Date;
  fechaModificacion: Date;
  historialContrasenas?: Array<{
    contrasenaEncriptada: string;
    fechaCambio: Date;
  }>;
}

// Esquema de Contraseña
const esquemaContrasena: Schema = new Schema({
  usuarioId: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El ID del usuario es obligatorio']
  },
  titulo: {
    type: String,
    required: [true, 'El título es obligatorio'],
    trim: true,
    maxlength: [100, 'El título no puede tener más de 100 caracteres']
  },
  url: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // URL es opcional
        return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(v);
      },
      message: 'URL inválida'
    }
  },
  usuario: {
    type: String,
    trim: true,
    maxlength: [100, 'El usuario no puede tener más de 100 caracteres']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Email es opcional
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Email inválido'
    }
  },
  contrasenaEncriptada: {
    type: String,
    required: [true, 'La contraseña encriptada es obligatoria']
  },
  notas: {
    type: String,
    trim: true,
    maxlength: [500, 'Las notas no pueden tener más de 500 caracteres']
  },
  categoria: {
    type: String,
    enum: Object.values(CategoriaContrasena),
    default: CategoriaContrasena.OTROS,
    required: true
  },
  esFavorito: {
    type: Boolean,
    default: false
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  fechaModificacion: {
    type: Date,
    default: Date.now
  },
  historialContrasenas: [{
    contrasenaEncriptada: {
      type: String,
      required: true
    },
    fechaCambio: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  collection: 'contrasenas'
});

// Middleware para actualizar fechaModificacion
esquemaContrasena.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.fechaModificacion = new Date();
  }
  next();
});

// Índices para mejorar rendimiento
esquemaContrasena.index({ usuarioId: 1, titulo: 'text', categoria: 1 });
esquemaContrasena.index({ usuarioId: 1, esFavorito: -1 });

export default mongoose.model<IContrasena>('Contrasena', esquemaContrasena);
