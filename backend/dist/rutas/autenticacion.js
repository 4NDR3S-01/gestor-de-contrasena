"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const autenticacion_1 = require("../controladores/autenticacion");
const autenticacion_2 = require("../middlewares/autenticacion");
const validadores_1 = require("../middlewares/validadores");
const router = (0, express_1.Router)();
// Limitadores de velocidad específicos para autenticación
const limitadorRegistro = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 3, // Máximo 3 registros por IP cada 15 minutos
    message: {
        exito: false,
        mensaje: 'Demasiados intentos de registro. Intenta nuevamente en 15 minutos.'
    }
});
const limitadorLogin = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // Máximo 5 intentos de login por IP cada 15 minutos
    message: {
        exito: false,
        mensaje: 'Demasiados intentos de inicio de sesión. Intenta nuevamente en 15 minutos.'
    },
    skipSuccessfulRequests: true
});
const limitadorRecuperacion = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 60 minutos
    max: 3, // Máximo 3 solicitudes de recuperación por IP cada hora
    message: {
        exito: false,
        mensaje: 'Demasiadas solicitudes de recuperación. Intenta nuevamente en 1 hora.'
    }
});
// Rutas públicas (sin autenticación)
/**
 * @route   POST /api/auth/registrar
 * @desc    Registrar nuevo usuario
 * @access  Público
 */
router.post('/registrar', limitadorRegistro, validadores_1.validarRegistro, autenticacion_1.registrarUsuario);
/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión de usuario
 * @access  Público
 */
router.post('/login', limitadorLogin, validadores_1.validarLogin, autenticacion_1.iniciarSesion);
/**
 * @route   POST /api/auth/recuperar-contrasena
 * @desc    Solicitar recuperación de contraseña
 * @access  Público
 */
router.post('/recuperar-contrasena', limitadorRecuperacion, validadores_1.validarRecuperacionContrasena, autenticacion_1.solicitarRecuperacionContrasena);
/**
 * @route   POST /api/auth/restablecer-contrasena
 * @desc    Restablecer contraseña con token
 * @access  Público
 */
router.post('/restablecer-contrasena', validadores_1.validarRestablecerContrasena, autenticacion_1.restablecerContrasena);
// Rutas protegidas (requieren autenticación)
/**
 * @route   POST /api/auth/verificar-contrasena-maestra
 * @desc    Verificar contraseña maestra del usuario
 * @access  Privado
 */
router.post('/verificar-contrasena-maestra', autenticacion_2.verificarAutenticacion, validadores_1.validarContrasenaMaestra, autenticacion_1.verificarContrasenaMaestra);
/**
 * @route   GET /api/auth/perfil
 * @desc    Obtener perfil del usuario autenticado
 * @access  Privado
 */
router.get('/perfil', autenticacion_2.verificarAutenticacion, autenticacion_1.obtenerPerfil);
/**
 * @route   POST /api/auth/cerrar-sesion
 * @desc    Cerrar sesión del usuario
 * @access  Privado
 */
router.post('/cerrar-sesion', autenticacion_2.verificarAutenticacion, autenticacion_1.cerrarSesion);
/**
 * @route   PUT /api/auth/perfil
 * @desc    Actualizar perfil del usuario
 * @access  Privado
 */
router.put('/perfil', autenticacion_2.verificarAutenticacion, autenticacion_1.actualizarPerfil);
/**
 * @route   PUT /api/auth/cambiar-contrasena-maestra
 * @desc    Cambiar contraseña maestra del usuario
 * @access  Privado
 */
router.put('/cambiar-contrasena-maestra', autenticacion_2.verificarAutenticacion, validadores_1.validarCambiarContrasenaMaestra, validadores_1.manejarErroresValidacion, autenticacion_1.cambiarContrasenaMaestra);
exports.default = router;
