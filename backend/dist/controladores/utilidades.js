"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenerConfiguracionGenerador = exports.generarMultiplesContrasenas = exports.obtenerCategorias = exports.validarContrasena = exports.generarContrasena = void 0;
const express_validator_1 = require("express-validator");
const seguridad_1 = require("../utilidades/seguridad");
const Contrasena_1 = require("../modelos/Contrasena");
// Generar contraseña segura
const generarContrasena = async (req, res) => {
    try {
        const errores = (0, express_validator_1.validationResult)(req);
        if (!errores.isEmpty()) {
            res.status(400).json({
                exito: false,
                mensaje: 'Opciones de generación inválidas',
                errores: errores.array()
            });
            return;
        }
        const { longitud = 12, incluirMayusculas = true, incluirMinusculas = true, incluirNumeros = true, incluirSimbolos = true, excluirCaracteresAmbiguos = true } = req.body;
        // Validar opciones
        if (longitud < 4 || longitud > 128) {
            res.status(400).json({
                exito: false,
                mensaje: 'La longitud debe estar entre 4 y 128 caracteres'
            });
            return;
        }
        if (!incluirMayusculas && !incluirMinusculas && !incluirNumeros && !incluirSimbolos) {
            res.status(400).json({
                exito: false,
                mensaje: 'Debe seleccionar al menos un tipo de caracter'
            });
            return;
        }
        const opciones = {
            longitud,
            incluirMayusculas,
            incluirMinusculas,
            incluirNumeros,
            incluirSimbolos,
            excluirCaracteresAmbiguos
        };
        // Generar contraseña
        const contrasenaGenerada = (0, seguridad_1.generarContrasenaSagura)(opciones);
        // Validar fortaleza de la contraseña generada
        const fortaleza = (0, seguridad_1.validarFortalezaContrasena)(contrasenaGenerada);
        res.json({
            exito: true,
            mensaje: 'Contraseña generada exitosamente',
            datos: {
                contrasena: contrasenaGenerada,
                fortaleza,
                opciones: opciones
            }
        });
    }
    catch (error) {
        console.error('Error al generar contraseña:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor al generar contraseña'
        });
    }
};
exports.generarContrasena = generarContrasena;
// Validar fortaleza de contraseña
const validarContrasena = async (req, res) => {
    try {
        const errores = (0, express_validator_1.validationResult)(req);
        if (!errores.isEmpty()) {
            res.status(400).json({
                exito: false,
                mensaje: 'Contraseña inválida para validar',
                errores: errores.array()
            });
            return;
        }
        const { contrasena } = req.body;
        if (!contrasena || typeof contrasena !== 'string') {
            res.status(400).json({
                exito: false,
                mensaje: 'Debe proporcionar una contraseña válida'
            });
            return;
        }
        const fortaleza = (0, seguridad_1.validarFortalezaContrasena)(contrasena);
        res.json({
            exito: true,
            mensaje: 'Validación de fortaleza completada',
            datos: {
                fortaleza
            }
        });
    }
    catch (error) {
        console.error('Error al validar contraseña:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor al validar contraseña'
        });
    }
};
exports.validarContrasena = validarContrasena;
// Obtener categorías disponibles
const obtenerCategorias = async (req, res) => {
    try {
        const categorias = Object.values(Contrasena_1.CategoriaContrasena).map(categoria => ({
            valor: categoria,
            etiqueta: categoria.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            icono: obtenerIconoCategoria(categoria)
        }));
        res.json({
            exito: true,
            mensaje: 'Categorías obtenidas exitosamente',
            datos: {
                categorias
            }
        });
    }
    catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor'
        });
    }
};
exports.obtenerCategorias = obtenerCategorias;
// Función auxiliar para obtener iconos de categorías
const obtenerIconoCategoria = (categoria) => {
    const iconos = {
        [Contrasena_1.CategoriaContrasena.TRABAJO]: '💼',
        [Contrasena_1.CategoriaContrasena.PERSONAL]: '👤',
        [Contrasena_1.CategoriaContrasena.REDES_SOCIALES]: '📱',
        [Contrasena_1.CategoriaContrasena.BANCOS]: '🏦',
        [Contrasena_1.CategoriaContrasena.COMPRAS]: '🛒',
        [Contrasena_1.CategoriaContrasena.ENTRETENIMIENTO]: '🎮',
        [Contrasena_1.CategoriaContrasena.OTROS]: '📁'
    };
    return iconos[categoria] || '📁';
};
// Generar múltiples contraseñas
const generarMultiplesContrasenas = async (req, res) => {
    try {
        const errores = (0, express_validator_1.validationResult)(req);
        if (!errores.isEmpty()) {
            res.status(400).json({
                exito: false,
                mensaje: 'Opciones de generación inválidas',
                errores: errores.array()
            });
            return;
        }
        const { cantidad = 5, longitud = 12, incluirMayusculas = true, incluirMinusculas = true, incluirNumeros = true, incluirSimbolos = true, excluirCaracteresAmbiguos = true } = req.body;
        // Validar cantidad
        if (cantidad < 1 || cantidad > 20) {
            res.status(400).json({
                exito: false,
                mensaje: 'La cantidad debe estar entre 1 y 20 contraseñas'
            });
            return;
        }
        // Validar longitud
        if (longitud < 4 || longitud > 128) {
            res.status(400).json({
                exito: false,
                mensaje: 'La longitud debe estar entre 4 y 128 caracteres'
            });
            return;
        }
        if (!incluirMayusculas && !incluirMinusculas && !incluirNumeros && !incluirSimbolos) {
            res.status(400).json({
                exito: false,
                mensaje: 'Debe seleccionar al menos un tipo de caracter'
            });
            return;
        }
        const opciones = {
            longitud,
            incluirMayusculas,
            incluirMinusculas,
            incluirNumeros,
            incluirSimbolos,
            excluirCaracteresAmbiguos
        };
        // Generar múltiples contraseñas
        const contrasenas = [];
        for (let i = 0; i < cantidad; i++) {
            const contrasenaGenerada = (0, seguridad_1.generarContrasenaSagura)(opciones);
            const fortaleza = (0, seguridad_1.validarFortalezaContrasena)(contrasenaGenerada);
            contrasenas.push({
                id: i + 1,
                contrasena: contrasenaGenerada,
                fortaleza: fortaleza.puntuacion,
                esSegura: fortaleza.esSegura
            });
        }
        // Ordenar por fortaleza (más seguras primero)
        contrasenas.sort((a, b) => b.fortaleza - a.fortaleza);
        res.json({
            exito: true,
            mensaje: `${cantidad} contraseñas generadas exitosamente`,
            datos: {
                contrasenas,
                opciones
            }
        });
    }
    catch (error) {
        console.error('Error al generar múltiples contraseñas:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor'
        });
    }
};
exports.generarMultiplesContrasenas = generarMultiplesContrasenas;
// Obtener configuración predeterminada para el generador
const obtenerConfiguracionGenerador = async (req, res) => {
    try {
        const configuracionPredeterminada = {
            longitud: 12,
            incluirMayusculas: true,
            incluirMinusculas: true,
            incluirNumeros: true,
            incluirSimbolos: true,
            excluirCaracteresAmbiguos: true
        };
        const presets = [
            {
                nombre: 'Básica',
                descripcion: 'Contraseña básica con letras y números',
                opciones: {
                    longitud: 8,
                    incluirMayusculas: true,
                    incluirMinusculas: true,
                    incluirNumeros: true,
                    incluirSimbolos: false,
                    excluirCaracteresAmbiguos: true
                }
            },
            {
                nombre: 'Segura',
                descripcion: 'Contraseña segura recomendada',
                opciones: {
                    longitud: 12,
                    incluirMayusculas: true,
                    incluirMinusculas: true,
                    incluirNumeros: true,
                    incluirSimbolos: true,
                    excluirCaracteresAmbiguos: true
                }
            },
            {
                nombre: 'Máxima Seguridad',
                descripcion: 'Contraseña con máxima seguridad',
                opciones: {
                    longitud: 20,
                    incluirMayusculas: true,
                    incluirMinusculas: true,
                    incluirNumeros: true,
                    incluirSimbolos: true,
                    excluirCaracteresAmbiguos: false
                }
            },
            {
                nombre: 'PIN Numérico',
                descripcion: 'Solo números para PINs',
                opciones: {
                    longitud: 6,
                    incluirMayusculas: false,
                    incluirMinusculas: false,
                    incluirNumeros: true,
                    incluirSimbolos: false,
                    excluirCaracteresAmbiguos: true
                }
            }
        ];
        res.json({
            exito: true,
            mensaje: 'Configuración del generador obtenida exitosamente',
            datos: {
                configuracionPredeterminada,
                presets
            }
        });
    }
    catch (error) {
        console.error('Error al obtener configuración del generador:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor'
        });
    }
};
exports.obtenerConfiguracionGenerador = obtenerConfiguracionGenerador;
