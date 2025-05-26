import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// Interfaz para el documento de Usuario
export interface IUsuario extends Document {
  nombre: string;
  email: string;
  contrasenaHash: string;
  contrasenaMaestra: string;
  fechaCreacion: Date;
  fechaUltimoAcceso?: Date;
  tokenRecuperacion?: string;
  expiracionTokenRecuperacion?: Date;
  estaActivo: boolean;
  compararContrasena(contrasena: string): Promise<boolean>;
  compararContrasenaMaestra(contrasenaMaestra: string): Promise<boolean>;
}

// Esquema del Usuario
const esquemaUsuario: Schema = new Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
    maxlength: [50, 'El nombre no puede tener más de 50 caracteres']
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  contrasenaHash: {
    type: String,
    required: [true, 'La contraseña es obligatoria']
  },
  contrasenaMaestra: {
    type: String,
    required: [true, 'La contraseña maestra es obligatoria']
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  fechaUltimoAcceso: {
    type: Date
  },
  tokenRecuperacion: String,
  expiracionTokenRecuperacion: Date,
  estaActivo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'usuarios'
});

// Método para comparar contraseña
esquemaUsuario.methods.compararContrasena = async function(contrasena: string): Promise<boolean> {
  return bcrypt.compare(contrasena, this.contrasenaHash);
};

// Método para comparar contraseña maestra
esquemaUsuario.methods.compararContrasenaMaestra = async function(contrasenaMaestra: string): Promise<boolean> {
  return bcrypt.compare(contrasenaMaestra, this.contrasenaMaestra);
};

// Middleware para hashear contraseña antes de guardar
esquemaUsuario.pre('save', async function(next) {
  if (!this.isModified('contrasenaHash') && !this.isModified('contrasenaMaestra')) {
    return next();
  }

  try {
    const sal = await bcrypt.genSalt(12);
    
    if (this.isModified('contrasenaHash') && typeof this.contrasenaHash === 'string') {
      this.contrasenaHash = await bcrypt.hash(this.contrasenaHash, sal);
    }
    
    if (this.isModified('contrasenaMaestra') && typeof this.contrasenaMaestra === 'string') {
      this.contrasenaMaestra = await bcrypt.hash(this.contrasenaMaestra, sal);
    }
    
    next();
  } catch (error: any) {
    next(error);
  }
});

export default mongoose.model<IUsuario>('Usuario', esquemaUsuario);
