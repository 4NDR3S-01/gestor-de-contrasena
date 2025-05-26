"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const autenticacion_1 = __importDefault(require("./autenticacion"));
const contrasenas_1 = __importDefault(require("./contrasenas"));
const utilidades_1 = __importDefault(require("./utilidades"));
const notificaciones_1 = __importDefault(require("./notificaciones"));
const router = (0, express_1.Router)();
// Documentación básica de la API
/**
 * @route   GET /api
 * @desc    Información básica de la API
 * @access  Público
 */
router.get('/', (req, res) => {
    res.json({
        exito: true,
        mensaje: 'API del Gestor de Contraseñas',
        version: '1.0.0',
        documentacion: {
            autenticacion: '/api/auth',
            contrasenas: '/api/contrasenas',
            notificaciones: '/api/notificaciones',
            utilidades: '/api/utilidades'
        },
        endpoints: {
            // Autenticación
            'POST /api/auth/registrar': 'Registrar nuevo usuario',
            'POST /api/auth/login': 'Iniciar sesión',
            'POST /api/auth/recuperar-contrasena': 'Solicitar recuperación de contraseña',
            'POST /api/auth/restablecer-contrasena': 'Restablecer contraseña con token',
            'POST /api/auth/verificar-contrasena-maestra': 'Verificar contraseña maestra (requiere auth)',
            'GET /api/auth/perfil': 'Obtener perfil del usuario (requiere auth)',
            'POST /api/auth/cerrar-sesion': 'Cerrar sesión (requiere auth)',
            // Contraseñas
            'GET /api/contrasenas': 'Obtener contraseñas del usuario (requiere auth)',
            'POST /api/contrasenas': 'Crear nueva contraseña (requiere auth)',
            'GET /api/contrasenas/:id': 'Obtener contraseña específica (requiere auth)',
            'PUT /api/contrasenas/:id': 'Actualizar contraseña (requiere auth)',
            'DELETE /api/contrasenas/:id': 'Eliminar contraseña (requiere auth)',
            'PATCH /api/contrasenas/:id/favorito': 'Alternar favorito (requiere auth)',
            'GET /api/contrasenas/estadisticas': 'Obtener estadísticas (requiere auth)',
            // Notificaciones
            'GET /api/notificaciones': 'Obtener notificaciones del usuario (requiere auth)',
            'PUT /api/notificaciones/:id/leer': 'Marcar notificación como leída (requiere auth)',
            'PUT /api/notificaciones/leer-todas': 'Marcar todas las notificaciones como leídas (requiere auth)',
            'DELETE /api/notificaciones/:id': 'Eliminar notificación (requiere auth)',
            // Utilidades
            'GET /api/utilidades/categorias': 'Obtener categorías disponibles',
            'POST /api/utilidades/generar-contrasena': 'Generar contraseña segura',
            'POST /api/utilidades/generar-multiples-contrasenas': 'Generar múltiples contraseñas',
            'POST /api/utilidades/validar-contrasena': 'Validar fortaleza de contraseña',
            'GET /api/utilidades/generador/configuracion': 'Configuración del generador'
        },
        estado: 'Operacional',
        timestamp: new Date().toISOString()
    });
});
// Rutas de la API
router.use('/auth', autenticacion_1.default);
router.use('/contrasenas', contrasenas_1.default);
router.use('/notificaciones', notificaciones_1.default);
router.use('/utilidades', utilidades_1.default);
exports.default = router;
