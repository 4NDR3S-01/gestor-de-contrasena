"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenerConfiguracionGenerador = exports.generarMultiplesContrasenas = exports.obtenerCategorias = exports.validarContrasena = exports.generarContrasena = void 0;
const express_validator_1 = require("express-validator");
const seguridad_1 = require("../utilidades/seguridad");
const Contrasena_1 = require("../modelos/Contrasena");
// Controlador para generar una contraseña segura basada en opciones recibidas en el cuerpo de la petición
const generarContrasena = async (req, res) => {
    try {
        // Validar los datos enviados en la petición
        const errores = (0, express_validator_1.validationResult)(req);
        if (!errores.isEmpty()) {
            // Si hay errores, responder con estado 400 y detalle de errores
            res.status(400).json({
                exito: false,
                mensaje: 'Opciones de generación inválidas',
                errores: errores.array()
            });
            return;
        }
        // Extraer opciones con valores por defecto
        const { longitud = 12, incluirMayusculas = true, incluirMinusculas = true, incluirNumeros = true, incluirSimbolos = true, excluirCaracteresAmbiguos = true } = req.body;
        // Validar longitud mínima y máxima permitida
        if (longitud < 4 || longitud > 128) {
            res.status(400).json({
                exito: false,
                mensaje: 'La longitud debe estar entre 4 y 128 caracteres'
            });
            return;
        }
        // Validar que al menos un tipo de carácter esté seleccionado
        if (!incluirMayusculas && !incluirMinusculas && !incluirNumeros && !incluirSimbolos) {
            res.status(400).json({
                exito: false,
                mensaje: 'Debe seleccionar al menos un tipo de caracter'
            });
            return;
        }
        // Crear objeto con opciones validadas
        const opciones = {
            longitud,
            incluirMayusculas,
            incluirMinusculas,
            incluirNumeros,
            incluirSimbolos,
            excluirCaracteresAmbiguos
        };
        // Generar la contraseña usando la función externa
        const contrasenaGenerada = (0, seguridad_1.generarContrasenaSagura)(opciones);
        // Validar la fortaleza de la contraseña generada
        const fortaleza = (0, seguridad_1.validarFortalezaContrasena)(contrasenaGenerada);
        // Responder con la contraseña y su fortaleza
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
        // Manejo de errores inesperados
        console.error('Error al generar contraseña:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor al generar contraseña'
        });
    }
};
exports.generarContrasena = generarContrasena;
// Controlador para validar la fortaleza de una contraseña recibida en la petición
const validarContrasena = async (req, res) => {
    try {
        // Validar datos de la petición
        const errores = (0, express_validator_1.validationResult)(req);
        if (!errores.isEmpty()) {
            // Responder con error si la contraseña no es válida
            res.status(400).json({
                exito: false,
                mensaje: 'Contraseña inválida para validar',
                errores: errores.array()
            });
            return;
        }
        const { contrasena } = req.body;
        // Validar que se haya proporcionado una contraseña de tipo string
        if (!contrasena || typeof contrasena !== 'string') {
            res.status(400).json({
                exito: false,
                mensaje: 'Debe proporcionar una contraseña válida'
            });
            return;
        }
        // Validar la fortaleza usando función externa
        const fortaleza = (0, seguridad_1.validarFortalezaContrasena)(contrasena);
        // Responder con la fortaleza calculada
        res.json({
            exito: true,
            mensaje: 'Validación de fortaleza completada',
            datos: {
                fortaleza
            }
        });
    }
    catch (error) {
        // Manejo de errores inesperados
        console.error('Error al validar contraseña:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor al validar contraseña'
        });
    }
};
exports.validarContrasena = validarContrasena;
// Controlador para obtener las categorías disponibles de contraseñas
const obtenerCategorias = async (req, res) => {
    try {
        // Mapear las categorías enumeradas para preparar la respuesta
        const categorias = Object.values(Contrasena_1.CategoriaContrasena).map(categoria => ({
            valor: categoria,
            etiqueta: categoria.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Formato legible
            icono: obtenerIconoCategoria(categoria) // Obtener icono asociado
        }));
        // Responder con la lista de categorías
        res.json({
            exito: true,
            mensaje: 'Categorías obtenidas exitosamente',
            datos: {
                categorias
            }
        });
    }
    catch (error) {
        // Manejo de errores inesperados
        console.error('Error al obtener categorías:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor'
        });
    }
};
exports.obtenerCategorias = obtenerCategorias;
// Función auxiliar para obtener un icono según la categoría
const obtenerIconoCategoria = (categoria) => {
    // Mapeo de categoría a icono emoji
    const iconos = {
        [Contrasena_1.CategoriaContrasena.TRABAJO]: '💼',
        [Contrasena_1.CategoriaContrasena.PERSONAL]: '👤',
        [Contrasena_1.CategoriaContrasena.REDES_SOCIALES]: '📱',
        [Contrasena_1.CategoriaContrasena.BANCOS]: '🏦',
        [Contrasena_1.CategoriaContrasena.COMPRAS]: '🛒',
        [Contrasena_1.CategoriaContrasena.ENTRETENIMIENTO]: '🎮',
        [Contrasena_1.CategoriaContrasena.OTROS]: '📁'
    };
    // Devolver icono o uno genérico si no existe
    return iconos[categoria] || '📁';
};
// Controlador para generar múltiples contraseñas con las opciones indicadas
const generarMultiplesContrasenas = async (req, res) => {
    try {
        // Validar datos recibidos
        const errores = (0, express_validator_1.validationResult)(req);
        if (!errores.isEmpty()) {
            // Responder con errores si no es válido
            res.status(400).json({
                exito: false,
                mensaje: 'Opciones de generación inválidas',
                errores: errores.array()
            });
            return;
        }
        // Extraer opciones con valores por defecto
        const { cantidad = 5, longitud = 12, incluirMayusculas = true, incluirMinusculas = true, incluirNumeros = true, incluirSimbolos = true, excluirCaracteresAmbiguos = true } = req.body;
        // Validar cantidad de contraseñas solicitadas
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
        // Validar al menos un tipo de caracter
        if (!incluirMayusculas && !incluirMinusculas && !incluirNumeros && !incluirSimbolos) {
            res.status(400).json({
                exito: false,
                mensaje: 'Debe seleccionar al menos un tipo de caracter'
            });
            return;
        }
        // Crear opciones para el generador
        const opciones = {
            longitud,
            incluirMayusculas,
            incluirMinusculas,
            incluirNumeros,
            incluirSimbolos,
            excluirCaracteresAmbiguos
        };
        // Generar las contraseñas solicitadas y evaluar su fortaleza
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
        // Ordenar las contraseñas de mayor a menor fortaleza
        contrasenas.sort((a, b) => b.fortaleza - a.fortaleza);
        // Responder con la lista generada
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
        // Manejo de errores inesperados
        console.error('Error al generar múltiples contraseñas:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor'
        });
    }
};
exports.generarMultiplesContrasenas = generarMultiplesContrasenas;
// Controlador para obtener la configuración predeterminada y presets para el generador de contraseñas
const obtenerConfiguracionGenerador = async (req, res) => {
    try {
        // Configuración básica por defecto
        const configuracionPredeterminada = {
            longitud: 12,
            incluirMayusculas: true,
            incluirMinusculas: true,
            incluirNumeros: true,
            incluirSimbolos: true,
            excluirCaracteresAmbiguos: true
        };
        // Presets predefinidos para distintas necesidades
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
        // Responder con la configuración y presets
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
        // Manejo de errores inesperados
        console.error('Error al obtener configuración del generador:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor'
        });
    }
};
exports.obtenerConfiguracionGenerador = obtenerConfiguracionGenerador;
