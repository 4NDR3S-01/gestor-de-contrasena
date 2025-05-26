import { Request, Response } from 'express';
import Notificacion from '../modelos/Notificacion';

// Obtener notificaciones del usuario
export const obtenerNotificaciones = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarioId = req.usuario?.id;
    const pagina = parseInt(req.query.pagina as string) || 1;
    const limite = Math.min(parseInt(req.query.limite as string) || 20, 50);
    const soloNoLeidas = req.query.soloNoLeidas === 'true';

    if (!usuarioId) {
      res.status(401).json({
        exito: false,
        mensaje: 'Usuario no autenticado'
      });
      return;
    }

    // Construir filtros
    const filtros: any = { usuarioId };
    if (soloNoLeidas) {
      filtros.leida = false;
    }

    // Obtener notificaciones con paginación
    const notificaciones = await Notificacion
      .find(filtros)
      .sort({ fechaCreacion: -1 })
      .limit(limite)
      .skip((pagina - 1) * limite)
      .lean();

    // Contar total
    const total = await Notificacion.countDocuments(filtros);
    const totalPaginas = Math.ceil(total / limite);

    // Contar no leídas
    const noLeidas = await Notificacion.countDocuments({ 
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

  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor'
    });
  }
};

// Marcar notificación como leída
export const marcarComoLeida = async (req: Request, res: Response): Promise<void> => {
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

    const notificacion = await Notificacion.findOneAndUpdate(
      { _id: id, usuarioId },
      { 
        leida: true, 
        fechaLectura: new Date() 
      },
      { new: true }
    );

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

  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor'
    });
  }
};

// Marcar todas las notificaciones como leídas
export const marcarTodasComoLeidas = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarioId = req.usuario?.id;

    if (!usuarioId) {
      res.status(401).json({
        exito: false,
        mensaje: 'Usuario no autenticado'
      });
      return;
    }

    const resultado = await Notificacion.updateMany(
      { usuarioId, leida: false },
      { 
        leida: true, 
        fechaLectura: new Date() 
      }
    );

    res.status(200).json({
      exito: true,
      mensaje: `${resultado.modifiedCount} notificaciones marcadas como leídas`,
      datos: { 
        notificacionesActualizadas: resultado.modifiedCount 
      }
    });

  } catch (error) {
    console.error('Error al marcar todas las notificaciones como leídas:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor'
    });
  }
};

// Eliminar notificación
export const eliminarNotificacion = async (req: Request, res: Response): Promise<void> => {
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

    const notificacion = await Notificacion.findOneAndDelete({
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

  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor'
    });
  }
};

// Crear nueva notificación (función utilitaria)
export const crearNotificacion = async (
  usuarioId: string,
  tipo: string,
  titulo: string,
  mensaje: string,
  datos?: any
): Promise<void> => {
  try {
    await Notificacion.create({
      usuarioId,
      tipo,
      titulo,
      mensaje,
      datos
    });
  } catch (error) {
    console.error('Error al crear notificación:', error);
  }
};
