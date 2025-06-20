"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenerCategoriasConConteo = exports.obtenerEstadisticas = exports.alternarFavorito = exports.eliminarContrasena = exports.actualizarContrasena = exports.crearContrasena = exports.obtenerContrasena = exports.obtenerContrasenas = void 0;
const express_validator_1 = require("express-validator");
const Contrasena_1 = __importStar(require("../modelos/Contrasena"));
const seguridad_1 = require("../utilidades/seguridad");
const notificaciones_1 = __importDefault(require("../servicios/notificaciones"));
// Obtener todas las contraseñas del usuario
const obtenerContrasenas = async (req, res) => {
    try {
        const usuarioId = req.usuario?.id;
        const { categoria, busqueda, favoritos, limite = 50, pagina = 1 } = req.query;
        if (!usuarioId) {
            res.status(401).json({
                exito: false,
                mensaje: 'Usuario no autenticado'
            });
            return;
        }
        // Construir filtros de búsqueda
        const filtros = { usuarioId };
        if (categoria && categoria !== 'todas') {
            filtros.categoria = categoria;
        }
        if (favoritos === 'true') {
            filtros.esFavorito = true;
        }
        if (busqueda) {
            filtros.$or = [
                { titulo: { $regex: busqueda, $options: 'i' } },
                { usuario: { $regex: busqueda, $options: 'i' } },
                { url: { $regex: busqueda, $options: 'i' } },
                { notas: { $regex: busqueda, $options: 'i' } }
            ];
        }
        // Calcular paginación
        const limitePagina = parseInt(limite);
        const paginaActual = parseInt(pagina);
        const salto = (paginaActual - 1) * limitePagina;
        // Obtener contraseñas con paginación
        const contrasenas = await Contrasena_1.default.find(filtros)
            .select('-contrasenaEncriptada') // No incluir la contraseña encriptada por defecto
            .sort({ esFavorito: -1, fechaModificacion: -1 })
            .limit(limitePagina)
            .skip(salto);
        // Contar total para paginación
        const total = await Contrasena_1.default.countDocuments(filtros);
        res.json({
            exito: true,
            mensaje: 'Contraseñas obtenidas exitosamente',
            datos: {
                contrasenas,
                paginacion: {
                    total,
                    pagina: paginaActual,
                    limite: limitePagina,
                    totalPaginas: Math.ceil(total / limitePagina)
                }
            }
        });
    }
    catch (error) {
        console.error('Error al obtener contraseñas:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor'
        });
    }
};
exports.obtenerContrasenas = obtenerContrasenas;
// Obtener una contraseña específica (con la contraseña desencriptada)
const obtenerContrasena = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario?.id;
        if (!usuarioId) {
            res.status(401).json({
                exito: false,
                mensaje: 'Usuario no autenticado'
            });
            return;
        }
        const contrasena = await Contrasena_1.default.findOne({
            _id: id,
            usuarioId
        });
        if (!contrasena) {
            res.status(404).json({
                exito: false,
                mensaje: 'Contraseña no encontrada'
            });
            return;
        }
        // Desencriptar la contraseña para mostrarla
        try {
            const contrasenaDesencriptada = (0, seguridad_1.desencriptarContrasena)(contrasena.contrasenaEncriptada);
            res.json({
                exito: true,
                mensaje: 'Contraseña obtenida exitosamente',
                datos: {
                    contrasena: {
                        ...contrasena.toJSON(),
                        contrasenaDesencriptada,
                        contrasenaEncriptada: undefined // No enviar la versión encriptada
                    }
                }
            });
        }
        catch (errorDesencriptacion) {
            console.error('Error al desencriptar contraseña:', errorDesencriptacion);
            res.status(500).json({
                exito: false,
                mensaje: 'Error al procesar la contraseña'
            });
        }
    }
    catch (error) {
        console.error('Error al obtener contraseña:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor'
        });
    }
};
exports.obtenerContrasena = obtenerContrasena;
// Crear nueva contraseña
const crearContrasena = async (req, res) => {
    try {
        const errores = (0, express_validator_1.validationResult)(req);
        if (!errores.isEmpty()) {
            res.status(400).json({
                exito: false,
                mensaje: 'Datos de entrada inválidos',
                errores: errores.array()
            });
            return;
        }
        const usuarioId = req.usuario?.id;
        const { titulo, url, usuario, email, contrasena, notas, categoria, esFavorito } = req.body;
        if (!usuarioId) {
            res.status(401).json({
                exito: false,
                mensaje: 'Usuario no autenticado'
            });
            return;
        }
        // Verificar si ya existe una contraseña con el mismo título
        const contrasenaExistente = await Contrasena_1.default.findOne({
            usuarioId,
            titulo: { $regex: new RegExp(`^${titulo}$`, 'i') }
        });
        if (contrasenaExistente) {
            res.status(400).json({
                exito: false,
                mensaje: 'Ya existe una contraseña con este título'
            });
            return;
        }
        // Encriptar la contraseña
        const contrasenaEncriptada = (0, seguridad_1.encriptarContrasena)(contrasena);
        // Crear nueva contraseña
        const nuevaContrasena = new Contrasena_1.default({
            usuarioId,
            titulo: titulo.trim(),
            url: url ? url.trim() : undefined,
            usuario: usuario ? usuario.trim() : undefined,
            email: email ? email.toLowerCase().trim() : undefined,
            contrasenaEncriptada,
            notas: typeof notas === 'string' ? notas : '',
            categoria: categoria ?? Contrasena_1.CategoriaContrasena.OTROS,
            esFavorito: esFavorito ?? false
        });
        await nuevaContrasena.save();
        // Crear notificación
        await notificaciones_1.default.crear(usuarioId, 'PASSWORD_CREATED', { sitio: titulo });
        res.status(201).json({
            exito: true,
            mensaje: 'Contraseña creada exitosamente',
            datos: {
                contrasena: {
                    ...nuevaContrasena.toJSON(),
                    contrasenaEncriptada: undefined // No devolver la contraseña encriptada
                }
            }
        });
    }
    catch (error) {
        console.error('Error al crear contraseña:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor'
        });
    }
};
exports.crearContrasena = crearContrasena;
// Actualizar contraseña existente
const actualizarContrasena = async (req, res) => {
    try {
        console.log('=== INICIO ACTUALIZACIÓN ===');
        console.log('Body recibido:', req.body);
        console.log('Usuario ID:', req.usuario?.id);
        console.log('Parámetro ID:', req.params.id);
        const errores = (0, express_validator_1.validationResult)(req);
        if (!errores.isEmpty()) {
            console.log('Errores de validación:', errores.array());
            res.status(400).json({
                exito: false,
                mensaje: 'Datos de entrada inválidos',
                errores: errores.array()
            });
            return;
        }
        const { id } = req.params;
        const usuarioId = req.usuario?.id;
        if (!usuarioId) {
            res.status(401).json({
                exito: false,
                mensaje: 'Usuario no autenticado'
            });
            return;
        }
        const { titulo, url, usuario, email, contrasena, notas, categoria, esFavorito } = req.body;
        // Construir objeto de actualización de manera más robusta
        const datosActualizacion = {};
        if (titulo !== undefined) {
            datosActualizacion.titulo = titulo.trim();
        }
        if (url !== undefined) {
            datosActualizacion.url = url ? url.trim() : undefined;
        }
        if (usuario !== undefined) {
            datosActualizacion.usuario = usuario ? usuario.trim() : undefined;
        }
        if (email !== undefined) {
            datosActualizacion.email = email ? email.toLowerCase().trim() : undefined;
        }
        if (notas !== undefined) {
            datosActualizacion.notas = notas ? notas.trim() : '';
        }
        if (categoria !== undefined) {
            datosActualizacion.categoria = categoria || Contrasena_1.CategoriaContrasena.OTROS;
        }
        if (esFavorito !== undefined) {
            datosActualizacion.esFavorito = Boolean(esFavorito);
        }
        // Solo encriptar nueva contraseña si se proporciona
        if (contrasena && contrasena.trim()) {
            const contrasenaEncriptada = (0, seguridad_1.encriptarContrasena)(contrasena.trim());
            datosActualizacion.contrasenaEncriptada = contrasenaEncriptada;
        }
        datosActualizacion.fechaModificacion = new Date();
        console.log('Datos de actualización construidos:', datosActualizacion);
        const contrasenaActualizada = await Contrasena_1.default.findOneAndUpdate({ _id: id, usuarioId }, datosActualizacion, { new: true });
        if (!contrasenaActualizada) {
            console.log('Contraseña no encontrada para actualizar');
            res.status(404).json({
                exito: false,
                mensaje: 'Contraseña no encontrada'
            });
            return;
        }
        console.log('Contraseña actualizada exitosamente:', contrasenaActualizada._id);
        // Crear notificación
        await notificaciones_1.default.crear(usuarioId, 'PASSWORD_UPDATED', { sitio: contrasenaActualizada.titulo });
        res.json({
            exito: true,
            mensaje: 'Contraseña actualizada exitosamente',
            datos: {
                contrasena: {
                    _id: contrasenaActualizada._id,
                    titulo: contrasenaActualizada.titulo,
                    url: contrasenaActualizada.url,
                    usuario: contrasenaActualizada.usuario,
                    email: contrasenaActualizada.email,
                    categoria: contrasenaActualizada.categoria,
                    esFavorito: contrasenaActualizada.esFavorito,
                    notas: contrasenaActualizada.notas,
                    fechaCreacion: contrasenaActualizada.fechaCreacion,
                    fechaModificacion: contrasenaActualizada.fechaModificacion
                }
            }
        });
    }
    catch (error) {
        console.error('Error completo al actualizar contraseña:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor'
        });
    }
};
exports.actualizarContrasena = actualizarContrasena;
// Eliminar contraseña
const eliminarContrasena = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario?.id;
        if (!usuarioId) {
            res.status(401).json({
                exito: false,
                mensaje: 'Usuario no autenticado'
            });
            return;
        }
        const contrasenaEliminada = await Contrasena_1.default.findOneAndDelete({
            _id: id,
            usuarioId
        });
        if (!contrasenaEliminada) {
            res.status(404).json({
                exito: false,
                mensaje: 'Contraseña no encontrada'
            });
            return;
        }
        // Crear notificación
        await notificaciones_1.default.crear(usuarioId, 'PASSWORD_DELETED', { sitio: contrasenaEliminada.titulo });
        res.json({
            exito: true,
            mensaje: 'Contraseña eliminada exitosamente'
        });
    }
    catch (error) {
        console.error('Error al eliminar contraseña:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor'
        });
    }
};
exports.eliminarContrasena = eliminarContrasena;
// Alternar favorito
const alternarFavorito = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario?.id;
        if (!usuarioId) {
            res.status(401).json({
                exito: false,
                mensaje: 'Usuario no autenticado'
            });
            return;
        }
        const contrasena = await Contrasena_1.default.findOne({
            _id: id,
            usuarioId
        });
        if (!contrasena) {
            res.status(404).json({
                exito: false,
                mensaje: 'Contraseña no encontrada'
            });
            return;
        }
        contrasena.esFavorito = !contrasena.esFavorito;
        await contrasena.save();
        // Crear notificación
        await notificaciones_1.default.crear(usuarioId, 'PASSWORD_FAVORITED', { sitio: contrasena.titulo, esFavorito: contrasena.esFavorito });
        res.json({
            exito: true,
            mensaje: `Contraseña ${contrasena.esFavorito ? 'agregada a' : 'removida de'} favoritos`,
            datos: {
                esFavorito: contrasena.esFavorito
            }
        });
    }
    catch (error) {
        console.error('Error al alternar favorito:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor'
        });
    }
};
exports.alternarFavorito = alternarFavorito;
// Obtener estadísticas del usuario
const obtenerEstadisticas = async (req, res) => {
    try {
        const usuarioId = req.usuario?.id;
        if (!usuarioId) {
            res.status(401).json({
                exito: false,
                mensaje: 'Usuario no autenticado'
            });
            return;
        }
        // Estadísticas generales
        const totalContrasenas = await Contrasena_1.default.countDocuments({ usuarioId });
        const totalFavoritos = await Contrasena_1.default.countDocuments({ usuarioId, esFavorito: true });
        // Estadísticas por categoría
        const estadisticasPorCategoria = await Contrasena_1.default.aggregate([
            { $match: { usuarioId } },
            { $group: { _id: '$categoria', cantidad: { $sum: 1 } } },
            { $sort: { cantidad: -1 } }
        ]);
        // Contraseñas más recientes
        const contrasenasMasRecientes = await Contrasena_1.default.find({ usuarioId })
            .select('titulo categoria fechaCreacion')
            .sort({ fechaCreacion: -1 })
            .limit(5);
        res.json({
            exito: true,
            mensaje: 'Estadísticas obtenidas exitosamente',
            datos: {
                resumen: {
                    totalContrasenas,
                    totalFavoritos,
                    categorias: estadisticasPorCategoria.length
                },
                porCategoria: estadisticasPorCategoria,
                recientes: contrasenasMasRecientes
            }
        });
    }
    catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor'
        });
    }
};
exports.obtenerEstadisticas = obtenerEstadisticas;
// Obtener categorías con conteo de contraseñas
const obtenerCategoriasConConteo = async (req, res) => {
    try {
        const usuarioId = req.usuario?.id;
        if (!usuarioId) {
            res.status(401).json({
                exito: false,
                mensaje: 'Usuario no autenticado'
            });
            return;
        }
        // Obtener estadísticas por categoría
        const estadisticasPorCategoria = await Contrasena_1.default.aggregate([
            { $match: { usuarioId } },
            { $group: { _id: '$categoria', cantidad: { $sum: 1 } } },
            { $sort: { cantidad: -1 } }
        ]);
        // Convertir a formato de objeto con categorías como keys
        const categoriasConConteo = {};
        estadisticasPorCategoria.forEach(item => {
            categoriasConConteo[item._id] = item.cantidad;
        });
        res.json({
            exito: true,
            mensaje: 'Categorías con conteo obtenidas exitosamente',
            datos: categoriasConConteo
        });
    }
    catch (error) {
        console.error('Error al obtener categorías con conteo:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor'
        });
    }
};
exports.obtenerCategoriasConConteo = obtenerCategoriasConConteo;
