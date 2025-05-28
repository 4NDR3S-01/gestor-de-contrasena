"use strict";
// Función para manejo de importaciones por defecto (compatibilidad ES modules)
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });

const express_1 = __importDefault(require("express")); // Framework web para Node.js
const cors_1 = __importDefault(require("cors")); // Middleware para habilitar CORS
const helmet_1 = __importDefault(require("helmet")); // Middleware para seguridad HTTP headers
const express_rate_limit_1 = __importDefault(require("express-rate-limit")); // Middleware para limitar la tasa de peticiones
const dotenv_1 = __importDefault(require("dotenv")); // Cargar variables de entorno desde archivo .env
const baseDatos_1 = require("./configuracion/baseDatos"); // Configuración y conexión a base de datos
const rutas_1 = __importDefault(require("./rutas")); // Rutas de la API

// Cargar variables de entorno desde archivo .env
dotenv_1.default.config();

// Crear instancia de aplicación Express
const app = (0, express_1.default)();

// Puerto donde se ejecutará el servidor (por defecto 5000 si no está en variables de entorno)
const PUERTO = process.env.PUERTO ?? 5000;

// Conectar a la base de datos
(0, baseDatos_1.conectarBaseDatos)();

// Configurar cabeceras HTTP para seguridad con Helmet
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"], // Solo permitir recursos desde el mismo origen
            styleSrc: ["'self'", "'unsafe-inline'"], // Permitir estilos propios y en línea
            scriptSrc: ["'self'"], // Solo scripts desde mismo origen
            objectSrc: ["'none'"], // Bloquear objetos como <object>, <embed>
            upgradeInsecureRequests: [], // Forzar recursos inseguros a HTTPS
        },
    },
}));

// Configurar CORS (Cross-Origin Resource Sharing)
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production' // Orígenes permitidos según entorno
        ? ['https://tu-dominio.com'] // En producción solo tu dominio real
        : ['http://localhost:3000', 'http://localhost:5173'], // En desarrollo puertos comunes
    credentials: true, // Permitir enviar cookies y cabeceras de autenticación
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // Métodos HTTP permitidos
    allowedHeaders: ['Content-Type', 'Authorization'] // Cabeceras permitidas
}));

// Limitador general para todas las solicitudes (máximo 100 por IP cada 15 minutos)
const limitadorGeneral = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos en milisegundos
    max: 100, // límite de peticiones por IP
    message: {
        exito: false,
        mensaje: 'Demasiadas solicitudes desde esta IP. Intenta nuevamente en 15 minutos.'
    },
    standardHeaders: true, // Enviar headers estándar RateLimit
    legacyHeaders: false, // No usar headers legacy
});

// Limitador especial para rutas de autenticación (máximo 5 intentos por IP cada 15 minutos)
const limitadorAutenticacion = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // límite de intentos
    message: {
        exito: false,
        mensaje: 'Demasiados intentos de inicio de sesión. Intenta nuevamente en 15 minutos.'
    },
    skipSuccessfulRequests: true, // No contar intentos exitosos
});

// Aplicar limitador general a todas las rutas
app.use(limitadorGeneral);

// Middleware para parsear JSON con límite de 10MB
app.use(express_1.default.json({ limit: '10mb' }));

// Middleware para parsear datos urlencoded (formularios), también con límite 10MB
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));

// Ruta para verificar que el servidor está activo (health check)
app.get('/api/salud', (req, res) => {
    res.json({
        exito: true,
        mensaje: 'Servidor funcionando correctamente',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Usar las rutas definidas en el módulo rutas, bajo el prefijo /api
app.use('/api', rutas_1.default);

// Middleware para manejar rutas no encontradas (404)
app.use('*', (req, res) => {
    res.status(404).json({
        exito: false,
        mensaje: 'Ruta no encontrada'
    });
});

// Middleware global para manejar errores
app.use((error, req, res, next) => {
    console.error('Error del servidor:', error); // Loguear el error
    res.status(error.status ?? 500).json({
        exito: false,
        mensaje: process.env.NODE_ENV === 'production'
            ? 'Error interno del servidor' // Mensaje genérico en producción
            : error.message, // Mensaje detallado en desarrollo
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }) // Mostrar stack en desarrollo
    });
});

// Iniciar el servidor en el puerto configurado
app.listen(PUERTO, () => {
    console.log(`🚀 Servidor ejecutándose en puerto ${PUERTO}`);
    console.log(`🌍 Entorno: ${process.env.NODE_ENV ?? 'development'}`);
    console.log(`📚 API disponible en: http://localhost:${PUERTO}/api`);
});

// Manejo de señales para cerrar el servidor de forma limpia
process.on('SIGTERM', () => {
    console.log('🔴 Cerrando servidor...');
    process.exit(0);
});
process.on('SIGINT', () => {
    console.log('🔴 Cerrando servidor...');
    process.exit(0);
});

// Exportar la app para pruebas o uso externo
exports.default = app;
