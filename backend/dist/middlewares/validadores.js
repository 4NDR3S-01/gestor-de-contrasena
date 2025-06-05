"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.manejarErroresValidacion = exports.validarValidarContrasena = exports.validarGenerarMultiplesContrasenas = exports.validarGenerarContrasena = exports.validarBusquedaContrasenas = exports.validarIdContrasena = exports.validarActualizarContrasena = exports.validarCrearContrasena = exports.validarCambiarContrasenaMaestra = exports.validarRestablecerContrasena = exports.validarRecuperacionContrasena = exports.validarContrasenaMaestra = exports.validarLogin = exports.validarRegistro = void 0;
const express_validator_1 = require("express-validator");
//                      VALIDADORES PARA AUTENTICACIÓN 
// Validación al momento del registro de usuario
exports.validarRegistro = [
    // Nombre: letras y espacios, entre 2 y 50 caracteres
    (0, express_validator_1.body)('nombre')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('El nombre debe tener entre 2 y 50 caracteres')
        .matches(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/)
        .withMessage('El nombre solo puede contener letras y espacios'),
    // Email válido, máximo 100 caracteres
    (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('Debe proporcionar un email válido')
        .normalizeEmail()
        .isLength({ max: 100 })
        .withMessage('El email no puede tener más de 100 caracteres'),
    // Contraseña: segura (mayúscula, minúscula, número), entre 8 y 128
    (0, express_validator_1.body)('contrasena')
        .isLength({ min: 8, max: 128 })
        .withMessage('La contraseña debe tener entre 8 y 128 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('La contraseña debe contener al menos una minúscula, una mayúscula y un número'),
    // Contraseña maestra: misma lógica de validación que la anterior
    (0, express_validator_1.body)('contrasenaMaestra')
        .isLength({ min: 8, max: 128 })
        .withMessage('La contraseña maestra debe tener entre 8 y 128 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('La contraseña maestra debe contener al menos una minúscula, una mayúscula y un número')
];
// Validación para login (inicio de sesión)
exports.validarLogin = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('Debe proporcionar un email válido')
        .normalizeEmail(),
    (0, express_validator_1.body)('contrasena')
        .notEmpty()
        .withMessage('La contraseña es obligatoria')
        .isLength({ min: 1, max: 128 })
        .withMessage('La contraseña no puede estar vacía')
];
// Validación para uso de la contraseña maestra
exports.validarContrasenaMaestra = [
    (0, express_validator_1.body)('contrasenaMaestra')
        .notEmpty()
        .withMessage('La contraseña maestra es obligatoria')
        .isLength({ min: 1, max: 128 })
        .withMessage('La contraseña maestra no puede estar vacía')
];
// Validación para recuperar contraseña (por email)
exports.validarRecuperacionContrasena = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('Debe proporcionar un email válido')
        .normalizeEmail()
];
// Validación para restablecer contraseña con token
exports.validarRestablecerContrasena = [
    (0, express_validator_1.body)('token')
        .notEmpty()
        .withMessage('El token de recuperación es obligatorio')
        .isLength({ min: 32, max: 256 })
        .withMessage('Token de recuperación inválido'),
    (0, express_validator_1.body)('nuevaContrasena')
        .isLength({ min: 8, max: 128 })
        .withMessage('La nueva contraseña debe tener entre 8 y 128 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('La nueva contraseña debe contener al menos una minúscula, una mayúscula y un número')
];
// Validación para cambiar la contraseña maestra
exports.validarCambiarContrasenaMaestra = [
    (0, express_validator_1.body)('contrasenaActual')
        .notEmpty()
        .withMessage('La contraseña actual es obligatoria')
        .isLength({ min: 1, max: 128 })
        .withMessage('La contraseña actual no puede estar vacía'),
    (0, express_validator_1.body)('nuevaContrasena')
        .isLength({ min: 8, max: 128 })
        .withMessage('La nueva contraseña maestra debe tener entre 8 y 128 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('La nueva contraseña maestra debe contener al menos una minúscula, una mayúscula y un número')
];
//                                 VALIDADORES PARA CONTRASEÑAS GUARDADAS 
// Validar creación de nueva contraseña guardada
exports.validarCrearContrasena = [
    (0, express_validator_1.body)('titulo')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('El título debe tener entre 1 y 100 caracteres')
        .notEmpty()
        .withMessage('El título es obligatorio'),
    (0, express_validator_1.body)('url')
        .optional()
        .trim()
        .isURL({ require_protocol: false })
        .withMessage('La URL no es válida')
        .isLength({ max: 500 })
        .withMessage('La URL no puede tener más de 500 caracteres'),
    (0, express_validator_1.body)('usuario')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('El usuario debe tener entre 1 y 100 caracteres'),
    (0, express_validator_1.body)('email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('El email no es válido')
        .normalizeEmail(),
    (0, express_validator_1.body)('contrasena')
        .isLength({ min: 1, max: 256 })
        .withMessage('La contraseña debe tener entre 1 y 256 caracteres')
        .notEmpty()
        .withMessage('La contraseña es obligatoria'),
    (0, express_validator_1.body)('notas')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Las notas no pueden tener más de 500 caracteres'),
    (0, express_validator_1.body)('categoria')
        .optional()
        .isIn(['trabajo', 'personal', 'redes_sociales', 'bancos', 'compras', 'entretenimiento', 'otros'])
        .withMessage('Categoría no válida'),
    (0, express_validator_1.body)('esFavorito')
        .optional()
        .isBoolean()
        .withMessage('esFavorito debe ser un valor booleano')
];
// Validar actualización de contraseña guardada
exports.validarActualizarContrasena = [
    (0, express_validator_1.param)('id')
        .isMongoId()
        .withMessage('ID de contraseña inválido'),
    (0, express_validator_1.body)('titulo')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('El título debe tener entre 1 y 100 caracteres'),
    (0, express_validator_1.body)('url')
        .optional()
        .trim()
        .custom((value) => {
        if (value === '')
            return true;
        return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(value);
    })
        .withMessage('La URL no es válida')
        .isLength({ max: 500 })
        .withMessage('La URL no puede tener más de 500 caracteres'),
    (0, express_validator_1.body)('usuario')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('El usuario debe tener entre 1 y 100 caracteres'),
    (0, express_validator_1.body)('email')
        .optional()
        .trim()
        .custom((value) => {
        if (value === '')
            return true;
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value);
    })
        .withMessage('El email no es válido'),
    (0, express_validator_1.body)('contrasena')
        .optional()
        .isLength({ min: 1, max: 256 })
        .withMessage('La contraseña debe tener entre 1 y 256 caracteres'),
    (0, express_validator_1.body)('notas')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Las notas no pueden tener más de 500 caracteres'),
    (0, express_validator_1.body)('categoria')
        .optional()
        .isIn(['trabajo', 'personal', 'redes_sociales', 'bancos', 'compras', 'entretenimiento', 'otros'])
        .withMessage('Categoría no válida'),
    (0, express_validator_1.body)('esFavorito')
        .optional()
        .isBoolean()
        .withMessage('esFavorito debe ser un valor booleano')
];
// Validación para obtener una contraseña por su ID
exports.validarIdContrasena = [
    (0, express_validator_1.param)('id')
        .isMongoId()
        .withMessage('ID de contraseña inválido')
];
// Validación para búsquedas con filtros (categoría, búsqueda por texto, favoritos, paginación)
exports.validarBusquedaContrasenas = [
    (0, express_validator_1.query)('categoria')
        .optional()
        .isIn(['trabajo', 'personal', 'redes_sociales', 'bancos', 'compras', 'entretenimiento', 'otros', 'todas'])
        .withMessage('Categoría no válida'),
    (0, express_validator_1.query)('busqueda')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('El término de búsqueda no puede tener más de 100 caracteres'),
    (0, express_validator_1.query)('favoritos')
        .optional()
        .isIn(['true', 'false'])
        .withMessage('El parámetro favoritos debe ser true o false'),
    (0, express_validator_1.query)('limite')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('El límite debe ser un número entre 1 y 100'),
    (0, express_validator_1.query)('pagina')
        .optional()
        .isInt({ min: 1 })
        .withMessage('La página debe ser un número mayor a 0')
];
//                               VALIDADORES PARA UTILIDADES 
// Validación para generación de contraseñas seguras
exports.validarGenerarContrasena = [
    (0, express_validator_1.body)('longitud')
        .optional()
        .isInt({ min: 4, max: 128 })
        .withMessage('La longitud debe estar entre 4 y 128 caracteres'),
    (0, express_validator_1.body)('incluirMayusculas')
        .optional()
        .isBoolean()
        .withMessage('incluirMayusculas debe ser un valor booleano'),
    (0, express_validator_1.body)('incluirMinusculas')
        .optional()
        .isBoolean()
        .withMessage('incluirMinusculas debe ser un valor booleano'),
    (0, express_validator_1.body)('incluirNumeros')
        .optional()
        .isBoolean()
        .withMessage('incluirNumeros debe ser un valor booleano'),
    (0, express_validator_1.body)('incluirSimbolos')
        .optional()
        .isBoolean()
        .withMessage('incluirSimbolos debe ser un valor booleano'),
    (0, express_validator_1.body)('excluirCaracteresAmbiguos')
        .optional()
        .isBoolean()
        .withMessage('excluirCaracteresAmbiguos debe ser un valor booleano')
];
// Generación de múltiples contraseñas reutilizando validaciones anteriores
exports.validarGenerarMultiplesContrasenas = [
    (0, express_validator_1.body)('cantidad')
        .optional()
        .isInt({ min: 1, max: 20 })
        .withMessage('La cantidad debe estar entre 1 y 20'),
    ...exports.validarGenerarContrasena
];
// Validación de fortaleza de contraseña ingresada por el usuario
exports.validarValidarContrasena = [
    (0, express_validator_1.body)('contrasena')
        .isLength({ min: 1, max: 256 })
        .withMessage('La contraseña debe tener entre 1 y 256 caracteres')
        .notEmpty()
        .withMessage('La contraseña es obligatoria')
];
//                               MIDDLEWARE PARA MANEJO DE ERRORES 
// Middleware para manejar errores generados por express-validator
const manejarErroresValidacion = (req, res, next) => {
    const errores = (0, express_validator_1.validationResult)(req);
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
exports.manejarErroresValidacion = manejarErroresValidacion;
