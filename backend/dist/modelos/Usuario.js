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
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Esquema del Usuario
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
esquemaUsuario.methods.compararContrasena = async function (contrasena) {
    return bcryptjs_1.default.compare(contrasena, this.contrasenaHash);
};
// Método para comparar contraseña maestra
esquemaUsuario.methods.compararContrasenaMaestra = async function (contrasenaMaestra) {
    return bcryptjs_1.default.compare(contrasenaMaestra, this.contrasenaMaestra);
};
// Middleware para hashear contraseña antes de guardar
esquemaUsuario.pre('save', async function (next) {
    if (!this.isModified('contrasenaHash') && !this.isModified('contrasenaMaestra')) {
        return next();
    }
    try {
        const sal = await bcryptjs_1.default.genSalt(12);
        if (this.isModified('contrasenaHash') && typeof this.contrasenaHash === 'string') {
            this.contrasenaHash = await bcryptjs_1.default.hash(this.contrasenaHash, sal);
        }
        if (this.isModified('contrasenaMaestra') && typeof this.contrasenaMaestra === 'string') {
            this.contrasenaMaestra = await bcryptjs_1.default.hash(this.contrasenaMaestra, sal);
        }
        next();
    }
    catch (error) {
        next(error);
    }
});
exports.default = mongoose_1.default.model('Usuario', esquemaUsuario);
