import { Router } from 'express';
import {
  obtenerNotificaciones,
  marcarComoLeida,
  marcarTodasComoLeidas,
  eliminarNotificacion
} from '../controladores/notificaciones';
import { verificarAutenticacion } from '../middlewares/autenticacion';
import { body, param, query } from 'express-validator';
import { manejarErroresValidacion } from '../middlewares/validadores';

const router = Router();

// Validadores
const validarObtenerNotificaciones = [
  query('pagina')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero mayor a 0'),
  query('limite')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('El límite debe ser un número entre 1 y 50'),
  query('soloNoLeidas')
    .optional()
    .isBoolean()
    .withMessage('soloNoLeidas debe ser true o false'),
  manejarErroresValidacion
];

const validarIdNotificacion = [
  param('id')
    .isMongoId()
    .withMessage('ID de notificación inválido'),
  manejarErroresValidacion
];

// Rutas

/**
 * @route GET /api/notificaciones
 * @desc Obtener notificaciones del usuario autenticado
 * @access Privado
 * @query {number} [pagina=1] - Número de página
 * @query {number} [limite=20] - Límite de resultados por página (máx 50)
 * @query {boolean} [soloNoLeidas=false] - Solo obtener notificaciones no leídas
 */
router.get('/', verificarAutenticacion, ...validarObtenerNotificaciones, obtenerNotificaciones);

/**
 * @route PUT /api/notificaciones/:id/leer
 * @desc Marcar una notificación específica como leída
 * @access Privado
 */
router.put('/:id/leer', verificarAutenticacion, ...validarIdNotificacion, marcarComoLeida);

/**
 * @route PUT /api/notificaciones/leer-todas
 * @desc Marcar todas las notificaciones del usuario como leídas
 * @access Privado
 */
router.put('/leer-todas', verificarAutenticacion, marcarTodasComoLeidas);

/**
 * @route DELETE /api/notificaciones/:id
 * @desc Eliminar una notificación específica
 * @access Privado
 */
router.delete('/:id', verificarAutenticacion, ...validarIdNotificacion, eliminarNotificacion);

export default router;
