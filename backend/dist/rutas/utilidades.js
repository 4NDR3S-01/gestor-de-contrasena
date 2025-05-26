"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const utilidades_1 = require("../controladores/utilidades");
const validadores_1 = require("../middlewares/validadores");
const router = (0, express_1.Router)();
/**
 * @route   GET /api/utilidades/categorias
 * @desc    Obtener lista de categorías disponibles
 * @access  Público
 */
router.get('/categorias', utilidades_1.obtenerCategorias);
/**
 * @route   GET /api/utilidades/generador/configuracion
 * @desc    Obtener configuración predeterminada del generador de contraseñas
 * @access  Público
 */
router.get('/generador/configuracion', utilidades_1.obtenerConfiguracionGenerador);
/**
 * @route   POST /api/utilidades/generar-contrasena
 * @desc    Generar una contraseña segura con opciones personalizables
 * @access  Público
 */
router.post('/generar-contrasena', validadores_1.validarGenerarContrasena, utilidades_1.generarContrasena);
/**
 * @route   POST /api/utilidades/generar-multiples-contrasenas
 * @desc    Generar múltiples contraseñas seguras
 * @access  Público
 */
router.post('/generar-multiples-contrasenas', validadores_1.validarGenerarMultiplesContrasenas, utilidades_1.generarMultiplesContrasenas);
/**
 * @route   POST /api/utilidades/validar-contrasena
 * @desc    Validar la fortaleza de una contraseña
 * @access  Público
 */
router.post('/validar-contrasena', validadores_1.validarValidarContrasena, utilidades_1.validarContrasena);
exports.default = router;
