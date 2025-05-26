import { Router } from 'express';
import {
  generarContrasena,
  validarContrasena,
  obtenerCategorias,
  generarMultiplesContrasenas,
  obtenerConfiguracionGenerador
} from '../controladores/utilidades';
import {
  validarGenerarContrasena,
  validarValidarContrasena,
  validarGenerarMultiplesContrasenas
} from '../middlewares/validadores';

const router = Router();

/**
 * @route   GET /api/utilidades/categorias
 * @desc    Obtener lista de categorías disponibles
 * @access  Público
 */
router.get('/categorias', obtenerCategorias);

/**
 * @route   GET /api/utilidades/generador/configuracion
 * @desc    Obtener configuración predeterminada del generador de contraseñas
 * @access  Público
 */
router.get('/generador/configuracion', obtenerConfiguracionGenerador);

/**
 * @route   POST /api/utilidades/generar-contrasena
 * @desc    Generar una contraseña segura con opciones personalizables
 * @access  Público
 */
router.post('/generar-contrasena', validarGenerarContrasena, generarContrasena);

/**
 * @route   POST /api/utilidades/generar-multiples-contrasenas
 * @desc    Generar múltiples contraseñas seguras
 * @access  Público
 */
router.post('/generar-multiples-contrasenas', validarGenerarMultiplesContrasenas, generarMultiplesContrasenas);

/**
 * @route   POST /api/utilidades/validar-contrasena
 * @desc    Validar la fortaleza de una contraseña
 * @access  Público
 */
router.post('/validar-contrasena', validarValidarContrasena, validarContrasena);

export default router;
