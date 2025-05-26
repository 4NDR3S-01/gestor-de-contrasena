import { Router } from 'express';
import {
  obtenerContrasenas,
  obtenerContrasena,
  crearContrasena,
  actualizarContrasena,
  eliminarContrasena,
  alternarFavorito,
  obtenerEstadisticas
} from '../controladores/contrasenas';
import { verificarAutenticacion } from '../middlewares/autenticacion';
import {
  validarCrearContrasena,
  validarActualizarContrasena,
  validarIdContrasena,
  validarBusquedaContrasenas
} from '../middlewares/validadores';

const router = Router();

// Todas las rutas de contraseñas requieren autenticación
router.use(verificarAutenticacion);

/**
 * @route   GET /api/contrasenas
 * @desc    Obtener todas las contraseñas del usuario con filtros
 * @access  Privado
 * @query   categoria - Filtrar por categoría
 * @query   busqueda - Búsqueda por texto
 * @query   favoritos - Filtrar solo favoritos (true/false)
 * @query   limite - Número de resultados por página (default: 50)
 * @query   pagina - Número de página (default: 1)
 */
router.get('/', validarBusquedaContrasenas, obtenerContrasenas);

/**
 * @route   GET /api/contrasenas/estadisticas
 * @desc    Obtener estadísticas de contraseñas del usuario
 * @access  Privado
 */
router.get('/estadisticas', obtenerEstadisticas);

/**
 * @route   POST /api/contrasenas
 * @desc    Crear nueva contraseña
 * @access  Privado
 */
router.post('/', validarCrearContrasena, crearContrasena);

/**
 * @route   GET /api/contrasenas/:id
 * @desc    Obtener contraseña específica (con contraseña desencriptada)
 * @access  Privado
 */
router.get('/:id', validarIdContrasena, obtenerContrasena);

/**
 * @route   PUT /api/contrasenas/:id
 * @desc    Actualizar contraseña existente
 * @access  Privado
 */
router.put('/:id', validarActualizarContrasena, actualizarContrasena);

/**
 * @route   DELETE /api/contrasenas/:id
 * @desc    Eliminar contraseña
 * @access  Privado
 */
router.delete('/:id', validarIdContrasena, eliminarContrasena);

/**
 * @route   PATCH /api/contrasenas/:id/favorito
 * @desc    Alternar estado de favorito de una contraseña
 * @access  Privado
 */
router.patch('/:id/favorito', validarIdContrasena, alternarFavorito);

export default router;
