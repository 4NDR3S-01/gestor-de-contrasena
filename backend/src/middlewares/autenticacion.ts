import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import Usuario, { IUsuario } from '../modelos/Usuario';

// Extender la interfaz Request para incluir usuario
declare global {
  namespace Express {
    interface Request {
      usuario?: IUsuario;
    }
  }
}

// Interfaz para el payload del JWT
interface PayloadJWT {
  id: string;
  email: string;
  iat: number;
  exp: number;
}

// Middleware para verificar autenticación
export const verificarAutenticacion = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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

    const decoded = jwt.verify(token, secreto) as PayloadJWT;
    
    // Buscar usuario en la base de datos
    const usuario = await Usuario.findById(decoded.id).select('-contrasenaHash -contrasenaMaestra');
    
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

  } catch (error) {
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
      console.error('Error en middleware de autenticación:', error);
      res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor.'
      });
    }
  }
};
