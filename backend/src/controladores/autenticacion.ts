import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Usuario from '../modelos/Usuario';
import { generarTokenJWT, generarTokenRecuperacion } from '../utilidades/seguridad';
import { enviarEmailRecuperacion } from '../servicios/email';

// Interfaz para las respuestas de la API
interface RespuestaAPI {
  exito: boolean;
  mensaje: string;
  datos?: any;
}

// Registro de nuevo usuario
export const registrarUsuario = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validar errores de entrada
    const errores = validationResult(req);
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
    const usuarioExistente = await Usuario.findOne({ email });
    if (usuarioExistente) {
      res.status(400).json({
        exito: false,
        mensaje: 'Ya existe una cuenta con este email'
      });
      return;
    }

    // Crear nuevo usuario
    const nuevoUsuario = new Usuario({
      nombre: nombre.trim(),
      email: email.toLowerCase().trim(),
      contrasenaHash: contrasena,
      contrasenaMaestra: contrasenaMaestra
    });

    await nuevoUsuario.save();

    // Generar token JWT
    const token = generarTokenJWT({
      id: (nuevoUsuario._id as mongoose.Types.ObjectId).toString(),
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

  } catch (error) {
    console.error('Error en registro de usuario:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor al registrar usuario'
    });
  }
};

// Iniciar sesión
export const iniciarSesion = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validar errores de entrada
    const errores = validationResult(req);
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
    const usuario = await Usuario.findOne({ 
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
    const token = generarTokenJWT({
      id: (usuario._id as mongoose.Types.ObjectId).toString(),
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

  } catch (error) {
    console.error('Error en inicio de sesión:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor al iniciar sesión'
    });
  }
};

// Verificar contraseña maestra
export const verificarContrasenaMaestra = async (req: Request, res: Response): Promise<void> => {
  try {
    const errores = validationResult(req);
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

    const usuario = await Usuario.findById(usuarioId);
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

  } catch (error) {
    console.error('Error al verificar contraseña maestra:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor'
    });
  }
};

// Solicitar recuperación de contraseña
export const solicitarRecuperacionContrasena = async (req: Request, res: Response): Promise<void> => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      res.status(400).json({
        exito: false,
        mensaje: 'Email inválido',
        errores: errores.array()
      });
      return;
    }

    const { email } = req.body;

    const usuario = await Usuario.findOne({ 
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
    const tokenRecuperacion = generarTokenRecuperacion();
    const expiracionToken = new Date(Date.now() + 3600000); // 1 hora

    // Guardar token en el usuario
    usuario.tokenRecuperacion = tokenRecuperacion;
    usuario.expiracionTokenRecuperacion = expiracionToken;
    await usuario.save();

    // Enviar email de recuperación
    try {
      await enviarEmailRecuperacion(
        usuario.email,
        usuario.nombre,
        tokenRecuperacion
      );
    } catch (emailError) {
      console.error('Error al enviar email de recuperación:', emailError);
      // No exponemos el error del email por seguridad
    }

    res.json({
      exito: true,
      mensaje: 'Si el email existe en nuestro sistema, recibirás un enlace de recuperación'
    });

  } catch (error) {
    console.error('Error en solicitud de recuperación:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor'
    });
  }
};

// Restablecer contraseña
export const restablecerContrasena = async (req: Request, res: Response): Promise<void> => {
  try {
    const errores = validationResult(req);
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
    const usuario = await Usuario.findOne({
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

  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor'
    });
  }
};

// Obtener perfil del usuario
export const obtenerPerfil = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarioId = req.usuario?.id;

    if (!usuarioId) {
      res.status(401).json({
        exito: false,
        mensaje: 'Usuario no autenticado'
      });
      return;
    }

    const usuario = await Usuario.findById(usuarioId).select('-contrasenaHash -contrasenaMaestra -tokenRecuperacion');

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

  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor'
    });
  }
};

// Cerrar sesión (invalidar token del lado del cliente)
export const cerrarSesion = async (req: Request, res: Response): Promise<void> => {
  try {
    // En una implementación JWT stateless, el logout se maneja del lado del cliente
    // Aquí podríamos agregar el token a una lista negra si fuera necesario
    res.json({
      exito: true,
      mensaje: 'Sesión cerrada exitosamente'
    });

  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor'
    });
  }
};

// Actualizar perfil del usuario
export const actualizarPerfil = async (req: Request, res: Response): Promise<void> => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      res.status(400).json({
        exito: false,
        mensaje: 'Datos de entrada inválidos',
        errores: errores.array()
      });
      return;
    }

    const usuarioId = req.usuario?.id;
    const { nombre, email } = req.body;

    if (!usuarioId) {
      res.status(401).json({
        exito: false,
        mensaje: 'Usuario no autenticado'
      });
      return;
    }

    // Verificar si el nuevo email ya existe (si se está cambiando)
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
      res.status(404).json({
        exito: false,
        mensaje: 'Usuario no encontrado'
      });
      return;
    }

    if (email && email.toLowerCase() !== usuario.email.toLowerCase()) {
      const emailExistente = await Usuario.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: usuarioId }
      });

      if (emailExistente) {
        res.status(400).json({
          exito: false,
          mensaje: 'Ya existe una cuenta con este email'
        });
        return;
      }
    }

    // Actualizar el usuario
    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      usuarioId,
      {
        ...(nombre && { nombre: nombre.trim() }),
        ...(email && { email: email.toLowerCase().trim() })
      },
      { new: true, runValidators: true }
    ).select('-contrasenaHash -contrasenaMaestra -tokenRecuperacion');

    if (!usuarioActualizado) {
      res.status(404).json({
        exito: false,
        mensaje: 'Usuario no encontrado'
      });
      return;
    }

    res.json({
      exito: true,
      mensaje: 'Perfil actualizado exitosamente',
      datos: {
        usuario: {
          id: usuarioActualizado._id,
          nombre: usuarioActualizado.nombre,
          email: usuarioActualizado.email,
          fechaCreacion: usuarioActualizado.fechaCreacion,
          fechaUltimoAcceso: usuarioActualizado.fechaUltimoAcceso,
          estaActivo: usuarioActualizado.estaActivo
        }
      }
    });

  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor'
    });
  }
};

// Cambiar contraseña maestra
export const cambiarContrasenaMaestra = async (req: Request, res: Response): Promise<void> => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      res.status(400).json({
        exito: false,
        mensaje: 'Datos de entrada inválidos',
        errores: errores.array()
      });
      return;
    }

    const usuarioId = req.usuario?.id;
    const { contrasenaActual, nuevaContrasena } = req.body;

    if (!usuarioId) {
      res.status(401).json({
        exito: false,
        mensaje: 'Usuario no autenticado'
      });
      return;
    }

    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
      res.status(404).json({
        exito: false,
        mensaje: 'Usuario no encontrado'
      });
      return;
    }

    // Verificar la contraseña maestra actual
    const contrasenaActualValida = await usuario.compararContrasenaMaestra(contrasenaActual);
    if (!contrasenaActualValida) {
      res.status(400).json({
        exito: false,
        mensaje: 'La contraseña maestra actual es incorrecta'
      });
      return;
    }

    // Actualizar la contraseña maestra
    usuario.contrasenaMaestra = nuevaContrasena;
    await usuario.save();

    res.json({
      exito: true,
      mensaje: 'Contraseña maestra cambiada exitosamente'
    });

  } catch (error) {
    console.error('Error al cambiar contraseña maestra:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor'
    });
  }
};

// Cambiar contraseña de la cuenta (no la maestra)
export const cambiarContrasenaCuenta = async (req: Request, res: Response): Promise<void> => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      res.status(400).json({
        exito: false,
        mensaje: 'Datos de entrada inválidos',
        errores: errores.array()
      });
      return;
    }

    const usuarioId = req.usuario?.id;
    const { contrasenaActual, nuevaContrasena } = req.body;

    if (!usuarioId) {
      res.status(401).json({
        exito: false,
        mensaje: 'Usuario no autenticado'
      });
      return;
    }

    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
      res.status(404).json({
        exito: false,
        mensaje: 'Usuario no encontrado'
      });
      return;
    }

    // Verificar la contraseña actual
    const contrasenaActualValida = await usuario.compararContrasena(contrasenaActual);
    if (!contrasenaActualValida) {
      res.status(400).json({
        exito: false,
        mensaje: 'La contraseña actual es incorrecta'
      });
      return;
    }

    // Actualizar la contraseña de la cuenta
    usuario.contrasenaHash = nuevaContrasena;
    await usuario.save();

    res.json({
      exito: true,
      mensaje: 'Contraseña de la cuenta cambiada exitosamente'
    });
  } catch (error) {
    console.error('Error al cambiar contraseña de la cuenta:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor'
    });
  }
};
