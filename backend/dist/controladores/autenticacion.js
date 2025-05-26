"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cerrarSesion = exports.obtenerPerfil = exports.restablecerContrasena = exports.solicitarRecuperacionContrasena = exports.verificarContrasenaMaestra = exports.iniciarSesion = exports.registrarUsuario = void 0;
const express_validator_1 = require("express-validator");
const Usuario_1 = __importDefault(require("../modelos/Usuario"));
const seguridad_1 = require("../utilidades/seguridad");
const email_1 = require("../servicios/email");
// Registro de nuevo usuario
const registrarUsuario = async (req, res) => {
    try {
        // Validar errores de entrada
        const errores = (0, express_validator_1.validationResult)(req);
        if (!errores.isEmpty()) {
            res.status(400).json({
                exito: false,
                mensaje: 'Datos de entrada inválidos',
                errores: errores.array()
            });
            return;
        }
        const { nombre, email, contrasena, contrasenaMaestra } = req.body;
        // Verificar si el usuario ya existe
        const usuarioExistente = await Usuario_1.default.findOne({ email });
        if (usuarioExistente) {
            res.status(400).json({
                exito: false,
                mensaje: 'Ya existe una cuenta con este email'
            });
            return;
        }
        // Crear nuevo usuario
        const nuevoUsuario = new Usuario_1.default({
            nombre: nombre.trim(),
            email: email.toLowerCase().trim(),
            contrasenaHash: contrasena,
            contrasenaMaestra: contrasenaMaestra
        });
        await nuevoUsuario.save();
        // Generar token JWT
        const token = (0, seguridad_1.generarTokenJWT)({
            id: nuevoUsuario._id.toString(),
            email: nuevoUsuario.email
        });
        // Respuesta exitosa (sin datos sensibles)
        res.status(201).json({
            exito: true,
            mensaje: 'Usuario registrado exitosamente',
            datos: {
                token,
                usuario: {
                    id: nuevoUsuario._id,
                    nombre: nuevoUsuario.nombre,
                    email: nuevoUsuario.email,
                    fechaCreacion: nuevoUsuario.fechaCreacion
                }
            }
        });
    }
    catch (error) {
        console.error('Error en registro de usuario:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor al registrar usuario'
        });
    }
};
exports.registrarUsuario = registrarUsuario;
// Iniciar sesión
const iniciarSesion = async (req, res) => {
    try {
        // Validar errores de entrada
        const errores = (0, express_validator_1.validationResult)(req);
        if (!errores.isEmpty()) {
            res.status(400).json({
                exito: false,
                mensaje: 'Datos de entrada inválidos',
                errores: errores.array()
            });
            return;
        }
        const { email, contrasena } = req.body;
        // Buscar usuario por email
        const usuario = await Usuario_1.default.findOne({
            email: email.toLowerCase().trim(),
            estaActivo: true
        });
        if (!usuario) {
            res.status(401).json({
                exito: false,
                mensaje: 'Credenciales inválidas'
            });
            return;
        }
        // Verificar contraseña
        const contrasenaValida = await usuario.compararContrasena(contrasena);
        if (!contrasenaValida) {
            res.status(401).json({
                exito: false,
                mensaje: 'Credenciales inválidas'
            });
            return;
        }
        // Actualizar fecha de último acceso
        usuario.fechaUltimoAcceso = new Date();
        await usuario.save();
        // Generar token JWT
        const token = (0, seguridad_1.generarTokenJWT)({
            id: usuario._id.toString(),
            email: usuario.email
        });
        res.json({
            exito: true,
            mensaje: 'Sesión iniciada exitosamente',
            datos: {
                token,
                usuario: {
                    id: usuario._id,
                    nombre: usuario.nombre,
                    email: usuario.email,
                    fechaUltimoAcceso: usuario.fechaUltimoAcceso
                }
            }
        });
    }
    catch (error) {
        console.error('Error en inicio de sesión:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor al iniciar sesión'
        });
    }
};
exports.iniciarSesion = iniciarSesion;
// Verificar contraseña maestra
const verificarContrasenaMaestra = async (req, res) => {
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
        const { contrasenaMaestra } = req.body;
        const usuarioId = req.usuario?.id;
        if (!usuarioId) {
            res.status(401).json({
                exito: false,
                mensaje: 'Usuario no autenticado'
            });
            return;
        }
        const usuario = await Usuario_1.default.findById(usuarioId);
        if (!usuario) {
            res.status(404).json({
                exito: false,
                mensaje: 'Usuario no encontrado'
            });
            return;
        }
        const contrasenaMaestraValida = await usuario.compararContrasenaMaestra(contrasenaMaestra);
        res.json({
            exito: true,
            mensaje: contrasenaMaestraValida ? 'Contraseña maestra válida' : 'Contraseña maestra inválida',
            datos: {
                esValida: contrasenaMaestraValida
            }
        });
    }
    catch (error) {
        console.error('Error al verificar contraseña maestra:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor'
        });
    }
};
exports.verificarContrasenaMaestra = verificarContrasenaMaestra;
// Solicitar recuperación de contraseña
const solicitarRecuperacionContrasena = async (req, res) => {
    try {
        const errores = (0, express_validator_1.validationResult)(req);
        if (!errores.isEmpty()) {
            res.status(400).json({
                exito: false,
                mensaje: 'Email inválido',
                errores: errores.array()
            });
            return;
        }
        const { email } = req.body;
        const usuario = await Usuario_1.default.findOne({
            email: email.toLowerCase().trim(),
            estaActivo: true
        });
        // Por seguridad, siempre respondemos exitosamente
        // aunque el usuario no exista
        if (!usuario) {
            res.json({
                exito: true,
                mensaje: 'Si el email existe en nuestro sistema, recibirás un enlace de recuperación'
            });
            return;
        }
        // Generar token de recuperación
        const tokenRecuperacion = (0, seguridad_1.generarTokenRecuperacion)();
        const expiracionToken = new Date(Date.now() + 3600000); // 1 hora
        // Guardar token en el usuario
        usuario.tokenRecuperacion = tokenRecuperacion;
        usuario.expiracionTokenRecuperacion = expiracionToken;
        await usuario.save();
        // Enviar email de recuperación
        try {
            await (0, email_1.enviarEmailRecuperacion)(usuario.email, usuario.nombre, tokenRecuperacion);
        }
        catch (emailError) {
            console.error('Error al enviar email de recuperación:', emailError);
            // No exponemos el error del email por seguridad
        }
        res.json({
            exito: true,
            mensaje: 'Si el email existe en nuestro sistema, recibirás un enlace de recuperación'
        });
    }
    catch (error) {
        console.error('Error en solicitud de recuperación:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor'
        });
    }
};
exports.solicitarRecuperacionContrasena = solicitarRecuperacionContrasena;
// Restablecer contraseña
const restablecerContrasena = async (req, res) => {
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
        const { token, nuevaContrasena } = req.body;
        // Buscar usuario por token válido
        const usuario = await Usuario_1.default.findOne({
            tokenRecuperacion: token,
            expiracionTokenRecuperacion: { $gt: new Date() },
            estaActivo: true
        });
        if (!usuario) {
            res.status(400).json({
                exito: false,
                mensaje: 'Token de recuperación inválido o expirado'
            });
            return;
        }
        // Actualizar contraseña
        usuario.contrasenaHash = nuevaContrasena;
        usuario.tokenRecuperacion = undefined;
        usuario.expiracionTokenRecuperacion = undefined;
        await usuario.save();
        res.json({
            exito: true,
            mensaje: 'Contraseña restablecida exitosamente'
        });
    }
    catch (error) {
        console.error('Error al restablecer contraseña:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor'
        });
    }
};
exports.restablecerContrasena = restablecerContrasena;
// Obtener perfil del usuario
const obtenerPerfil = async (req, res) => {
    try {
        const usuarioId = req.usuario?.id;
        if (!usuarioId) {
            res.status(401).json({
                exito: false,
                mensaje: 'Usuario no autenticado'
            });
            return;
        }
        const usuario = await Usuario_1.default.findById(usuarioId).select('-contrasenaHash -contrasenaMaestra -tokenRecuperacion');
        if (!usuario) {
            res.status(404).json({
                exito: false,
                mensaje: 'Usuario no encontrado'
            });
            return;
        }
        res.json({
            exito: true,
            mensaje: 'Perfil obtenido exitosamente',
            datos: {
                usuario: {
                    id: usuario._id,
                    nombre: usuario.nombre,
                    email: usuario.email,
                    fechaCreacion: usuario.fechaCreacion,
                    fechaUltimoAcceso: usuario.fechaUltimoAcceso,
                    estaActivo: usuario.estaActivo
                }
            }
        });
    }
    catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor'
        });
    }
};
exports.obtenerPerfil = obtenerPerfil;
// Cerrar sesión (invalidar token del lado del cliente)
const cerrarSesion = async (req, res) => {
    try {
        // En una implementación JWT stateless, el logout se maneja del lado del cliente
        // Aquí podríamos agregar el token a una lista negra si fuera necesario
        res.json({
            exito: true,
            mensaje: 'Sesión cerrada exitosamente'
        });
    }
    catch (error) {
        console.error('Error al cerrar sesión:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor'
        });
    }
};
exports.cerrarSesion = cerrarSesion;
