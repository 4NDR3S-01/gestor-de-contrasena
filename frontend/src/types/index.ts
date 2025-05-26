// Tipos para la autenticación
export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  fechaCreacion: string;
  fechaUltimoAcceso?: string;
}

export interface DatosLogin {
  email: string;
  contrasena: string;
}

export interface DatosRegistro {
  nombre: string;
  email: string;
  contrasena: string;
  contrasenaMaestra: string;
}

export interface RespuestaAuth {
  exito: boolean;
  mensaje: string;
  datos?: {
    token: string;
    usuario: Usuario;
  };
}

// Tipos para contraseñas
export interface Contrasena {
  _id: string;
  titulo: string;
  url?: string;
  usuario?: string;
  email?: string;
  contrasenaEncriptada: string;
  contrasenaDesencriptada?: string; // Solo presente cuando se obtiene una contraseña específica
  notas?: string;
  categoria: string;
  esFavorito: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  fechaUltimoUso?: string;
}

export interface DatosContrasena {
  sitio: string;
  usuario: string;
  contrasena: string;
  notas?: string;
  categoria: string;
  esFavorito?: boolean;
}

// Para compatibilidad con el formulario
export interface CrearContrasenaData {
  sitio: string;
  usuario?: string;
  email?: string;
  url?: string;
  contrasena: string;
  notas?: string;
  categoria: string;
  esFavorito?: boolean;
}

export interface RespuestaContrasenas {
  exito: boolean;
  mensaje: string;
  datos?: {
    contrasenas: Contrasena[];
    total: number;
    pagina: number;
    totalPaginas: number;
  };
}

// Tipos para categorías
export type Categoria = 
  | 'social'
  | 'trabajo'
  | 'email'
  | 'banco'
  | 'tienda'
  | 'entretenimiento'
  | 'educacion'
  | 'salud'
  | 'utilidades'
  | 'otros';

// Tipos para el generador de contraseñas
export interface OpcionesGenerador {
  longitud: number;
  incluirMayusculas: boolean;
  incluirMinusculas: boolean;
  incluirNumeros: boolean;
  incluirSimbolos: boolean;
  excluirCaracteresAmbiguos: boolean;
}

export interface ContrasenaGenerada {
  contrasena: string;
  fortaleza: 'debil' | 'media' | 'fuerte' | 'muy-fuerte';
  puntuacion: number;
}

// Tipos para el contexto de autenticación
export interface ContextoAuth {
  usuario: Usuario | null;
  token: string | null;
  estaLogueado: boolean;
  estaVerificandoContrasenaMaestra: boolean;
  contrasenaMaestraVerificada: boolean;
  login: (datos: DatosLogin) => Promise<void>;
  registro: (datos: DatosRegistro) => Promise<void>;
  logout: () => void;
  verificarContrasenaMaestra: (contrasenaMaestra: string) => Promise<boolean>;
  limpiarVerificacionContrasenaMaestra: () => void;
}

// Tipos para temas
export type Tema = 'claro' | 'oscuro';

export interface ContextoTema {
  tema: Tema;
  alternarTema: () => void;
}

// Tipos para errores de la API
export interface ErrorAPI {
  mensaje: string;
  errores?: Array<{
    campo: string;
    mensaje: string;
  }>;
}

// Tipos para respuestas genéricas de la API
export interface RespuestaAPI<T = unknown> {
  exito: boolean;
  mensaje: string;
  datos?: T;
  errores?: Array<{
    campo: string;
    mensaje: string;
  }>;
}

// Tipos para notificaciones
export interface NotificacionDB {
  _id: string;
  usuarioId: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  datos?: Record<string, unknown>;
  leida: boolean;
  fechaCreacion: string;
  fechaLectura?: string;
}

export interface RespuestaNotificaciones {
  exito: boolean;
  mensaje: string;
  datos?: {
    notificaciones: NotificacionDB[];
    total: number;
    pagina: number;
    totalPaginas: number;
    noLeidas: number;
  };
}

export interface NotificacionLocal {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  datos?: Record<string, unknown>;
  leida: boolean;
  fecha: Date;
}

// Tipos para el contexto de notificaciones actualizado
export interface ContextoNotificaciones {
  notificaciones: NotificacionLocal[];
  notificacionesNoLeidas: number;
  cargando: boolean;
  agregarNotificacion: (notificacion: Omit<NotificacionLocal, 'id' | 'fecha'>) => void;
  marcarComoLeida: (id: string) => Promise<void>;
  marcarTodasComoLeidas: () => Promise<void>;
  eliminarNotificacion: (id: string) => Promise<void>;
  cargarNotificaciones: (pagina?: number, limite?: number) => Promise<void>;
  formatTime: (fecha: Date | string) => string;
}
