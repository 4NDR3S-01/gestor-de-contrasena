"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificarAutenticacion = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Usuario_1 = __importDefault(require("../modelos/Usuario"));
// Middleware para verificar autenticación
const verificarAutenticacion = async (req, res, next) => {
    try {
        // Obtener token del header Authorization
        const authHeader = req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                exito: false,
                mensaje: 'Acceso denegado. Token no proporcionado.'
            });
            return;
        }
        const token = authHeader.substring(7); // Remover 'Bearer '
        if (!token) {
            res.status(401).json({
                exito: false,
                mensaje: 'Acceso denegado. Token no válido.'
            });
            return;
        }
        // Verificar token
        const secreto = process.env.JWT_SECRET;
        if (!secreto) {
            throw new Error('JWT_SECRET no está configurado');
        }
        const decoded = jsonwebtoken_1.default.verify(token, secreto);
        // Buscar usuario en la base de datos
        const usuario = await Usuario_1.default.findById(decoded.id).select('-contrasenaHash -contrasenaMaestra');
        if (!usuario) {
            res.status(401).json({
                exito: false,
                mensaje: 'Token no válido. Usuario no encontrado.'
            });
            return;
        }
        if (!usuario.estaActivo) {
            res.status(401).json({
                exito: false,
                mensaje: 'Cuenta desactivada. Contacta al administrador.'
            });
            return;
        }
        // Actualizar fecha de último acceso
        usuario.fechaUltimoAcceso = new Date();
        await usuario.save();
        // Agregar usuario al request
        req.usuario = usuario;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({
                exito: false,
                mensaje: 'Token expirado. Por favor, inicia sesión nuevamente.'
            });
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({
                exito: false,
                mensaje: 'Token inválido.'
            });
        }
        else {
            console.error('Error en middleware de autenticación:', error);
            res.status(500).json({
                exito: false,
                mensaje: 'Error interno del servidor.'
            });
        }
    }
};
exports.verificarAutenticacion = verificarAutenticacion;
