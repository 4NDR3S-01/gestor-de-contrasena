"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validarFortalezaContrasena = exports.generarContrasenaSagura = exports.desencriptarContrasena = exports.encriptarContrasena = exports.generarTokenRecuperacion = exports.generarTokenJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const crypto_js_1 = __importDefault(require("crypto-js"));
// Generar token JWT
const generarTokenJWT = (payload) => {
    const secreto = process.env.JWT_SECRET;
    if (!secreto) {
        throw new Error('JWT_SECRET no está configurado en las variables de entorno');
    }
    return jsonwebtoken_1.default.sign(payload, secreto, { expiresIn: '30m' });
};
exports.generarTokenJWT = generarTokenJWT;
// Generar token para recuperación de contraseña
const generarTokenRecuperacion = () => {
    return crypto_1.default.randomBytes(32).toString('hex');
};
exports.generarTokenRecuperacion = generarTokenRecuperacion;
// Encriptar contraseña (para guardar en la base de datos)
const encriptarContrasena = (contrasena) => {
    const claveEncriptacion = process.env.CLAVE_ENCRIPTACION;
    if (!claveEncriptacion) {
        throw new Error('CLAVE_ENCRIPTACION no está configurada');
    }
    return crypto_js_1.default.AES.encrypt(contrasena, claveEncriptacion).toString();
};
exports.encriptarContrasena = encriptarContrasena;
// Desencriptar contraseña
const desencriptarContrasena = (contrasenaEncriptada) => {
    const claveEncriptacion = process.env.CLAVE_ENCRIPTACION;
    if (!claveEncriptacion) {
        throw new Error('CLAVE_ENCRIPTACION no está configurada');
    }
    const bytes = crypto_js_1.default.AES.decrypt(contrasenaEncriptada, claveEncriptacion);
    return bytes.toString(crypto_js_1.default.enc.Utf8);
};
exports.desencriptarContrasena = desencriptarContrasena;
const generarContrasenaSagura = (opciones) => {
    let caracteres = '';
    if (opciones.incluirMinusculas) {
        caracteres += opciones.excluirCaracteresAmbiguos ? 'abcdefghjkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
    }
    if (opciones.incluirMayusculas) {
        caracteres += opciones.excluirCaracteresAmbiguos ? 'ABCDEFGHJKMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    }
    if (opciones.incluirNumeros) {
        caracteres += opciones.excluirCaracteresAmbiguos ? '23456789' : '0123456789';
    }
    if (opciones.incluirSimbolos) {
        caracteres += opciones.excluirCaracteresAmbiguos ? '!@#$%^&*()_+-=[]{}|;:,.<>?' : '!@#$%^&*()_+-=[]{}|;:,.<>?';
    }
    if (caracteres === '') {
        throw new Error('Debe seleccionar al menos un tipo de caracter');
    }
    let contrasena = '';
    // Asegurar que la contraseña tenga al menos un caracter de cada tipo seleccionado
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
    // Llenar el resto de la longitud requerida
    for (let i = contrasena.length; i < opciones.longitud; i++) {
        contrasena += caracteres[Math.floor(Math.random() * caracteres.length)];
    }
    // Mezclar la contraseña para evitar patrones predecibles
    return contrasena.split('').sort(() => 0.5 - Math.random()).join('');
};
exports.generarContrasenaSagura = generarContrasenaSagura;
const validarFortalezaContrasena = (contrasena) => {
    const resultado = {
        esSegura: false,
        puntuacion: 0,
        sugerencias: []
    };
    let puntuacion = 0;
    // Longitud
    if (contrasena.length >= 12) {
        puntuacion += 25;
    }
    else if (contrasena.length >= 8) {
        puntuacion += 15;
    }
    else {
        resultado.sugerencias.push('Usa al menos 8 caracteres (recomendado: 12 o más)');
    }
    // Mayúsculas
    if (/[A-Z]/.test(contrasena)) {
        puntuacion += 15;
    }
    else {
        resultado.sugerencias.push('Incluye al menos una letra mayúscula');
    }
    // Minúsculas
    if (/[a-z]/.test(contrasena)) {
        puntuacion += 15;
    }
    else {
        resultado.sugerencias.push('Incluye al menos una letra minúscula');
    }
    // Números
    if (/[0-9]/.test(contrasena)) {
        puntuacion += 15;
    }
    else {
        resultado.sugerencias.push('Incluye al menos un número');
    }
    // Símbolos
    if (/[^A-Za-z0-9]/.test(contrasena)) {
        puntuacion += 20;
    }
    else {
        resultado.sugerencias.push('Incluye al menos un símbolo especial');
    }
    // Variedad de caracteres
    const caracteresUnicos = new Set(contrasena).size;
    if (caracteresUnicos >= contrasena.length * 0.7) {
        puntuacion += 10;
    }
    resultado.puntuacion = Math.min(100, puntuacion);
    resultado.esSegura = resultado.puntuacion >= 70;
    if (resultado.sugerencias.length === 0) {
        resultado.sugerencias.push('¡Excelente! Tu contraseña es segura');
    }
    return resultado;
};
exports.validarFortalezaContrasena = validarFortalezaContrasena;
