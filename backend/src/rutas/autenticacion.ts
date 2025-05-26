import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  registrarUsuario,
  iniciarSesion,
  verificarContrasenaMaestra,
  solicitarRecuperacionContrasena,
  restablecerContrasena,
  obtenerPerfil,
  cerrarSesion,
  actualizarPerfil,
  cambiarContrasenaMaestra
} from '../controladores/autenticacion';
import { verificarAutenticacion } from '../middlewares/autenticacion';
import {
  validarRegistro,
  validarLogin,
  validarContrasenaMaestra,
  validarRecuperacionContrasena,
  validarRestablecerContrasena,
  validarCambiarContrasenaMaestra,
  manejarErroresValidacion
} from '../middlewares/validadores';

const router = Router();

// Limitadores de velocidad específicos para autenticación
const limitadorRegistro = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 3, // Máximo 3 registros por IP cada 15 minutos
  message: {
    exito: false,
    mensaje: 'Demasiados intentos de registro. Intenta nuevamente en 15 minutos.'
  }
});

const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 intentos de login por IP cada 15 minutos
  message: {
    exito: false,
    mensaje: 'Demasiados intentos de inicio de sesión. Intenta nuevamente en 15 minutos.'
  },
  skipSuccessfulRequests: true
});

const limitadorRecuperacion = rateLimit({
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
router.post('/registrar', limitadorRegistro, validarRegistro, registrarUsuario);

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión de usuario
 * @access  Público
 */
router.post('/login', limitadorLogin, validarLogin, iniciarSesion);

/**
 * @route   POST /api/auth/recuperar-contrasena
 * @desc    Solicitar recuperación de contraseña
 * @access  Público
 */
router.post('/recuperar-contrasena', limitadorRecuperacion, validarRecuperacionContrasena, solicitarRecuperacionContrasena);

/**
 * @route   POST /api/auth/restablecer-contrasena
 * @desc    Restablecer contraseña con token
 * @access  Público
 */
router.post('/restablecer-contrasena', validarRestablecerContrasena, restablecerContrasena);

// Rutas protegidas (requieren autenticación)
/**
 * @route   POST /api/auth/verificar-contrasena-maestra
 * @desc    Verificar contraseña maestra del usuario
 * @access  Privado
 */
router.post('/verificar-contrasena-maestra', verificarAutenticacion, validarContrasenaMaestra, verificarContrasenaMaestra);

/**
 * @route   GET /api/auth/perfil
 * @desc    Obtener perfil del usuario autenticado
 * @access  Privado
 */
router.get('/perfil', verificarAutenticacion, obtenerPerfil);

/**
 * @route   POST /api/auth/cerrar-sesion
 * @desc    Cerrar sesión del usuario
 * @access  Privado
 */
router.post('/cerrar-sesion', verificarAutenticacion, cerrarSesion);

/**
 * @route   PUT /api/auth/perfil
 * @desc    Actualizar perfil del usuario
 * @access  Privado
 */
router.put('/perfil', verificarAutenticacion, actualizarPerfil);

/**
 * @route   PUT /api/auth/cambiar-contrasena-maestra
 * @desc    Cambiar contraseña maestra del usuario
 * @access  Privado
 */
router.put('/cambiar-contrasena-maestra', verificarAutenticacion, validarCambiarContrasenaMaestra, manejarErroresValidacion, cambiarContrasenaMaestra);

export default router;
