import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import CryptoJS from 'crypto-js';

// Generar token JWT
export const generarTokenJWT = (payload: { id: string; email: string }): string => {
  const secreto = process.env.JWT_SECRET as string;
  
  if (!secreto) {
    throw new Error('JWT_SECRET no está configurado en las variables de entorno');
  }

  return jwt.sign(payload, secreto, { expiresIn: '30m' });
};

// Generar token para recuperación de contraseña
export const generarTokenRecuperacion = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Encriptar contraseña (para guardar en la base de datos)
export const encriptarContrasena = (contrasena: string): string => {
  const claveEncriptacion = process.env.CLAVE_ENCRIPTACION;
  
  if (!claveEncriptacion) {
    throw new Error('CLAVE_ENCRIPTACION no está configurada');
  }

  return CryptoJS.AES.encrypt(contrasena, claveEncriptacion).toString();
};

// Desencriptar contraseña
export const desencriptarContrasena = (contrasenaEncriptada: string): string => {
  const claveEncriptacion = process.env.CLAVE_ENCRIPTACION;
  
  if (!claveEncriptacion) {
    throw new Error('CLAVE_ENCRIPTACION no está configurada');
  }

  const bytes = CryptoJS.AES.decrypt(contrasenaEncriptada, claveEncriptacion);
  return bytes.toString(CryptoJS.enc.Utf8);
};

// Generar contraseña segura
export interface OpcionesGeneradorContrasena {
  longitud: number;
  incluirMayusculas: boolean;
  incluirMinusculas: boolean;
  incluirNumeros: boolean;
  incluirSimbolos: boolean;
  excluirCaracteresAmbiguos: boolean;
}

export const generarContrasenaSagura = (opciones: OpcionesGeneradorContrasena): string => {
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

// Validar fortaleza de contraseña
export interface ResultadoValidacionContrasena {
  esSegura: boolean;
  puntuacion: number; // 0-100
  sugerencias: string[];
}

export const validarFortalezaContrasena = (contrasena: string): ResultadoValidacionContrasena => {
  const resultado: ResultadoValidacionContrasena = {
    esSegura: false,
    puntuacion: 0,
    sugerencias: []
  };

  let puntuacion = 0;

  // Longitud
  if (contrasena.length >= 12) {
    puntuacion += 25;
  } else if (contrasena.length >= 8) {
    puntuacion += 15;
  } else {
    resultado.sugerencias.push('Usa al menos 8 caracteres (recomendado: 12 o más)');
  }

  // Mayúsculas
  if (/[A-Z]/.test(contrasena)) {
    puntuacion += 15;
  } else {
    resultado.sugerencias.push('Incluye al menos una letra mayúscula');
  }

  // Minúsculas
  if (/[a-z]/.test(contrasena)) {
    puntuacion += 15;
  } else {
    resultado.sugerencias.push('Incluye al menos una letra minúscula');
  }

  // Números
  if (/[0-9]/.test(contrasena)) {
    puntuacion += 15;
  } else {
    resultado.sugerencias.push('Incluye al menos un número');
  }

  // Símbolos
  if (/[^A-Za-z0-9]/.test(contrasena)) {
    puntuacion += 20;
  } else {
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
