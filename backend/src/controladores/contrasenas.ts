import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Contrasena, { CategoriaContrasena } from '../modelos/Contrasena';
import { encriptarContrasena, desencriptarContrasena } from '../utilidades/seguridad';
import ServicioNotificaciones from '../servicios/notificaciones';

// Obtener todas las contraseñas del usuario
export const obtenerContrasenas = async (req: Request, res: Response): Promise<void> => {
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
    const filtros: any = { usuarioId };

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
    const limitePagina = parseInt(limite as string);
    const paginaActual = parseInt(pagina as string);
    const salto = (paginaActual - 1) * limitePagina;

    // Obtener contraseñas con paginación
    const contrasenas = await Contrasena.find(filtros)
      .select('-contrasenaEncriptada') // No incluir la contraseña encriptada por defecto
      .sort({ esFavorito: -1, fechaModificacion: -1 })
      .limit(limitePagina)
      .skip(salto);

    // Contar total para paginación
    const total = await Contrasena.countDocuments(filtros);

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

  } catch (error) {
    console.error('Error al obtener contraseñas:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor'
    });
  }
};

// Obtener una contraseña específica (con la contraseña desencriptada)
export const obtenerContrasena = async (req: Request, res: Response): Promise<void> => {
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

    const contrasena = await Contrasena.findOne({
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
      const contrasenaDesencriptada = desencriptarContrasena(contrasena.contrasenaEncriptada);
      
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
    } catch (errorDesencriptacion) {
      console.error('Error al desencriptar contraseña:', errorDesencriptacion);
      res.status(500).json({
        exito: false,
        mensaje: 'Error al procesar la contraseña'
      });
    }

  } catch (error) {
    console.error('Error al obtener contraseña:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor'
    });
  }
};

// Crear nueva contraseña
export const crearContrasena = async (req: Request, res: Response): Promise<void> => {
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
    const { titulo, url, usuario, email, contrasena, notas, categoria, esFavorito } = req.body;

    if (!usuarioId) {
      res.status(401).json({
        exito: false,
        mensaje: 'Usuario no autenticado'
      });
      return;
    }

    // Verificar si ya existe una contraseña con el mismo título
    const contrasenaExistente = await Contrasena.findOne({
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
    const contrasenaEncriptada = encriptarContrasena(contrasena);

    // Crear nueva contraseña
    const nuevaContrasena = new Contrasena({
      usuarioId,
      titulo: titulo.trim(),
      url: url ? url.trim() : undefined,
      usuario: usuario ? usuario.trim() : undefined,
      email: email ? email.toLowerCase().trim() : undefined,
      contrasenaEncriptada,
      notas: typeof notas === 'string' ? notas : '',
      categoria: categoria ?? CategoriaContrasena.OTROS,
      esFavorito: esFavorito ?? false
    });

    await nuevaContrasena.save();

    // Crear notificación
    await ServicioNotificaciones.crear(
      usuarioId,
      'PASSWORD_CREATED',
      { sitio: titulo }
    );

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

  } catch (error) {
    console.error('Error al crear contraseña:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor'
    });
  }
};

// Actualizar contraseña existente
export const actualizarContrasena = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('=== INICIO ACTUALIZACIÓN ===');
    console.log('Body recibido:', req.body);
    console.log('Usuario ID:', req.usuario?.id);
    console.log('Parámetro ID:', req.params.id);

    const errores = validationResult(req);
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
    const datosActualizacion: any = {};

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
      datosActualizacion.categoria = categoria || CategoriaContrasena.OTROS;
    }

    if (esFavorito !== undefined) {
      datosActualizacion.esFavorito = Boolean(esFavorito);
    }

    // Solo encriptar nueva contraseña si se proporciona
    if (contrasena && contrasena.trim()) {
      const contrasenaEncriptada = encriptarContrasena(contrasena.trim());
      datosActualizacion.contrasenaEncriptada = contrasenaEncriptada;
    }

    datosActualizacion.fechaModificacion = new Date();

    console.log('Datos de actualización construidos:', datosActualizacion);

    const contrasenaActualizada = await Contrasena.findOneAndUpdate(
      { _id: id, usuarioId },
      datosActualizacion,
      { new: true }
    );

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
    await ServicioNotificaciones.crear(
      usuarioId,
      'PASSWORD_UPDATED',
      { sitio: contrasenaActualizada.titulo }
    );

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

  } catch (error) {
    console.error('Error completo al actualizar contraseña:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor'
    });
  }
};

// Eliminar contraseña
export const eliminarContrasena = async (req: Request, res: Response): Promise<void> => {
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

    const contrasenaEliminada = await Contrasena.findOneAndDelete({
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
    await ServicioNotificaciones.crear(
      usuarioId,
      'PASSWORD_DELETED',
      { sitio: contrasenaEliminada.titulo }
    );

    res.json({
      exito: true,
      mensaje: 'Contraseña eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar contraseña:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor'
    });
  }
};

// Alternar favorito
export const alternarFavorito = async (req: Request, res: Response): Promise<void> => {
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

    const contrasena = await Contrasena.findOne({
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
    await ServicioNotificaciones.crear(
      usuarioId,
      'PASSWORD_FAVORITED',
      { sitio: contrasena.titulo, esFavorito: contrasena.esFavorito }
    );

    res.json({
      exito: true,
      mensaje: `Contraseña ${contrasena.esFavorito ? 'agregada a' : 'removida de'} favoritos`,
      datos: {
        esFavorito: contrasena.esFavorito
      }
    });

  } catch (error) {
    console.error('Error al alternar favorito:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor'
    });
  }
};

// Obtener estadísticas del usuario
export const obtenerEstadisticas = async (req: Request, res: Response): Promise<void> => {
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
    const totalContrasenas = await Contrasena.countDocuments({ usuarioId });
    const totalFavoritos = await Contrasena.countDocuments({ usuarioId, esFavorito: true });

    // Estadísticas por categoría
    const estadisticasPorCategoria = await Contrasena.aggregate([
      { $match: { usuarioId } },
      { $group: { _id: '$categoria', cantidad: { $sum: 1 } } },
      { $sort: { cantidad: -1 } }
    ]);

    // Contraseñas más recientes
    const contrasenasMasRecientes = await Contrasena.find({ usuarioId })
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

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor'
    });
  }
};

// Obtener categorías con conteo de contraseñas
export const obtenerCategoriasConConteo = async (req: Request, res: Response): Promise<void> => {
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
    const estadisticasPorCategoria = await Contrasena.aggregate([
      { $match: { usuarioId } },
      { $group: { _id: '$categoria', cantidad: { $sum: 1 } } },
      { $sort: { cantidad: -1 } }
    ]);

    // Convertir a formato de objeto con categorías como keys
    const categoriasConConteo: Record<string, number> = {};
    estadisticasPorCategoria.forEach(item => {
      categoriasConConteo[item._id] = item.cantidad;
    });

    res.json({
      exito: true,
      mensaje: 'Categorías con conteo obtenidas exitosamente',
      datos: categoriasConConteo
    });

  } catch (error) {
    console.error('Error al obtener categorías con conteo:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor'
    });
  }
};
