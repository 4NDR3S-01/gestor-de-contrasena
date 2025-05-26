"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const baseDatos_1 = require("./configuracion/baseDatos");
const rutas_1 = __importDefault(require("./rutas"));
// Configurar variables de entorno
dotenv_1.default.config();
// Crear aplicación Express
const app = (0, express_1.default)();
const PUERTO = process.env.PUERTO ?? 5000;
// Conectar a la base de datos
(0, baseDatos_1.conectarBaseDatos)();
// Configuración de seguridad
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
}));
// Configuración de CORS
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://tu-dominio.com']
        : ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// Limitador de velocidad (rate limiting)
const limitadorGeneral = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Máximo 100 requests por IP cada 15 minutos
    message: {
        exito: false,
        mensaje: 'Demasiadas solicitudes desde esta IP. Intenta nuevamente en 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
const limitadorAutenticacion = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // Máximo 5 intentos de login por IP cada 15 minutos
    message: {
        exito: false,
        mensaje: 'Demasiados intentos de inicio de sesión. Intenta nuevamente en 15 minutos.'
    },
    skipSuccessfulRequests: true,
});
// Middleware básico
app.use(limitadorGeneral);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Rutas de salud y estado
app.get('/api/salud', (req, res) => {
    res.json({
        exito: true,
        mensaje: 'Servidor funcionando correctamente',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});
// Usar rutas de la API
app.use('/api', rutas_1.default);
// Middleware para rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({
        exito: false,
        mensaje: 'Ruta no encontrada'
    });
});
// Middleware global de manejo de errores
app.use((error, req, res, next) => {
    console.error('Error del servidor:', error);
    res.status(error.status ?? 500).json({
        exito: false,
        mensaje: process.env.NODE_ENV === 'production'
            ? 'Error interno del servidor'
            : error.message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
});
// Iniciar servidor
app.listen(PUERTO, () => {
    console.log(`🚀 Servidor ejecutándose en puerto ${PUERTO}`);
    console.log(`🌍 Entorno: ${process.env.NODE_ENV ?? 'development'}`);
    console.log(`📚 API disponible en: http://localhost:${PUERTO}/api`);
});
// Manejo elegante del cierre del servidor
process.on('SIGTERM', () => {
    console.log('🔴 Cerrando servidor...');
    process.exit(0);
});
process.on('SIGINT', () => {
    console.log('🔴 Cerrando servidor...');
    process.exit(0);
});
exports.default = app;
