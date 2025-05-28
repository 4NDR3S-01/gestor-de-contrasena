// Importación del módulo jsonwebtoken para manejar JWT
import jwt from 'jsonwebtoken';
// Importaciones necesarias desde Express
import { Request, Response, NextFunction } from 'express';
// Importación del modelo de usuario y su interfaz
import Usuario, { IUsuario } from '../modelos/Usuario';

// Extensión de la interfaz Request para incluir un campo "usuario" personalizado
declare global {
  namespace Express {
    interface Request {
      usuario?: IUsuario;
    }
  }
}

// Interfaz que define la estructura del payload dentro del JWT
interface PayloadJWT {
  id: string;       // ID del usuario
  email: string;    // Email del usuario
  iat: number;      // Fecha de emisión del token
  exp: number;      // Fecha de expiración del token
}

// Middleware que verifica si el usuario está autenticado mediante JWT
export const verificarAutenticacion = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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
    const decoded = jwt.verify(token, secreto) as PayloadJWT;
    
    // Buscar el usuario en la base de datos usando el ID del token
    const usuario = await Usuario.findById(decoded.id).select('-contrasenaHash -contrasenaMaestra');
    
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

  } catch (error) {
    // Manejo de errores específicos relacionados con el token
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        exito: false,
        mensaje: 'Token expirado. Por favor, inicia sesión nuevamente.'
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        exito: false,
        mensaje: 'Token inválido.'
      });
    } else {
      // Manejo de errores generales
      console.error('Error en middleware de autenticación:', error);
      res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor.'
      });
    }
  }
};
