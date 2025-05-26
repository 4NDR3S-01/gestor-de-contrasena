import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { 
  generarContrasenaSagura, 
  validarFortalezaContrasena,
  OpcionesGeneradorContrasena 
} from '../utilidades/seguridad';
import { CategoriaContrasena } from '../modelos/Contrasena';

// Generar contraseña segura
export const generarContrasena = async (req: Request, res: Response): Promise<void> => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      res.status(400).json({
        exito: false,
        mensaje: 'Opciones de generación inválidas',
        errores: errores.array()
      });
      return;
    }

    const {
      longitud = 12,
      incluirMayusculas = true,
      incluirMinusculas = true,
      incluirNumeros = true,
      incluirSimbolos = true,
      excluirCaracteresAmbiguos = true
    } = req.body;

    // Validar opciones
    if (longitud < 4 || longitud > 128) {
      res.status(400).json({
        exito: false,
        mensaje: 'La longitud debe estar entre 4 y 128 caracteres'
      });
      return;
    }

    if (!incluirMayusculas && !incluirMinusculas && !incluirNumeros && !incluirSimbolos) {
      res.status(400).json({
        exito: false,
        mensaje: 'Debe seleccionar al menos un tipo de caracter'
      });
      return;
    }

    const opciones: OpcionesGeneradorContrasena = {
      longitud,
      incluirMayusculas,
      incluirMinusculas,
      incluirNumeros,
      incluirSimbolos,
      excluirCaracteresAmbiguos
    };

    // Generar contraseña
    const contrasenaGenerada = generarContrasenaSagura(opciones);
    
    // Validar fortaleza de la contraseña generada
    const fortaleza = validarFortalezaContrasena(contrasenaGenerada);

    res.json({
      exito: true,
      mensaje: 'Contraseña generada exitosamente',
      datos: {
        contrasena: contrasenaGenerada,
        fortaleza,
        opciones: opciones
      }
    });

  } catch (error) {
    console.error('Error al generar contraseña:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor al generar contraseña'
    });
  }
};

// Validar fortaleza de contraseña
export const validarContrasena = async (req: Request, res: Response): Promise<void> => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      res.status(400).json({
        exito: false,
        mensaje: 'Contraseña inválida para validar',
        errores: errores.array()
      });
      return;
    }

    const { contrasena } = req.body;

    if (!contrasena || typeof contrasena !== 'string') {
      res.status(400).json({
        exito: false,
        mensaje: 'Debe proporcionar una contraseña válida'
      });
      return;
    }

    const fortaleza = validarFortalezaContrasena(contrasena);

    res.json({
      exito: true,
      mensaje: 'Validación de fortaleza completada',
      datos: {
        fortaleza
      }
    });

  } catch (error) {
    console.error('Error al validar contraseña:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor al validar contraseña'
    });
  }
};

// Obtener categorías disponibles
export const obtenerCategorias = async (req: Request, res: Response): Promise<void> => {
  try {
    const categorias = Object.values(CategoriaContrasena).map(categoria => ({
      valor: categoria,
      etiqueta: categoria.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      icono: obtenerIconoCategoria(categoria)
    }));

    res.json({
      exito: true,
      mensaje: 'Categorías obtenidas exitosamente',
      datos: {
        categorias
      }
    });

  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor'
    });
  }
};

// Función auxiliar para obtener iconos de categorías
const obtenerIconoCategoria = (categoria: CategoriaContrasena): string => {
  const iconos: Record<CategoriaContrasena, string> = {
    [CategoriaContrasena.TRABAJO]: '💼',
    [CategoriaContrasena.PERSONAL]: '👤',
    [CategoriaContrasena.REDES_SOCIALES]: '📱',
    [CategoriaContrasena.BANCOS]: '🏦',
    [CategoriaContrasena.COMPRAS]: '🛒',
    [CategoriaContrasena.ENTRETENIMIENTO]: '🎮',
    [CategoriaContrasena.OTROS]: '📁'
  };
  
  return iconos[categoria] || '📁';
};

// Generar múltiples contraseñas
export const generarMultiplesContrasenas = async (req: Request, res: Response): Promise<void> => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      res.status(400).json({
        exito: false,
        mensaje: 'Opciones de generación inválidas',
        errores: errores.array()
      });
      return;
    }

    const {
      cantidad = 5,
      longitud = 12,
      incluirMayusculas = true,
      incluirMinusculas = true,
      incluirNumeros = true,
      incluirSimbolos = true,
      excluirCaracteresAmbiguos = true
    } = req.body;

    // Validar cantidad
    if (cantidad < 1 || cantidad > 20) {
      res.status(400).json({
        exito: false,
        mensaje: 'La cantidad debe estar entre 1 y 20 contraseñas'
      });
      return;
    }

    // Validar longitud
    if (longitud < 4 || longitud > 128) {
      res.status(400).json({
        exito: false,
        mensaje: 'La longitud debe estar entre 4 y 128 caracteres'
      });
      return;
    }

    if (!incluirMayusculas && !incluirMinusculas && !incluirNumeros && !incluirSimbolos) {
      res.status(400).json({
        exito: false,
        mensaje: 'Debe seleccionar al menos un tipo de caracter'
      });
      return;
    }

    const opciones: OpcionesGeneradorContrasena = {
      longitud,
      incluirMayusculas,
      incluirMinusculas,
      incluirNumeros,
      incluirSimbolos,
      excluirCaracteresAmbiguos
    };

    // Generar múltiples contraseñas
    const contrasenas = [];
    for (let i = 0; i < cantidad; i++) {
      const contrasenaGenerada = generarContrasenaSagura(opciones);
      const fortaleza = validarFortalezaContrasena(contrasenaGenerada);
      
      contrasenas.push({
        id: i + 1,
        contrasena: contrasenaGenerada,
        fortaleza: fortaleza.puntuacion,
        esSegura: fortaleza.esSegura
      });
    }

    // Ordenar por fortaleza (más seguras primero)
    contrasenas.sort((a, b) => b.fortaleza - a.fortaleza);

    res.json({
      exito: true,
      mensaje: `${cantidad} contraseñas generadas exitosamente`,
      datos: {
        contrasenas,
        opciones
      }
    });

  } catch (error) {
    console.error('Error al generar múltiples contraseñas:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor'
    });
  }
};

// Obtener configuración predeterminada para el generador
export const obtenerConfiguracionGenerador = async (req: Request, res: Response): Promise<void> => {
  try {
    const configuracionPredeterminada = {
      longitud: 12,
      incluirMayusculas: true,
      incluirMinusculas: true,
      incluirNumeros: true,
      incluirSimbolos: true,
      excluirCaracteresAmbiguos: true
    };

    const presets = [
      {
        nombre: 'Básica',
        descripcion: 'Contraseña básica con letras y números',
        opciones: {
          longitud: 8,
          incluirMayusculas: true,
          incluirMinusculas: true,
          incluirNumeros: true,
          incluirSimbolos: false,
          excluirCaracteresAmbiguos: true
        }
      },
      {
        nombre: 'Segura',
        descripcion: 'Contraseña segura recomendada',
        opciones: {
          longitud: 12,
          incluirMayusculas: true,
          incluirMinusculas: true,
          incluirNumeros: true,
          incluirSimbolos: true,
          excluirCaracteresAmbiguos: true
        }
      },
      {
        nombre: 'Máxima Seguridad',
        descripcion: 'Contraseña con máxima seguridad',
        opciones: {
          longitud: 20,
          incluirMayusculas: true,
          incluirMinusculas: true,
          incluirNumeros: true,
          incluirSimbolos: true,
          excluirCaracteresAmbiguos: false
        }
      },
      {
        nombre: 'PIN Numérico',
        descripcion: 'Solo números para PINs',
        opciones: {
          longitud: 6,
          incluirMayusculas: false,
          incluirMinusculas: false,
          incluirNumeros: true,
          incluirSimbolos: false,
          excluirCaracteresAmbiguos: true
        }
      }
    ];

    res.json({
      exito: true,
      mensaje: 'Configuración del generador obtenida exitosamente',
      datos: {
        configuracionPredeterminada,
        presets
      }
    });

  } catch (error) {
    console.error('Error al obtener configuración del generador:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor'
    });
  }
};
