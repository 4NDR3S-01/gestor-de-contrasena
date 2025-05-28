import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs'; // Librería para hashear y comparar contraseñas

// Interfaz que define la estructura y métodos de un documento Usuario
export interface IUsuario extends Document {
  nombre: string;                          // Nombre del usuario
  email: string;                           // Correo electrónico
  contrasenaHash: string;                  // Contraseña principal hasheada
  contrasenaMaestra: string;               // Segunda contraseña hasheada (por seguridad extra)
  fechaCreacion: Date;                     // Fecha de registro
  fechaUltimoAcceso?: Date;                // Última vez que accedió
  tokenRecuperacion?: string;              // Token para recuperar cuenta
  expiracionTokenRecuperacion?: Date;      // Fecha de expiración del token
  estaActivo: boolean;                     // Estado de la cuenta
  compararContrasena(contrasena: string): Promise<boolean>;           // Método para verificar contraseña
  compararContrasenaMaestra(contrasenaMaestra: string): Promise<boolean>; // Verificar la contraseña maestra
}

// Definición del esquema de Mongoose para usuarios
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
    unique: true,                                  // No se permite duplicar emails
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido'] // Validación con regex
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
  timestamps: true,                // Agrega automáticamente campos createdAt y updatedAt
  collection: 'usuarios'          // Define el nombre de la colección en MongoDB
});

// Método para comparar la contraseña ingresada con el hash almacenado
esquemaUsuario.methods.compararContrasena = async function(contrasena: string): Promise<boolean> {
  return bcrypt.compare(contrasena, this.contrasenaHash);
};

// Método para comparar la contraseña maestra con su hash
esquemaUsuario.methods.compararContrasenaMaestra = async function(contrasenaMaestra: string): Promise<boolean> {
  return bcrypt.compare(contrasenaMaestra, this.contrasenaMaestra);
};

// Middleware que se ejecuta antes de guardar el documento en la base de datos
esquemaUsuario.pre('save', async function(next) {
  // Si no se modificaron las contraseñas, continuar sin cambios
  if (!this.isModified('contrasenaHash') && !this.isModified('contrasenaMaestra')) {
    return next();
  }

  try {
    const sal = await bcrypt.genSalt(12); // Genera una "sal" para hashear

    // Hashea la contraseña principal si ha cambiado
    if (this.isModified('contrasenaHash') && typeof this.contrasenaHash === 'string') {
      this.contrasenaHash = await bcrypt.hash(this.contrasenaHash, sal);
    }

    // Hashea la contraseña maestra si ha cambiado
    if (this.isModified('contrasenaMaestra') && typeof this.contrasenaMaestra === 'string') {
      this.contrasenaMaestra = await bcrypt.hash(this.contrasenaMaestra, sal);
    }

    next(); // Continúa con el guardado
  } catch (error: any) {
    next(error); // Maneja errores en el proceso de hashing
  }
});

// Exporta el modelo de Usuario para usarlo en otras partes del sistema
export default mongoose.model<IUsuario>('Usuario', esquemaUsuario);
