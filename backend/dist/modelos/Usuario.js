"use strict"; // Activa el modo estricto para mejorar la seguridad y evitar errores comunes

// Funciones auxiliares generadas por TypeScript para manejo de módulos y compatibilidad
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};

// Define que el archivo es un módulo exportable
Object.defineProperty(exports, "__esModule", { value: true });

// Importa mongoose para manejo de esquemas y modelos, y bcryptjs para hashing de contraseñas
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));

// Definición del esquema de Usuario con sus propiedades y validaciones
const esquemaUsuario = new mongoose_1.Schema({
    // Nombre del usuario, obligatorio, sin espacios extra y máximo 50 caracteres
    nombre: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        trim: true,
        maxlength: [50, 'El nombre no puede tener más de 50 caracteres']
    },
    // Email del usuario, obligatorio, único, en minúsculas, validado con expresión regular
    email: {
        type: String,
        required: [true, 'El email es obligatorio'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
    },
    // Hash de la contraseña del usuario, obligatorio
    contrasenaHash: {
        type: String,
        required: [true, 'La contraseña es obligatoria']
    },
    // Hash de la contraseña maestra, obligatorio
    contrasenaMaestra: {
        type: String,
        required: [true, 'La contraseña maestra es obligatoria']
    },
    // Fecha de creación del usuario, por defecto la fecha actual
    fechaCreacion: {
        type: Date,
        default: Date.now
    },
    // Fecha del último acceso del usuario, puede ser null
    fechaUltimoAcceso: {
        type: Date
    },
    // Token para recuperación de contraseña, si aplica
    tokenRecuperacion: String,
    // Fecha de expiración del token de recuperación
    expiracionTokenRecuperacion: Date,
    // Estado de activación del usuario, por defecto activo (true)
    estaActivo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,          // Añade campos createdAt y updatedAt automáticamente
    collection: 'usuarios'    // Nombre de la colección en la base de datos
});

// Método para comparar una contraseña dada con el hash almacenado (contraseña normal)
esquemaUsuario.methods.compararContrasena = async function (contrasena) {
    return bcryptjs_1.default.compare(contrasena, this.contrasenaHash);
};

// Método para comparar una contraseña dada con el hash almacenado (contraseña maestra)
esquemaUsuario.methods.compararContrasenaMaestra = async function (contrasenaMaestra) {
    return bcryptjs_1.default.compare(contrasenaMaestra, this.contrasenaMaestra);
};

// Middleware que se ejecuta antes de guardar un usuario para hashear las contraseñas si fueron modificadas
esquemaUsuario.pre('save', async function (next) {
    // Si ninguna de las contraseñas fue modificada, continúa sin hacer nada
    if (!this.isModified('contrasenaHash') && !this.isModified('contrasenaMaestra')) {
        return next();
    }
    try {
        // Genera un "salt" para el hashing con 12 rondas
        const sal = await bcryptjs_1.default.genSalt(12);
        // Si la contraseña normal fue modificada y es una cadena, la hashea
        if (this.isModified('contrasenaHash') && typeof this.contrasenaHash === 'string') {
            this.contrasenaHash = await bcryptjs_1.default.hash(this.contrasenaHash, sal);
        }
        // Si la contraseña maestra fue modificada y es una cadena, la hashea
        if (this.isModified('contrasenaMaestra') && typeof this.contrasenaMaestra === 'string') {
            this.contrasenaMaestra = await bcryptjs_1.default.hash(this.contrasenaMaestra, sal);
        }
        // Continúa con el guardado
        next();
    }
    catch (error) {
        // Si ocurre un error, pasa el error al siguiente middleware
        next(error);
    }
});

// Exporta el modelo de Usuario para que pueda ser usado en otras partes de la aplicación
exports.default = mongoose_1.default.model('Usuario', esquemaUsuario);
