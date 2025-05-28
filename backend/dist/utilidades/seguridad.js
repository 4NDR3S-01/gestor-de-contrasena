"use strict";
// Función para manejar importaciones por defecto de módulos ES
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validarFortalezaContrasena = exports.generarContrasenaSagura = exports.desencriptarContrasena = exports.encriptarContrasena = exports.generarTokenRecuperacion = exports.generarTokenJWT = void 0;

const jsonwebtoken_1 = __importDefault(require("jsonwebtoken")); // Librería para manejar JWT
const crypto_1 = __importDefault(require("crypto")); // Módulo nativo de Node.js para criptografía
const crypto_js_1 = __importDefault(require("crypto-js")); // Librería para encriptar/desencriptar

// Generar token JWT con un payload y tiempo de expiración de 30 minutos
const generarTokenJWT = (payload) => {
    const secreto = process.env.JWT_SECRET; // Secreto para firmar el token (debe estar en variables de entorno)
    if (!secreto) {
        throw new Error('JWT_SECRET no está configurado en las variables de entorno');
    }
    return jsonwebtoken_1.default.sign(payload, secreto, { expiresIn: '30m' });
};
exports.generarTokenJWT = generarTokenJWT;

// Generar token aleatorio para recuperación de contraseña
const generarTokenRecuperacion = () => {
    return crypto_1.default.randomBytes(32).toString('hex'); // 32 bytes en formato hexadecimal
};
exports.generarTokenRecuperacion = generarTokenRecuperacion;

// Encriptar una contraseña para almacenarla (usa AES)
const encriptarContrasena = (contrasena) => {
    const claveEncriptacion = process.env.CLAVE_ENCRIPTACION; // Clave para la encriptación (debe estar en variables de entorno)
    if (!claveEncriptacion) {
        throw new Error('CLAVE_ENCRIPTACION no está configurada');
    }
    // Retorna la contraseña cifrada en formato string
    return crypto_js_1.default.AES.encrypt(contrasena, claveEncriptacion).toString();
};
exports.encriptarContrasena = encriptarContrasena;

// Desencriptar la contraseña cifrada para obtener la original
const desencriptarContrasena = (contrasenaEncriptada) => {
    const claveEncriptacion = process.env.CLAVE_ENCRIPTACION;
    if (!claveEncriptacion) {
        throw new Error('CLAVE_ENCRIPTACION no está configurada');
    }
    const bytes = crypto_js_1.default.AES.decrypt(contrasenaEncriptada, claveEncriptacion);
    return bytes.toString(crypto_js_1.default.enc.Utf8); // Devuelve la contraseña desencriptada en texto plano
};
exports.desencriptarContrasena = desencriptarContrasena;

// Generar una contraseña segura con opciones configurables
const generarContrasenaSagura = (opciones) => {
    let caracteres = '';
    // Añade caracteres en minúscula si está seleccionado
    if (opciones.incluirMinusculas) {
        caracteres += opciones.excluirCaracteresAmbiguos ? 'abcdefghjkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
    }
    // Añade caracteres en mayúscula si está seleccionado
    if (opciones.incluirMayusculas) {
        caracteres += opciones.excluirCaracteresAmbiguos ? 'ABCDEFGHJKMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    }
    // Añade números si está seleccionado
    if (opciones.incluirNumeros) {
        caracteres += opciones.excluirCaracteresAmbiguos ? '23456789' : '0123456789';
    }
    // Añade símbolos si está seleccionado
    if (opciones.incluirSimbolos) {
        caracteres += opciones.excluirCaracteresAmbiguos ? '!@#$%^&*()_+-=[]{}|;:,.<>?' : '!@#$%^&*()_+-=[]{}|;:,.<>?';
    }
    // Verifica que al menos un tipo de caracter esté seleccionado
    if (caracteres === '') {
        throw new Error('Debe seleccionar al menos un tipo de caracter');
    }
    let contrasena = '';
    // Asegura que la contraseña tenga al menos un caracter de cada tipo seleccionado
    if (opciones.incluirMinusculas) {
        const minusculas = opciones.excluirCaracteresAmbiguos ? 'abcdefghjkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
        contrasena += minusculas[Math.floor(Math.random() * minusculas.length)];
    }
    if (opciones.incluirMayusculas) {
        const mayusculas = opciones.excluirCaracteresAmbiguos ? 'ABCDEFGHJKMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        contrasena += mayusculas[Math.floor(Math.random() * mayusculas.length)];
    }
    if (opciones.incluirNumeros) {
        const numeros = opciones.excluirCaracteresAmbiguos ? '23456789' : '0123456789';
        contrasena += numeros[Math.floor(Math.random() * numeros.length)];
    }
    if (opciones.incluirSimbolos) {
        const simbolos = opciones.excluirCaracteresAmbiguos ? '!@#$%^&*()_+-=[]{}|;:,.<>?' : '!@#$%^&*()_+-=[]{}|;:,.<>?';
        contrasena += simbolos[Math.floor(Math.random() * simbolos.length)];
    }
    // Completa la contraseña hasta la longitud deseada con caracteres aleatorios permitidos
    for (let i = contrasena.length; i < opciones.longitud; i++) {
        contrasena += caracteres[Math.floor(Math.random() * caracteres.length)];
    }
    // Mezcla la contraseña para evitar patrones predecibles
    return contrasena.split('').sort(() => 0.5 - Math.random()).join('');
};
exports.generarContrasenaSagura = generarContrasenaSagura;

// Validar la fortaleza de una contraseña dada y devolver sugerencias
const validarFortalezaContrasena = (contrasena) => {
    const resultado = {
        esSegura: false,
        puntuacion: 0,
        sugerencias: []
    };
    let puntuacion = 0;
    // Puntuación basada en longitud de la contraseña
    if (contrasena.length >= 12) {
        puntuacion += 25;
    }
    else if (contrasena.length >= 8) {
        puntuacion += 15;
    }
    else {
        resultado.sugerencias.push('Usa al menos 8 caracteres (recomendado: 12 o más)');
    }
    // Puntuación si incluye mayúsculas
    if (/[A-Z]/.test(contrasena)) {
        puntuacion += 15;
    }
    else {
        resultado.sugerencias.push('Incluye al menos una letra mayúscula');
    }
    // Puntuación si incluye minúsculas
    if (/[a-z]/.test(contrasena)) {
        puntuacion += 15;
    }
    else {
        resultado.sugerencias.push('Incluye al menos una letra minúscula');
    }
    // Puntuación si incluye números
    if (/[0-9]/.test(contrasena)) {
        puntuacion += 15;
    }
    else {
        resultado.sugerencias.push('Incluye al menos un número');
    }
    // Puntuación si incluye símbolos especiales
    if (/[^A-Za-z0-9]/.test(contrasena)) {
        puntuacion += 20;
    }
    else {
        resultado.sugerencias.push('Incluye al menos un símbolo especial');
    }
    // Puntuación basada en la variedad de caracteres únicos
    const caracteresUnicos = new Set(contrasena).size;
    if (caracteresUnicos >= contrasena.length * 0.7) {
        puntuacion += 10;
    }
    resultado.puntuacion = Math.min(100, puntuacion);
    resultado.esSegura = resultado.puntuacion >= 70;
    // Si no hay sugerencias, la contraseña es muy segura
    if (resultado.sugerencias.length === 0) {
        resultado.sugerencias.push('¡Excelente! Tu contraseña es segura');
    }
    return resultado;
};
exports.validarFortalezaContrasena = validarFortalezaContrasena;
