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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs")); // Librería para hashear y comparar contraseñas
// Definición del esquema de Mongoose para usuarios
const esquemaUsuario = new mongoose_1.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        trim: true,
        maxlength: [50, 'El nombre no puede tener más de 50 caracteres']
    },
    email: {
        type: String,
        required: [true, 'El email es obligatorio'],
        unique: true, // No se permite duplicar emails
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
    timestamps: true, // Agrega automáticamente campos createdAt y updatedAt
    collection: 'usuarios' // Define el nombre de la colección en MongoDB
});
// Método para comparar la contraseña ingresada con el hash almacenado
esquemaUsuario.methods.compararContrasena = async function (contrasena) {
    return bcryptjs_1.default.compare(contrasena, this.contrasenaHash);
};
// Método para comparar la contraseña maestra con su hash
esquemaUsuario.methods.compararContrasenaMaestra = async function (contrasenaMaestra) {
    return bcryptjs_1.default.compare(contrasenaMaestra, this.contrasenaMaestra);
};
// Middleware que se ejecuta antes de guardar el documento en la base de datos
esquemaUsuario.pre('save', async function (next) {
    // Si no se modificaron las contraseñas, continuar sin cambios
    if (!this.isModified('contrasenaHash') && !this.isModified('contrasenaMaestra')) {
        return next();
    }
    try {
        const sal = await bcryptjs_1.default.genSalt(12); // Genera una "sal" para hashear
        // Hashea la contraseña principal si ha cambiado
        if (this.isModified('contrasenaHash') && typeof this.contrasenaHash === 'string') {
            this.contrasenaHash = await bcryptjs_1.default.hash(this.contrasenaHash, sal);
        }
        // Hashea la contraseña maestra si ha cambiado
        if (this.isModified('contrasenaMaestra') && typeof this.contrasenaMaestra === 'string') {
            this.contrasenaMaestra = await bcryptjs_1.default.hash(this.contrasenaMaestra, sal);
        }
        next(); // Continúa con el guardado
    }
    catch (error) {
        next(error); // Maneja errores en el proceso de hashing
    }
});
// Exporta el modelo de Usuario para usarlo en otras partes del sistema
exports.default = mongoose_1.default.model('Usuario', esquemaUsuario);
