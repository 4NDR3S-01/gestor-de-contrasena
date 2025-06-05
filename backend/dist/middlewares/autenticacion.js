"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificarAutenticacion = void 0;
// Importación del módulo jsonwebtoken para manejar JWT
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Importación del modelo de usuario y su interfaz
const Usuario_1 = __importDefault(require("../modelos/Usuario"));
// Middleware que verifica si el usuario está autenticado mediante JWT
const verificarAutenticacion = async (req, res, next) => {
    try {
        // Obtener el encabezado Authorization del request
        const authHeader = req.header('Authorization');
        // Validar si el token está presente y tiene el formato correcto
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                exito: false,
                mensaje: 'Acceso denegado. Token no proporcionado.'
            });
            return;
        }
        // Extraer el token eliminando el prefijo 'Bearer '
        const token = authHeader.substring(7);
        // Validar si el token está vacío
        if (!token) {
            res.status(401).json({
                exito: false,
                mensaje: 'Acceso denegado. Token no válido.'
            });
            return;
        }
        // Obtener la clave secreta desde las variables de entorno
        const secreto = process.env.JWT_SECRET;
        if (!secreto) {
            throw new Error('JWT_SECRET no está configurado');
        }
        // Verificar y decodificar el token usando la clave secreta
        const decoded = jsonwebtoken_1.default.verify(token, secreto);
        // Buscar el usuario en la base de datos usando el ID del token
        const usuario = await Usuario_1.default.findById(decoded.id).select('-contrasenaHash -contrasenaMaestra');
        // Validar si el usuario fue encontrado
        if (!usuario) {
            res.status(401).json({
                exito: false,
                mensaje: 'Token no válido. Usuario no encontrado.'
            });
            return;
        }
        // Validar si la cuenta del usuario está activa
        if (!usuario.estaActivo) {
            res.status(401).json({
                exito: false,
                mensaje: 'Cuenta desactivada. Contacta al administrador.'
            });
            return;
        }
        // Registrar la fecha del último acceso del usuario
        usuario.fechaUltimoAcceso = new Date();
        await usuario.save();
        // Adjuntar el usuario autenticado al objeto de la solicitud
        req.usuario = usuario;
        // Continuar con el siguiente middleware o ruta
        next();
    }
    catch (error) {
        // Manejo de errores específicos relacionados con el token
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
            // Manejo de errores generales
            console.error('Error en middleware de autenticación:', error);
            res.status(500).json({
                exito: false,
                mensaje: 'Error interno del servidor.'
            });
        }
    }
};
exports.verificarAutenticacion = verificarAutenticacion;
