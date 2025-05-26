import React, { useState, useEffect, useCallback } from 'react';
import ModalPortal from '../components/ModalPortal';
import { Star, Search, Eye, EyeOff, Copy, Edit, Trash2, Link2, User, Mail, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiService } from '../services/api';
import { syncEvents } from '../utils/syncEvents';
import type { Contrasena } from '../types';

const CATEGORIAS = [
  'Personal',
  'Trabajo',
  'Social',
  'Finanzas',
  'Compras',
  'Entretenimiento',
  'Educación',
  'Salud',
  'Otros'
];

const Favorites: React.FC = () => {
  const [favoritos, setFavoritos] = useState<Contrasena[]>([]);
  const [filteredFavorites, setFilteredFavorites] = useState<Contrasena[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [passwordsReales, setPasswordsReales] = useState<Record<string, string>>({});
  const [showMasterPasswordModal, setShowMasterPasswordModal] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const [pendingShowPasswordId, setPendingShowPasswordId] = useState<string | null>(null);
  const [verificando, setVerificando] = useState(false);
  const [errorVerificacion, setErrorVerificacion] = useState('');

  // Estados para edición
  const [showModal, setShowModal] = useState(false);
  const [editingPassword, setEditingPassword] = useState<Contrasena | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    sitio: '',
    usuario: '',
    email: '',
    url: '',
    contrasena: '',
    notas: '',
    categoria: 'personal',
    esFavorito: false
  });

  useEffect(() => {
    cargarFavoritos();
  }, []);

  const filtrarFavoritos = useCallback(() => {
    let filtered = favoritos;

    if (searchTerm) {
      filtered = filtered.filter(
        (password) =>
          password.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (password.usuario ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (password.email ?? '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'Todas') {
      filtered = filtered.filter(
        (password) =>
          password.categoria.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    setFilteredFavorites(filtered);
  }, [favoritos, searchTerm, selectedCategory]);

  useEffect(() => {
    filtrarFavoritos();
  }, [filtrarFavoritos]);

  const cargarFavoritos = async () => {
    try {
      setLoading(true);
      const response = await apiService.obtenerContrasenas();
      const contrasenasFavoritas = response.filter((password: Contrasena) => password.esFavorito);
      setFavoritos(contrasenasFavoritas);
      syncEvents.emit('DATA_FETCHED');
    } catch (error) {
      console.error('Error al cargar favoritos:', error);
      toast.error('Error al cargar las contraseñas favoritas');
      syncEvents.emit('SYNC_FAILED');
    } finally {
      setLoading(false);
    }
  };

  const alternarFavorito = async (id: string) => {
    try {
      await apiService.alternarFavorito(id);
      toast.success('Contraseña quitada de favoritos');
      cargarFavoritos();
    } catch (error) {
      console.error('Error al quitar de favoritos:', error);
      toast.error('Error al actualizar favoritos');
    }
  };

  const eliminarContrasena = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta contraseña?')) {
      try {
        await apiService.eliminarContrasena(id);
        toast.success('Contraseña eliminada exitosamente');
        cargarFavoritos();
      } catch (error) {
        console.error('Error al eliminar:', error);
        toast.error('Error al eliminar la contraseña');
      }
    }
  };

  const mostrarContrasena = (id: string) => {
    setPendingShowPasswordId(id);
    setShowMasterPasswordModal(true);
    setMasterPassword('');
    setErrorVerificacion('');
  };

  const verificarContrasenaMaestra = async () => {
    if (!masterPassword.trim()) {
      setErrorVerificacion('La contraseña maestra es requerida');
      return;
    }

    if (!pendingShowPasswordId) return;

    setVerificando(true);
    setErrorVerificacion('');

    try {
      const response = await apiService.verificarContrasenaMaestra(masterPassword);
      
      if (response.exito) {
        // Obtener la contraseña real desencriptada del backend
        const respPwd = await apiService.obtenerContrasenaPorId(pendingShowPasswordId);
        console.log('Respuesta obtenerContrasenaPorId:', respPwd);
        
        let realPwd = null;
        if (respPwd?.exito && respPwd?.datos?.contrasena) {
          // El backend devuelve 'contrasenaDesencriptada' en lugar de 'contrasenaEncriptada'
          realPwd = respPwd.datos.contrasena.contrasenaDesencriptada || respPwd.datos.contrasena.contrasenaEncriptada;
        }
        
        console.log('Contraseña obtenida:', realPwd);
        
        if (realPwd) {
          setPasswordsReales(prev => ({ ...prev, [pendingShowPasswordId]: realPwd }));
        } else {
          console.error('No se pudo obtener la contraseña:', respPwd);
          setPasswordsReales(prev => ({ ...prev, [pendingShowPasswordId]: '[Error al obtener la contraseña]' }));
        }
        
        setShowPasswords(prev => ({
          ...prev,
          [pendingShowPasswordId]: true
        }));

        // Cerrar modal
        setShowMasterPasswordModal(false);
        setMasterPassword('');
        setPendingShowPasswordId(null);

        // Ocultar después de 10 segundos
        setTimeout(() => {
          setShowPasswords(prev => ({
            ...prev,
            [pendingShowPasswordId!]: false
          }));
          setPasswordsReales(prev => {
            const newState = { ...prev };
            delete newState[pendingShowPasswordId!];
            return newState;
          });
        }, 10000);

        toast.success('Contraseña mostrada (se ocultará en 10 segundos)');
      } else {
        setErrorVerificacion('Contraseña maestra incorrecta');
      }
    } catch (error: unknown) {
      console.error('Error al verificar contraseña maestra:', error);
      setErrorVerificacion('Error al verificar la contraseña maestra');
    } finally {
      setVerificando(false);
    }
  };

  const copiarAlPortapapeles = async (texto: string, tipo: string, id: string) => {
    try {
      if (tipo === 'Contraseña') {
        // Si hay una contraseña real visible, usarla; si no, obtenerla del backend
        let contrasenaReal = passwordsReales[id];
        
        if (!contrasenaReal) {
          const response = await apiService.obtenerContrasenaPorId(id);
          contrasenaReal = response.datos?.contrasena.contrasenaEncriptada || '';
        }
        
        await navigator.clipboard.writeText(contrasenaReal);
      } else {
        await navigator.clipboard.writeText(texto);
      }
      
      toast.success(`${tipo} copiada al portapapeles`);
    } catch (error: unknown) {
      console.error('Error al copiar:', error);
      toast.error('Error al copiar al portapapeles');
    }
  };

  // Funciones para el modal de edición
  const abrirModal = (password?: Contrasena) => {
    if (password) {
      setEditingPassword(password);
      setFormData({
        sitio: password.titulo || '',
        usuario: password.usuario || '',
        email: password.email || '',
        url: password.url || '',
        contrasena: '',
        notas: password.notas || '',
        categoria: password.categoria || 'personal',
        esFavorito: password.esFavorito || false
      });
    }
    setShowModal(true);
    setShowPassword(false);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditingPassword(null);
    setFormData({
      sitio: '',
      usuario: '',
      email: '',
      url: '',
      contrasena: '',
      notas: '',
      categoria: 'personal',
      esFavorito: false
    });
    setShowPassword(false);
  };

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.sitio.trim()) {
      toast.error('El título es obligatorio');
      return;
    }

    try {
      const dataToSend = {
        titulo: formData.sitio.trim(),
        usuario: formData.usuario || undefined,
        mail: formData.email || undefined,
        url: formData.url || undefined,
        contrasena: formData.contrasena || undefined,
        notas: formData.notas || undefined,
        categoria: formData.categoria.toLowerCase().replace(/\s+/g, '_'),
        esFavorito: formData.esFavorito
      };

      if (editingPassword) {
        if (!formData.contrasena.trim()) {
          delete dataToSend.contrasena;
        }
        
        const respuesta = await apiService.actualizarContrasena(editingPassword._id, dataToSend);
        
        if (respuesta.exito) {
          toast.success('Contraseña actualizada exitosamente');
          await cargarFavoritos();
          cerrarModal();
        } else {
          toast.error(respuesta.mensaje || 'Error al actualizar la contraseña');
        }
      }
    } catch (error: unknown) {
      console.error('Error en submit:', error);
      
      let mensaje = 'Error al procesar la contraseña';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { errores?: Array<{ msg?: string; message?: string }>; mensaje?: string } } };
        if (axiosError.response?.data?.errores && Array.isArray(axiosError.response.data.errores)) {
          const errores = axiosError.response.data.errores.map((err) => err.msg || err.message || 'Error desconocido').join(', ');
          mensaje = `Errores de validación: ${errores}`;
        } else if (axiosError.response?.data?.mensaje) {
          mensaje = axiosError.response.data.mensaje;
        }
      } else if (error instanceof Error) {
        mensaje = error.message;
      }
      
      toast.error(mensaje);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 transition-colors duration-300">
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-orange-500/10 dark:from-yellow-600/20 dark:to-orange-600/20 rounded-3xl -z-10" />
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/50 p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg ring-4 ring-white/10">
                    <Star className="w-8 h-8 text-white drop-shadow-sm fill-current" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{favoritos.length}</span>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                    Favoritos
                  </h3>
                  <p className="text-gray-500 dark:text-gray-300 text-sm mt-1">
                    Aquí puedes ver y gestionar tus contraseñas favoritas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filters */}
        <div className="mb-8 space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar en favoritos por título, usuario o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-yellow-200 dark:border-yellow-800 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedCategory('Todas')}
              className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-200 shadow-md ${
                selectedCategory === 'Todas'
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg scale-105'
                  : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border border-yellow-200 dark:border-yellow-800 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:border-yellow-300 dark:hover:border-yellow-700'
              }`}
            >
              Todas
            </button>
            {CATEGORIAS.map((categoria) => (
              <button
                key={categoria}
                onClick={() => setSelectedCategory(categoria)}
                className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-200 shadow-md ${
                  selectedCategory === categoria
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg scale-105'
                    : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border border-yellow-200 dark:border-yellow-800 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:border-yellow-300 dark:hover:border-yellow-700'
                }`}
              >
                {categoria}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de favoritos */}
      {favoritos.length === 0 ? (
        <div className="text-center py-12">
          <Star className="w-24 h-24 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <div className="text-gray-500 text-lg mb-2">No tienes contraseñas favoritas</div>
          <p className="text-gray-400 mb-6">
            Marca tus contraseñas más importantes como favoritas para acceder rápidamente a ellas
          </p>
          <button
            onClick={() => window.location.href = '/passwords'}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Ver Todas las Contraseñas
          </button>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredFavorites.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-400 text-lg mb-2">No se encontraron favoritos</div>
              <p className="text-gray-500">
                Intenta cambiar el término de búsqueda
              </p>
            </div>
          ) : (
            filteredFavorites.map((password) => (
              <div
                key={password._id}
                className="relative group bg-gradient-to-br from-yellow-50/80 via-white/90 to-orange-50/80 dark:from-yellow-900/60 dark:via-gray-900/80 dark:to-orange-900/60 border border-yellow-100 dark:border-yellow-900 rounded-2xl shadow-xl hover:scale-[1.025] hover:shadow-2xl transition-all duration-300 overflow-hidden"
              >
                {/* Cinta de favorito */}
                <div className="absolute top-0 right-0 z-10 px-3 py-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-xs font-bold text-white rounded-bl-2xl shadow-md">
                  <Star className="inline w-4 h-4 mr-1 -mt-1" /> Favorito
                </div>

                {/* Header */}
                <div className="px-6 pt-6 pb-2 flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-tr from-yellow-200 to-orange-200 dark:from-yellow-800 dark:to-orange-800 rounded-xl flex items-center justify-center shadow">
                    <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-300 fill-current" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                      {password.titulo || 'Sin título'}
                    </h3>
                    {password.url && (
                      <a 
                        href={password.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center gap-1 text-sm text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 hover:underline transition-colors truncate max-w-[200px]"
                      >
                        <span className="truncate">{password.url}</span>
                        <Link2 className="w-3 h-3 flex-shrink-0" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Categoría */}
                <div className="px-6 mb-3">
                  <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-3 py-1 text-xs font-bold rounded-full">
                    {password.categoria}
                  </span>
                </div>

                {/* Contenido */}
                <div className="px-6 pb-4 space-y-3">
                  {/* Usuario */}
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50/80 to-emerald-100/80 dark:from-emerald-900/40 dark:to-emerald-800/40 rounded-xl border border-emerald-100 dark:border-emerald-800">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-800/50 rounded-lg flex items-center justify-center">
                        <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">Usuario</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {password.usuario || '-'}
                        </p>
                      </div>
                    </div>
                    {password.usuario && (
                      <button
                        onClick={() => copiarAlPortapapeles(password.usuario || '', 'Usuario', password._id)}
                        className="p-1 text-gray-400 hover:text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg transition-all duration-200"
                        title="Copiar usuario"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Email */}
                  {password.email && (
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50/80 to-purple-100/80 dark:from-purple-900/40 dark:to-purple-800/40 rounded-xl border border-purple-100 dark:border-purple-800">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-800/50 rounded-lg flex items-center justify-center">
                          <Mail className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">Email</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {password.email}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => copiarAlPortapapeles(password.email || '', 'Email', password._id)}
                        className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-all duration-200"
                        title="Copiar email"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Contraseña */}
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50/80 to-red-100/80 dark:from-red-900/40 dark:to-red-800/40 rounded-xl border border-red-100 dark:border-red-800">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 bg-red-100 dark:bg-red-800/50 rounded-lg flex items-center justify-center">
                        <Lock className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-red-700 dark:text-red-300 uppercase tracking-wide">Contraseña</p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-gray-900 dark:text-white tracking-wider">
                            {showPasswords[password._id] && passwordsReales[password._id] 
                              ? passwordsReales[password._id] 
                              : '••••••••••••'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => mostrarContrasena(password._id)}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200"
                        title={showPasswords[password._id] ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showPasswords[password._id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      {showPasswords[password._id] && (
                        <button
                          onClick={() => copiarAlPortapapeles('', 'Contraseña', password._id)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200"
                          title="Copiar contraseña"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Notas */}
                  <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 rounded-lg px-3 py-2">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Notas:</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed block mt-1">{password.notas || '-'}</span>
                  </div>
                </div>

                {/* Footer con acciones */}
                <div className="px-6 py-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/40 dark:to-orange-900/40 border-t border-yellow-100 dark:border-yellow-900 flex items-center justify-between">
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    Creado {new Date(password.fechaCreacion).toLocaleDateString('es-ES')}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => alternarFavorito(password._id)}
                      className="p-2 rounded-lg transition-all duration-200 text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
                      title="Quitar de favoritos"
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                    <button
                      onClick={() => abrirModal(password)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                      title="Editar contraseña"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => eliminarContrasena(password._id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                      title="Eliminar contraseña"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal de verificación de contraseña maestra */}
      {showMasterPasswordModal && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Verificar Contraseña Maestra
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Ingresa tu contraseña maestra para ver la contraseña
              </p>
              
              <input
                type="password"
                value={masterPassword}
                onChange={(e) => {
                  setMasterPassword(e.target.value);
                  setErrorVerificacion('');
                }}
                placeholder="Contraseña maestra"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
                disabled={verificando}
                autoFocus
              />
              
              {errorVerificacion && (
                <div className="text-sm text-red-600 dark:text-red-400 mb-2">{errorVerificacion}</div>
              )}
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowMasterPasswordModal(false);
                    setMasterPassword('');
                    setPendingShowPasswordId(null);
                    setErrorVerificacion('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={verificarContrasenaMaestra}
                  disabled={verificando}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {verificando ? 'Verificando...' : 'Verificar'}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modal de edición con diseño mejorado */}
      {showModal && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 w-full max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto">
              {/* Header mejorado */}
              <div className="text-center p-6 pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Edit className="w-6 h-6 text-white drop-shadow-sm" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Editar Contraseña Favorita
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Modifica los datos de tu contraseña favorita
                </p>
              </div>

              <form onSubmit={manejarSubmit} className="p-6 space-y-5">
                {/* Título */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Título *
                  </label>
                  <div className="relative">
                    <Star className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={formData.sitio}
                      onChange={(e) => setFormData({ ...formData, sitio: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white/80 dark:bg-gray-900/80 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
                      placeholder="Ej: Facebook, Gmail, Banco..."
                      required
                    />
                  </div>
                </div>

                {/* Usuario */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Usuario
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={formData.usuario}
                      onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white/80 dark:bg-gray-900/80 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
                      placeholder="Nombre de usuario"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white/80 dark:bg-gray-900/80 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                </div>

                {/* URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    URL del sitio
                  </label>
                  <div className="relative">
                    <Link2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white/80 dark:bg-gray-900/80 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
                      placeholder="https://ejemplo.com"
                    />
                  </div>
                </div>

                {/* Contraseña */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.contrasena}
                      onChange={(e) => setFormData({ ...formData, contrasena: e.target.value })}
                      className="w-full pl-10 pr-12 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white/80 dark:bg-gray-900/80 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
                      placeholder="Dejar vacío para mantener la actual"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Categoría
                  </label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white/80 dark:bg-gray-900/80 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
                  >
                    <option value="personal">Personal</option>
                    <option value="trabajo">Trabajo</option>
                    <option value="redes_sociales">Redes Sociales</option>
                    <option value="bancos">Bancos</option>
                    <option value="compras">Compras</option>
                    <option value="entretenimiento">Entretenimiento</option>
                    <option value="otros">Otros</option>
                  </select>
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notas
                  </label>
                  <textarea
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white/80 dark:bg-gray-900/80 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all resize-none"
                    placeholder="Notas adicionales (opcional)"
                  />
                </div>

                {/* Favorito */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="esFavorito"
                    checked={formData.esFavorito}
                    onChange={(e) => setFormData({ ...formData, esFavorito: e.target.checked })}
                    className="w-4 h-4 text-yellow-600 bg-gray-100 border-gray-300 rounded focus:ring-yellow-500 dark:focus:ring-yellow-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label htmlFor="esFavorito" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Marcar como favorito
                  </label>
                </div>

                {/* Botones mejorados */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={cerrarModal}
                    className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-xl hover:from-yellow-700 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl font-medium"
                  >
                    Actualizar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}
      </div>
    </div>
  );
};

export default Favorites;