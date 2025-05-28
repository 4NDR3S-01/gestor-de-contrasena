import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';

//                      VALIDADORES PARA AUTENTICACIÓN 

// Validación al momento del registro de usuario
export const validarRegistro = [
  // Nombre: letras y espacios, entre 2 y 50 caracteres
  body('nombre')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/)
    .withMessage('El nombre solo puede contener letras y espacios'),

  // Email válido, máximo 100 caracteres
  body('email')
    .isEmail()
    .withMessage('Debe proporcionar un email válido')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('El email no puede tener más de 100 caracteres'),

  // Contraseña: segura (mayúscula, minúscula, número), entre 8 y 128
  body('contrasena')
    .isLength({ min: 8, max: 128 })
    .withMessage('La contraseña debe tener entre 8 y 128 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una minúscula, una mayúscula y un número'),

  // Contraseña maestra: misma lógica de validación que la anterior
  body('contrasenaMaestra')
    .isLength({ min: 8, max: 128 })
    .withMessage('La contraseña maestra debe tener entre 8 y 128 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña maestra debe contener al menos una minúscula, una mayúscula y un número')
];

// Validación para login (inicio de sesión)
export const validarLogin = [
  body('email')
    .isEmail()
    .withMessage('Debe proporcionar un email válido')
    .normalizeEmail(),

  body('contrasena')
    .notEmpty()
    .withMessage('La contraseña es obligatoria')
    .isLength({ min: 1, max: 128 })
    .withMessage('La contraseña no puede estar vacía')
];

// Validación para uso de la contraseña maestra
export const validarContrasenaMaestra = [
  body('contrasenaMaestra')
    .notEmpty()
    .withMessage('La contraseña maestra es obligatoria')
    .isLength({ min: 1, max: 128 })
    .withMessage('La contraseña maestra no puede estar vacía')
];

// Validación para recuperar contraseña (por email)
export const validarRecuperacionContrasena = [
  body('email')
    .isEmail()
    .withMessage('Debe proporcionar un email válido')
    .normalizeEmail()
];

// Validación para restablecer contraseña con token
export const validarRestablecerContrasena = [
  body('token')
    .notEmpty()
    .withMessage('El token de recuperación es obligatorio')
    .isLength({ min: 32, max: 256 })
    .withMessage('Token de recuperación inválido'),

  body('nuevaContrasena')
    .isLength({ min: 8, max: 128 })
    .withMessage('La nueva contraseña debe tener entre 8 y 128 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La nueva contraseña debe contener al menos una minúscula, una mayúscula y un número')
];

// Validación para cambiar la contraseña maestra
export const validarCambiarContrasenaMaestra = [
  body('contrasenaActual')
    .notEmpty()
    .withMessage('La contraseña actual es obligatoria')
    .isLength({ min: 1, max: 128 })
    .withMessage('La contraseña actual no puede estar vacía'),

  body('nuevaContrasena')
    .isLength({ min: 8, max: 128 })
    .withMessage('La nueva contraseña maestra debe tener entre 8 y 128 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La nueva contraseña maestra debe contener al menos una minúscula, una mayúscula y un número')
];

//                                 VALIDADORES PARA CONTRASEÑAS GUARDADAS 

// Validar creación de nueva contraseña guardada
export const validarCrearContrasena = [
  body('titulo')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('El título debe tener entre 1 y 100 caracteres')
    .notEmpty()
    .withMessage('El título es obligatorio'),

  body('url')
    .optional()
    .trim()
    .isURL({ require_protocol: false })
    .withMessage('La URL no es válida')
    .isLength({ max: 500 })
    .withMessage('La URL no puede tener más de 500 caracteres'),

  body('usuario')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('El usuario debe tener entre 1 y 100 caracteres'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('El email no es válido')
    .normalizeEmail(),

  body('contrasena')
    .isLength({ min: 1, max: 256 })
    .withMessage('La contraseña debe tener entre 1 y 256 caracteres')
    .notEmpty()
    .withMessage('La contraseña es obligatoria'),

  body('notas')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Las notas no pueden tener más de 500 caracteres'),

  body('categoria')
    .optional()
    .isIn(['trabajo', 'personal', 'redes_sociales', 'bancos', 'compras', 'entretenimiento', 'otros'])
    .withMessage('Categoría no válida'),

  body('esFavorito')
    .optional()
    .isBoolean()
    .withMessage('esFavorito debe ser un valor booleano')
];

// Validar actualización de contraseña guardada
export const validarActualizarContrasena = [
  param('id')
    .isMongoId()
    .withMessage('ID de contraseña inválido'),

  body('titulo')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('El título debe tener entre 1 y 100 caracteres'),

  body('url')
    .optional()
    .trim()
    .custom((value) => {
      if (value === '') return true;
      return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(value);
    })
    .withMessage('La URL no es válida')
    .isLength({ max: 500 })
    .withMessage('La URL no puede tener más de 500 caracteres'),

  body('usuario')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('El usuario debe tener entre 1 y 100 caracteres'),

  body('email')
    .optional()
    .trim()
    .custom((value) => {
      if (value === '') return true;
      return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value);
    })
    .withMessage('El email no es válido'),

  body('contrasena')
    .optional()
    .isLength({ min: 1, max: 256 })
    .withMessage('La contraseña debe tener entre 1 y 256 caracteres'),

  body('notas')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Las notas no pueden tener más de 500 caracteres'),

  body('categoria')
    .optional()
    .isIn(['trabajo', 'personal', 'redes_sociales', 'bancos', 'compras', 'entretenimiento', 'otros'])
    .withMessage('Categoría no válida'),

  body('esFavorito')
    .optional()
    .isBoolean()
    .withMessage('esFavorito debe ser un valor booleano')
];

// Validación para obtener una contraseña por su ID
export const validarIdContrasena = [
  param('id')
    .isMongoId()
    .withMessage('ID de contraseña inválido')
];

// Validación para búsquedas con filtros (categoría, búsqueda por texto, favoritos, paginación)
export const validarBusquedaContrasenas = [
  query('categoria')
    .optional()
    .isIn(['trabajo', 'personal', 'redes_sociales', 'bancos', 'compras', 'entretenimiento', 'otros', 'todas'])
    .withMessage('Categoría no válida'),

  query('busqueda')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('El término de búsqueda no puede tener más de 100 caracteres'),

  query('favoritos')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('El parámetro favoritos debe ser true o false'),

  query('limite')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe ser un número entre 1 y 100'),

  query('pagina')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número mayor a 0')
];

//                               VALIDADORES PARA UTILIDADES 

// Validación para generación de contraseñas seguras
export const validarGenerarContrasena = [
  body('longitud')
    .optional()
    .isInt({ min: 4, max: 128 })
    .withMessage('La longitud debe estar entre 4 y 128 caracteres'),

  body('incluirMayusculas')
    .optional()
    .isBoolean()
    .withMessage('incluirMayusculas debe ser un valor booleano'),

  body('incluirMinusculas')
    .optional()
    .isBoolean()
    .withMessage('incluirMinusculas debe ser un valor booleano'),

  body('incluirNumeros')
    .optional()
    .isBoolean()
    .withMessage('incluirNumeros debe ser un valor booleano'),

  body('incluirSimbolos')
    .optional()
    .isBoolean()
    .withMessage('incluirSimbolos debe ser un valor booleano'),

  body('excluirCaracteresAmbiguos')
    .optional()
    .isBoolean()
    .withMessage('excluirCaracteresAmbiguos debe ser un valor booleano')
];

// Generación de múltiples contraseñas reutilizando validaciones anteriores
export const validarGenerarMultiplesContrasenas = [
  body('cantidad')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('La cantidad debe estar entre 1 y 20'),

  ...validarGenerarContrasena
];

// Validación de fortaleza de contraseña ingresada por el usuario
export const validarValidarContrasena = [
  body('contrasena')
    .isLength({ min: 1, max: 256 })
    .withMessage('La contraseña debe tener entre 1 y 256 caracteres')
    .notEmpty()
    .withMessage('La contraseña es obligatoria')
];

//                               MIDDLEWARE PARA MANEJO DE ERRORES 

// Middleware para manejar errores generados por express-validator
export const manejarErroresValidacion = (req: Request, res: Response, next: NextFunction) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    res.status(400).json({
      exito: false,
      mensaje: 'Datos de entrada inválidos',
      errores: errores.array()
    });
    return;
  }
  next(); // Si no hay errores, continúa con la siguiente función
};
