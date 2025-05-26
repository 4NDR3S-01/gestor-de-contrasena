"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const contrasenas_1 = require("../controladores/contrasenas");
const autenticacion_1 = require("../middlewares/autenticacion");
const validadores_1 = require("../middlewares/validadores");
const router = (0, express_1.Router)();
// Todas las rutas de contraseñas requieren autenticación
router.use(autenticacion_1.verificarAutenticacion);
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
router.get('/', validadores_1.validarBusquedaContrasenas, contrasenas_1.obtenerContrasenas);
/**
 * @route   GET /api/contrasenas/estadisticas
 * @desc    Obtener estadísticas de contraseñas del usuario
 * @access  Privado
 */
router.get('/estadisticas', contrasenas_1.obtenerEstadisticas);
/**
 * @route   POST /api/contrasenas
 * @desc    Crear nueva contraseña
 * @access  Privado
 */
router.post('/', validadores_1.validarCrearContrasena, contrasenas_1.crearContrasena);
/**
 * @route   GET /api/contrasenas/:id
 * @desc    Obtener contraseña específica (con contraseña desencriptada)
 * @access  Privado
 */
router.get('/:id', validadores_1.validarIdContrasena, contrasenas_1.obtenerContrasena);
/**
 * @route   PUT /api/contrasenas/:id
 * @desc    Actualizar contraseña existente
 * @access  Privado
 */
router.put('/:id', validadores_1.validarActualizarContrasena, contrasenas_1.actualizarContrasena);
/**
 * @route   DELETE /api/contrasenas/:id
 * @desc    Eliminar contraseña
 * @access  Privado
 */
router.delete('/:id', validadores_1.validarIdContrasena, contrasenas_1.eliminarContrasena);
/**
 * @route   PATCH /api/contrasenas/:id/favorito
 * @desc    Alternar estado de favorito de una contraseña
 * @access  Privado
 */
router.patch('/:id/favorito', validadores_1.validarIdContrasena, contrasenas_1.alternarFavorito);
exports.default = router;
