"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.crearNotificacion = exports.eliminarNotificacion = exports.marcarTodasComoLeidas = exports.marcarComoLeida = exports.obtenerNotificaciones = void 0;
const Notificacion_1 = __importDefault(require("../modelos/Notificacion"));
// Obtener notificaciones del usuario
const obtenerNotificaciones = async (req, res) => {
    try {
        const usuarioId = req.usuario?.id;
        const pagina = parseInt(req.query.pagina) || 1;
        const limite = Math.min(parseInt(req.query.limite) || 20, 50);
        const soloNoLeidas = req.query.soloNoLeidas === 'true';
        if (!usuarioId) {
            res.status(401).json({
                exito: false,
                mensaje: 'Usuario no autenticado'
            });
            return;
        }
        // Construir filtros
        const filtros = { usuarioId };
        if (soloNoLeidas) {
            filtros.leida = false;
        }
        // Obtener notificaciones con paginación
        const notificaciones = await Notificacion_1.default
            .find(filtros)
            .sort({ fechaCreacion: -1 })
            .limit(limite)
            .skip((pagina - 1) * limite)
            .lean();
        // Contar total
        const total = await Notificacion_1.default.countDocuments(filtros);
        const totalPaginas = Math.ceil(total / limite);
        // Contar no leídas
        const noLeidas = await Notificacion_1.default.countDocuments({
            usuarioId,
            leida: false
        });
        res.status(200).json({
            exito: true,
            mensaje: 'Notificaciones obtenidas exitosamente',
            datos: {
                notificaciones,
                total,
                pagina,
                totalPaginas,
                noLeidas
            }
        });
    }
    catch (error) {
        console.error('Error al obtener notificaciones:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor'
        });
    }
};
exports.obtenerNotificaciones = obtenerNotificaciones;
// Marcar notificación como leída
const marcarComoLeida = async (req, res) => {
    try {
        const usuarioId = req.usuario?.id;
        const { id } = req.params;
        if (!usuarioId) {
            res.status(401).json({
                exito: false,
                mensaje: 'Usuario no autenticado'
            });
            return;
        }
        const notificacion = await Notificacion_1.default.findOneAndUpdate({ _id: id, usuarioId }, {
            leida: true,
            fechaLectura: new Date()
        }, { new: true });
        if (!notificacion) {
            res.status(404).json({
                exito: false,
                mensaje: 'Notificación no encontrada'
            });
            return;
        }
        res.status(200).json({
            exito: true,
            mensaje: 'Notificación marcada como leída',
            datos: { notificacion }
        });
    }
    catch (error) {
        console.error('Error al marcar notificación como leída:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor'
        });
    }
};
exports.marcarComoLeida = marcarComoLeida;
// Marcar todas las notificaciones como leídas
const marcarTodasComoLeidas = async (req, res) => {
    try {
        const usuarioId = req.usuario?.id;
        if (!usuarioId) {
            res.status(401).json({
                exito: false,
                mensaje: 'Usuario no autenticado'
            });
            return;
        }
        const resultado = await Notificacion_1.default.updateMany({ usuarioId, leida: false }, {
            leida: true,
            fechaLectura: new Date()
        });
        res.status(200).json({
            exito: true,
            mensaje: `${resultado.modifiedCount} notificaciones marcadas como leídas`,
            datos: {
                notificacionesActualizadas: resultado.modifiedCount
            }
        });
    }
    catch (error) {
        console.error('Error al marcar todas las notificaciones como leídas:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor'
        });
    }
};
exports.marcarTodasComoLeidas = marcarTodasComoLeidas;
// Eliminar notificación
const eliminarNotificacion = async (req, res) => {
    try {
        const usuarioId = req.usuario?.id;
        const { id } = req.params;
        if (!usuarioId) {
            res.status(401).json({
                exito: false,
                mensaje: 'Usuario no autenticado'
            });
            return;
        }
        const notificacion = await Notificacion_1.default.findOneAndDelete({
            _id: id,
            usuarioId
        });
        if (!notificacion) {
            res.status(404).json({
                exito: false,
                mensaje: 'Notificación no encontrada'
            });
            return;
        }
        res.status(200).json({
            exito: true,
            mensaje: 'Notificación eliminada exitosamente'
        });
    }
    catch (error) {
        console.error('Error al eliminar notificación:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor'
        });
    }
};
exports.eliminarNotificacion = eliminarNotificacion;
// Crear nueva notificación (función utilitaria)
const crearNotificacion = async (usuarioId, tipo, titulo, mensaje, datos) => {
    try {
        await Notificacion_1.default.create({
            usuarioId,
            tipo,
            titulo,
            mensaje,
            datos
        });
    }
    catch (error) {
        console.error('Error al crear notificación:', error);
    }
};
exports.crearNotificacion = crearNotificacion;
