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
exports.CategoriaContrasena = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Enumeración para categorías
var CategoriaContrasena;
(function (CategoriaContrasena) {
    CategoriaContrasena["TRABAJO"] = "trabajo";
    CategoriaContrasena["PERSONAL"] = "personal";
    CategoriaContrasena["REDES_SOCIALES"] = "redes_sociales";
    CategoriaContrasena["BANCOS"] = "bancos";
    CategoriaContrasena["COMPRAS"] = "compras";
    CategoriaContrasena["ENTRETENIMIENTO"] = "entretenimiento";
    CategoriaContrasena["OTROS"] = "otros";
})(CategoriaContrasena || (exports.CategoriaContrasena = CategoriaContrasena = {}));
// Esquema de Contraseña
const esquemaContrasena = new mongoose_1.Schema({
    usuarioId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
            validator: function (v) {
                if (!v)
                    return true; // URL es opcional
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
            validator: function (v) {
                if (!v)
                    return true; // Email es opcional
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
esquemaContrasena.pre('save', function (next) {
    if (this.isModified() && !this.isNew) {
        this.fechaModificacion = new Date();
    }
    next();
});
// Índices para mejorar rendimiento
esquemaContrasena.index({ usuarioId: 1, titulo: 'text', categoria: 1 });
esquemaContrasena.index({ usuarioId: 1, esFavorito: -1 });
exports.default = mongoose_1.default.model('Contrasena', esquemaContrasena);
