"use strict"; // Activa el modo estricto de JavaScript para detectar errores comunes y aplicar buenas prácticas

// Función auxiliar para manejar importaciones por defecto en CommonJS
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};

// Define que el archivo exportará propiedades y activa compatibilidad con módulos
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificarAutenticacion = void 0;

// Importa la librería jsonwebtoken para trabajar con JWT
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Importa el modelo de Usuario desde la carpeta de modelos
const Usuario_1 = __importDefault(require("../modelos/Usuario"));

// Middleware para verificar autenticación
const verificarAutenticacion = async (req, res, next) => {
    try {
        // Obtener token del encabezado Authorization
        const authHeader = req.header('Authorization');
        
        // Verifica que el token exista y empiece con 'Bearer '
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                exito: false,
                mensaje: 'Acceso denegado. Token no proporcionado.'
            });
            return;
        }

        // Extrae el token quitando la palabra 'Bearer '
        const token = authHeader.substring(7); 

        // Verifica que el token no esté vacío
        if (!token) {
            res.status(401).json({
                exito: false,
                mensaje: 'Acceso denegado. Token no válido.'
            });
            return;
        }

        // Obtiene la clave secreta desde las variables de entorno
        const secreto = process.env.JWT_SECRET;
        if (!secreto) {
            throw new Error('JWT_SECRET no está configurado');
        }

        // Verifica y decodifica el token
        const decoded = jsonwebtoken_1.default.verify(token, secreto);

        // Busca el usuario correspondiente al ID del token y omite contraseñas
        const usuario = await Usuario_1.default.findById(decoded.id).select('-contrasenaHash -contrasenaMaestra');

        // Si el usuario no existe, se rechaza la petición
        if (!usuario) {
            res.status(401).json({
                exito: false,
                mensaje: 'Token no válido. Usuario no encontrado.'
            });
            return;
        }

        // Si el usuario está desactivado, se rechaza la petición
        if (!usuario.estaActivo) {
            res.status(401).json({
                exito: false,
                mensaje: 'Cuenta desactivada. Contacta al administrador.'
            });
            return;
        }

        // Actualiza la fecha del último acceso del usuario
        usuario.fechaUltimoAcceso = new Date();
        await usuario.save();

        // Se adjunta el usuario autenticado al objeto request para usarlo en rutas protegidas
        req.usuario = usuario;

        // Llama al siguiente middleware o ruta
        next();
    }
    catch (error) {
        // Si el token ha expirado
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({
                exito: false,
                mensaje: 'Token expirado. Por favor, inicia sesión nuevamente.'
            });
        }
        // Si el token es inválido
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({
                exito: false,
                mensaje: 'Token inválido.'
            });
        }
        // Cualquier otro error del servidor
        else {
            console.error('Error en middleware de autenticación:', error);
            res.status(500).json({
                exito: false,
                mensaje: 'Error interno del servidor.'
            });
        }
    }
};

// Exporta la función para usarla en rutas protegidas
exports.verificarAutenticacion = verificarAutenticacion;
