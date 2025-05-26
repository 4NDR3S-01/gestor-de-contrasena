"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notificaciones_1 = require("../controladores/notificaciones");
const autenticacion_1 = require("../middlewares/autenticacion");
const express_validator_1 = require("express-validator");
const validadores_1 = require("../middlewares/validadores");
const router = (0, express_1.Router)();
// Validadores
const validarObtenerNotificaciones = [
    (0, express_validator_1.query)('pagina')
        .optional()
        .isInt({ min: 1 })
        .withMessage('La página debe ser un número entero mayor a 0'),
    (0, express_validator_1.query)('limite')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('El límite debe ser un número entre 1 y 50'),
    (0, express_validator_1.query)('soloNoLeidas')
        .optional()
        .isBoolean()
        .withMessage('soloNoLeidas debe ser true o false'),
    validadores_1.manejarErroresValidacion
];
const validarIdNotificacion = [
    (0, express_validator_1.param)('id')
        .isMongoId()
        .withMessage('ID de notificación inválido'),
    validadores_1.manejarErroresValidacion
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
router.get('/', autenticacion_1.verificarAutenticacion, ...validarObtenerNotificaciones, notificaciones_1.obtenerNotificaciones);
/**
 * @route PUT /api/notificaciones/:id/leer
 * @desc Marcar una notificación específica como leída
 * @access Privado
 */
router.put('/:id/leer', autenticacion_1.verificarAutenticacion, ...validarIdNotificacion, notificaciones_1.marcarComoLeida);
/**
 * @route PUT /api/notificaciones/leer-todas
 * @desc Marcar todas las notificaciones del usuario como leídas
 * @access Privado
 */
router.put('/leer-todas', autenticacion_1.verificarAutenticacion, notificaciones_1.marcarTodasComoLeidas);
/**
 * @route DELETE /api/notificaciones/:id
 * @desc Eliminar una notificación específica
 * @access Privado
 */
router.delete('/:id', autenticacion_1.verificarAutenticacion, ...validarIdNotificacion, notificaciones_1.eliminarNotificacion);
exports.default = router;
