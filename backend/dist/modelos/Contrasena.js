"use strict"; // Modo estricto para evitar errores comunes en JavaScript/TypeScript

// Funciones auxiliares generadas por TypeScript para manejar la interoperabilidad entre módulos CommonJS y ES Modules
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

// Define el módulo para exportación
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoriaContrasena = void 0;

// Importa Mongoose y sus funciones usando import *
const mongoose_1 = __importStar(require("mongoose"));

/**
 * Enumeración de categorías posibles para una contraseña.
 * Esto permite clasificar las contraseñas según su propósito.
 */
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

/**
 * Esquema de Mongoose que define cómo se estructura un documento de contraseña
 * en la base de datos MongoDB.
 */
const esquemaContrasena = new mongoose_1.Schema({
    // ID del usuario dueño de la contraseña (relación con la colección Usuario)
    usuarioId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'El ID del usuario es obligatorio']
    },
    // Título de la contraseña para identificarla fácilmente
    titulo: {
        type: String,
        required: [true, 'El título es obligatorio'],
        trim: true,
        maxlength: [100, 'El título no puede tener más de 100 caracteres']
    },
    // URL opcional asociada con la contraseña (validada con regex)
    url: {
        type: String,
        trim: true,
        validate: {
            validator: function (v) {
                if (!v) return true; // Si no se proporciona, es válido
                return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(v);
            },
            message: 'URL inválida'
        }
    },
    // Usuario o nombre de cuenta (opcional)
    usuario: {
        type: String,
        trim: true,
        maxlength: [100, 'El usuario no puede tener más de 100 caracteres']
    },
    // Email opcional, validado con expresión regular
    email: {
        type: String,
        trim: true,
        lowercase: true,
        validate: {
            validator: function (v) {
                if (!v) return true; // Si no hay email, también es válido
                return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
            },
            message: 'Email inválido'
        }
    },
    // Contraseña encriptada (obligatoria)
    contrasenaEncriptada: {
        type: String,
        required: [true, 'La contraseña encriptada es obligatoria']
    },
    // Campo para notas adicionales (opcional)
    notas: {
        type: String,
        trim: true,
        maxlength: [500, 'Las notas no pueden tener más de 500 caracteres']
    },
    // Categoría de la contraseña (debe estar en el enum)
    categoria: {
        type: String,
        enum: Object.values(CategoriaContrasena),
        default: CategoriaContrasena.OTROS,
        required: true
    },
    // Marca si la contraseña es favorita del usuario
    esFavorito: {
        type: Boolean,
        default: false
    },
    // Fecha en la que se creó la contraseña
    fechaCreacion: {
        type: Date,
        default: Date.now
    },
    // Fecha en la que fue modificada por última vez
    fechaModificacion: {
        type: Date,
        default: Date.now
    },
    // Historial de contraseñas anteriores (útil para auditorías o rollback)
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
    timestamps: true, // Agrega automáticamente createdAt y updatedAt
    collection: 'contrasenas' // Nombre explícito de la colección en MongoDB
});

/**
 * Middleware que se ejecuta antes de guardar un documento.
 * Actualiza la fechaModificacion si hubo cambios.
 */
esquemaContrasena.pre('save', function (next) {
    if (this.isModified() && !this.isNew) {
        this.fechaModificacion = new Date();
    }
    next();
});

// Índice de texto para mejorar búsquedas por usuarioId, título y categoría
esquemaContrasena.index({ usuarioId: 1, titulo: 'text', categoria: 1 });

// Índice para ordenar por usuarioId y favoritos (esFavorito)
esquemaContrasena.index({ usuarioId: 1, esFavorito: -1 });

// Se exporta el modelo 'Contrasena' basado en el esquema definido
exports.default = mongoose_1.default.model('Contrasena', esquemaContrasena);
