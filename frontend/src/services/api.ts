import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import { syncEvents, SYNC_EVENTS } from '../utils/syncEvents';
import type { 
  DatosLogin, 
  DatosRegistro, 
  RespuestaAuth, 
  RespuestaContrasenas,
  Contrasena,
  RespuestaAPI,
  ContrasenaGenerada,
  OpcionesGenerador,
  CrearContrasenaData,
  Usuario
} from '../types/index';

class ServicioAPI {
  private readonly api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para agregar el token en cada petición
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Interceptor para manejar errores de respuesta
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error.response?.status;
        const url = error.config?.url || '';
        // Solo forzar logout/redirección si NO es login ni registro
        if (
          status === 401 &&
          !url.includes('/auth/login') &&
          !url.includes('/auth/registrar')
        ) {
          localStorage.removeItem('token');
          localStorage.removeItem('usuario');
          window.location.href = '/login';
        }
        return Promise.reject(error instanceof Error ? error : new Error(String(error)));
      }
    );
  }

  // === AUTENTICACIÓN ===
  async login(datos: DatosLogin): Promise<RespuestaAuth> {
    const response: AxiosResponse<RespuestaAuth> = await this.api.post('/auth/login', datos);
    return response.data;
  }

  async registro(datos: DatosRegistro): Promise<RespuestaAuth> {
    const response: AxiosResponse<RespuestaAuth> = await this.api.post('/auth/registrar', datos);
    return response.data;
  }

  async verificarContrasenaMaestra(contrasenaMaestra: string): Promise<RespuestaAPI<{ esValida: boolean }>> {
    const response: AxiosResponse<RespuestaAPI<{ esValida: boolean }>> = await this.api.post('/auth/verificar-contrasena-maestra', {
      contrasenaMaestra
    });
    return response.data;
  }

  async obtenerPerfil(): Promise<RespuestaAPI> {
    const response: AxiosResponse<RespuestaAPI> = await this.api.get('/auth/perfil');
    return response.data;
  }

  async actualizarPerfil(datos: { nombre: string; email: string }): Promise<RespuestaAPI<{ usuario: Usuario }>> {
    const response: AxiosResponse<RespuestaAPI<{ usuario: Usuario }>> = await this.api.put('/auth/perfil', datos);
    return response.data;
  }

  async cambiarContrasenaMaestra(datos: { contrasenaActual: string; nuevaContrasena: string }): Promise<RespuestaAPI> {
    const response: AxiosResponse<RespuestaAPI> = await this.api.put('/auth/cambiar-contrasena-maestra', datos);
    return response.data;
  }

  async solicitarRecuperacion(email: string): Promise<RespuestaAPI> {
    const response: AxiosResponse<RespuestaAPI> = await this.api.post('/auth/recuperar-contrasena', {
      email
    });
    return response.data;
  }

  async restablecerContrasena(token: string, nuevaContrasena: string): Promise<RespuestaAPI> {
    const response: AxiosResponse<RespuestaAPI> = await this.api.post('/auth/restablecer-contrasena', {
      token,
      nuevaContrasena
    });
    return response.data;
  }

  // === CONTRASEÑAS ===
  async obtenerContrasenas(pagina = 1, limite = 50, busqueda = '', categoria = ''): Promise<Contrasena[]> {
    const params = new URLSearchParams({
      pagina: pagina.toString(),
      limite: limite.toString(),
      ...(busqueda && { busqueda }),
      ...(categoria && { categoria })
    });

    const response: AxiosResponse<RespuestaAPI<{ contrasenas: Contrasena[] }>> = await this.api.get(`/contrasenas?${params}`);
    // Emitir evento de sincronización al obtener datos
    syncEvents.emit(SYNC_EVENTS.DATA_FETCHED);
    // El backend responde con datos: { contrasenas: [...] }
    return response.data.datos?.contrasenas ?? [];
  }

  async obtenerContrasenaPorId(id: string): Promise<RespuestaAPI<{ contrasena: Contrasena }>> {
    const response: AxiosResponse<RespuestaAPI<{ contrasena: Contrasena }>> = await this.api.get(`/contrasenas/${id}`);
    // Emitir evento de sincronización al obtener datos
    syncEvents.emit(SYNC_EVENTS.DATA_FETCHED);
    return response.data;
  }

  async crearContrasena(datos: CrearContrasenaData): Promise<RespuestaAPI<{ contrasena: Contrasena }>> {
    const response: AxiosResponse<RespuestaAPI<{ contrasena: Contrasena }>> = await this.api.post('/contrasenas', datos);
    // Emitir evento de sincronización al crear contraseña con datos específicos
    syncEvents.emit(SYNC_EVENTS.PASSWORD_CREATED, { sitio: datos.sitio });
    return response.data;
  }

  async actualizarContrasena(id: string, datos: Partial<CrearContrasenaData>): Promise<RespuestaAPI<{ contrasena: Contrasena }>> {
    const response: AxiosResponse<RespuestaAPI<{ contrasena: Contrasena }>> = await this.api.put(`/contrasenas/${id}`, datos);
    // Emitir evento de sincronización al actualizar contraseña con datos específicos
    syncEvents.emit(SYNC_EVENTS.PASSWORD_UPDATED, { sitio: datos.sitio });
    return response.data;
  }

  async eliminarContrasena(id: string): Promise<RespuestaAPI> {
    const response: AxiosResponse<RespuestaAPI> = await this.api.delete(`/contrasenas/${id}`);
    // Emitir evento de sincronización al eliminar contraseña
    syncEvents.emit(SYNC_EVENTS.PASSWORD_DELETED);
    return response.data;
  }

  async obtenerFavoritos(): Promise<RespuestaContrasenas> {
    const response: AxiosResponse<RespuestaContrasenas> = await this.api.get('/contrasenas/favoritos');
    // Emitir evento de sincronización al obtener datos
    syncEvents.emit(SYNC_EVENTS.DATA_FETCHED);
    return response.data;
  }

  async alternarFavorito(id: string): Promise<RespuestaAPI<{ contrasena: Contrasena }>> {
    const response: AxiosResponse<RespuestaAPI<{ contrasena: Contrasena }>> = await this.api.patch(`/contrasenas/${id}/favorito`);
    // Emitir evento de favorito cambiado
    const contrasena = response.data.datos?.contrasena;
    if (contrasena?.esFavorito) {
      syncEvents.emit(SYNC_EVENTS.PASSWORD_FAVORITED, { sitio: contrasena.titulo });
    } else {
      syncEvents.emit(SYNC_EVENTS.PASSWORD_UPDATED, { sitio: contrasena?.titulo });
    }
    return response.data;
  }

  async obtenerCategoriasConConteo(): Promise<RespuestaAPI<Record<string, number>>> {
    const response: AxiosResponse<RespuestaAPI<Record<string, number>>> = await this.api.get('/contrasenas/categorias');
    // Emitir evento de sincronización al obtener datos
    syncEvents.emit(SYNC_EVENTS.DATA_FETCHED);
    return response.data;
  }

  async registrarUsoContrasena(id: string): Promise<RespuestaAPI> {
    const response: AxiosResponse<RespuestaAPI> = await this.api.patch(`/contrasenas/${id}/uso`);
    return response.data;
  }

  async obtenerEstadisticas(): Promise<RespuestaAPI> {
    const response: AxiosResponse<RespuestaAPI> = await this.api.get('/contrasenas/estadisticas');
    return response.data;
  }

  // === UTILIDADES ===
  async generarContrasena(opciones: OpcionesGenerador): Promise<RespuestaAPI<ContrasenaGenerada>> {
    const response: AxiosResponse<RespuestaAPI<ContrasenaGenerada>> = await this.api.post('/utilidades/generar-contrasena', opciones);
    return response.data;
  }

  async verificarFortalezaContrasena(contrasena: string): Promise<RespuestaAPI<{ fortaleza: string; puntuacion: number; sugerencias: string[] }>> {
    const response: AxiosResponse<RespuestaAPI<{ fortaleza: string; puntuacion: number; sugerencias: string[] }>> = await this.api.post('/utilidades/verificar-fortaleza', {
      contrasena
    });
    return response.data;
  }

  // Métodos de notificaciones
  async obtenerNotificaciones(pagina = 1, limite = 20, soloNoLeidas = false): Promise<RespuestaAPI<{ notificaciones: Array<{
    _id: string;
    tipo: string;
    titulo: string;
    mensaje: string;
    datos?: unknown;
    leida: boolean;
    fechaCreacion: string;
    fechaLectura?: string;
  }>; noLeidas: number }>> {
    const response = await this.api.get('/notificaciones', { params: { pagina, limite, soloNoLeidas } });
    return response.data;
  }

  async marcarNotificacionComoLeida(id: string): Promise<RespuestaAPI<unknown>> {
    const response = await this.api.put(`/notificaciones/${id}/leer`);
    return response.data;
  }

  async marcarTodasNotificacionesComoLeidas(): Promise<RespuestaAPI<unknown>> {
    const response = await this.api.put('/notificaciones/leer-todas');
    return response.data;
  }

  async eliminarNotificacion(id: string): Promise<RespuestaAPI<unknown>> {
    const response = await this.api.delete(`/notificaciones/${id}`);
    return response.data;
  }
}

// Exportar una instancia única del servicio
export const apiService = new ServicioAPI();
export default apiService;
