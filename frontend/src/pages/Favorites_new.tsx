import React, { useState, useEffect, useCallback } from 'react';
import ModalPortal from '../components/ModalPortal';
import { Star, Search, Eye, EyeOff, Copy, Edit, Trash2, Link2, User, Mail, Lock, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiService } from '../services/api';
import { syncEvents } from '../utils/syncEvents';
import type { Contrasena, CrearContrasenaData } from '../types';

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
  const [verificationModal, setVerificationModal] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const [pendingShowPasswordId, setPendingShowPasswordId] = useState<string | null>(null);
  const [verificando, setVerificando] = useState(false);
  const [errorVerificacion, setErrorVerificacion] = useState<string | null>(null);

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
    categoria: 'Personal',
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
      toast.error('Error al quitar de favoritos');
    }
  };

  const mostrarContrasena = (id: string) => {
    if (showPasswords[id]) {
      setShowPasswords(prev => ({ ...prev, [id]: false }));
      setPasswordsReales(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    } else {
      setPendingShowPasswordId(id);
      setVerificationModal(true);
    }
  };

  const copiarAlPortapapeles = async (texto: string, tipo: string, passwordId?: string, sitio?: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      toast.success(`${tipo} copiado al portapapeles`);
      
      if (passwordId && sitio) {
        syncEvents.emit('PASSWORD_COPIED', { passwordId, sitio, tipo });
      }
    } catch (error) {
      console.error('Error al copiar:', error);
      toast.error('Error al copiar al portapapeles');
    }
  };

  const eliminarContrasena = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta contraseña?')) {
      return;
    }

    try {
      await apiService.eliminarContrasena(id);
      toast.success('Contraseña eliminada exitosamente');
      cargarFavoritos();
    } catch (error) {
      console.error('Error al eliminar contraseña:', error);
      toast.error('Error al eliminar la contraseña');
    }
  };

  const abrirModal = (password?: Contrasena) => {
    setShowPassword(false);
    if (password) {
      setEditingPassword(password);
      setFormData({
        sitio: password.titulo || '',
        usuario: password.usuario || '',
        email: password.email || '',
        url: password.url || '',
        contrasena: '',
        categoria: password.categoria,
        notas: password.notas || '',
        esFavorito: password.esFavorito
      });
    } else {
      setEditingPassword(null);
      setFormData({
        sitio: '',
        usuario: '',
        email: '',
        url: '',
        contrasena: '',
        categoria: 'Personal',
        notas: '',
        esFavorito: true // Por defecto en favoritos
      });
    }
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditingPassword(null);
    setShowPassword(false);
    setFormData({
      sitio: '',
      usuario: '',
      email: '',
      url: '',
      contrasena: '',
      categoria: 'Personal',
      notas: '',
      esFavorito: false
    });
  };

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.sitio.trim() || (!editingPassword && !formData.contrasena.trim())) {
      toast.error('El título y la contraseña son obligatorios');
      return;
    }

    try {
      if (editingPassword) {
        const dataToSend: Partial<CrearContrasenaData> = {
          sitio: formData.sitio.trim(),
          usuario: formData.usuario || undefined,
          email: formData.email || undefined,  
          url: formData.url || undefined,
          notas: formData.notas || undefined,
          categoria: formData.categoria.toLowerCase().replace(/\s+/g, '_'),
          esFavorito: formData.esFavorito
        };

        if (formData.contrasena.trim()) {
          dataToSend.contrasena = formData.contrasena.trim();
        }
        
        const respuesta = await apiService.actualizarContrasena(editingPassword._id, dataToSend);
        
        if (respuesta.exito) {
          toast.success('Contraseña actualizada exitosamente');
          await cargarFavoritos();
          cerrarModal();
        } else {
          toast.error(respuesta.mensaje || 'Error al actualizar la contraseña');
        }
      } else {
        const dataToSend: CrearContrasenaData = {
          sitio: formData.sitio.trim(),
          usuario: formData.usuario || undefined,
          email: formData.email || undefined,  
          url: formData.url || undefined,
          contrasena: formData.contrasena.trim(),
          notas: formData.notas || undefined,
          categoria: formData.categoria.toLowerCase().replace(/\s+/g, '_'),
          esFavorito: formData.esFavorito
        };

        const respuesta = await apiService.crearContrasena(dataToSend);
        
        if (respuesta.exito) {
          toast.success('Contraseña creada exitosamente');
          await cargarFavoritos();
          cerrarModal();
        } else {
          toast.error(respuesta.mensaje || 'Error al crear la contraseña');
        }
      }
    } catch (error: unknown) {
      console.error('Error completo en submit:', error);
      
      let mensaje = 'Error al procesar la contraseña';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { errores?: Array<{ msg?: string; message?: string }>; mensaje?: string } } };
        if (axiosError.response?.data?.errores && Array.isArray(axiosError.response.data.errores)) {
          const errores = axiosError.response.data.errores.map((err: { msg?: string; message?: string }) => err.msg || err.message).join(', ');
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando favoritos...</p>
        </div>
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
                  <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 dark:from-yellow-400 dark:to-orange-400 bg-clip-text text-transparent">
                    Contraseñas Favoritas
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
                    Accede rápidamente a tus contraseñas más importantes
                  </p>
                  {favoritos.length > 0 && (
                    <div className="flex items-center gap-2 mt-3">
                      <div className="px-4 py-1.5 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/50 dark:to-orange-900/50 text-yellow-800 dark:text-yellow-200 rounded-full text-sm font-semibold border border-yellow-200/50 dark:border-yellow-800/50">
                        {favoritos.length} {favoritos.length === 1 ? 'favorito' : 'favoritos'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => abrirModal()}
                  className="group relative overflow-hidden bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  <div className="relative flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    <span>Nuevo Favorito</span>
                  </div>
                </button>
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
          <div className="text-center py-16">
            <div className="relative mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900 dark:to-orange-900 rounded-3xl mx-auto flex items-center justify-center">
                <Star className="w-12 h-12 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              No tienes contraseñas favoritas
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Marca tus contraseñas más importantes como favoritas para acceder rápidamente a ellas desde aquí
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.href = '/contrasenas'}
                className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                Ver Todas las Contraseñas
              </button>
              <button
                onClick={() => abrirModal()}
                className="bg-white dark:bg-gray-800 border-2 border-yellow-600 dark:border-yellow-500 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 px-8 py-3 rounded-2xl font-bold transition-all duration-200"
              >
                Crear Nueva Contraseña
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredFavorites.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-600 dark:text-gray-400 text-lg mb-2">No se encontraron favoritos</div>
                <p className="text-gray-500 dark:text-gray-500">
                  {searchTerm || selectedCategory !== 'Todas'
                    ? 'Intenta cambiar los filtros de búsqueda para encontrar tus favoritos'
                    : 'Comienza agregando contraseñas a tus favoritos'}
                </p>
              </div>
            ) : (
              filteredFavorites.map((password) => (
                <div
                  key={password._id}
                  className="group relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-yellow-100/60 dark:border-yellow-900/60 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden hover:scale-[1.02] hover:border-yellow-200 dark:hover:border-yellow-800"
                >
                  {/* Decorative gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-50/20 via-transparent to-orange-50/20 dark:from-yellow-900/10 dark:via-transparent dark:to-orange-900/10 pointer-events-none" />
                  
                  {/* Favorite badge */}
                  <div className="absolute top-4 right-4 z-20 flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-xs font-bold text-white rounded-full shadow-lg ring-2 ring-white/20">
                    <Star className="w-3 h-3 fill-current" />
                    <span>Favorito</span>
                  </div>
                  
                  {/* Header section */}
                  <div className="relative p-6 pb-4">
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg ring-4 ring-white/10">
                          <Link2 className="w-7 h-7 text-white drop-shadow-sm" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full border-2 border-white dark:border-gray-900" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 truncate">
                          {password.titulo || 'Sin título'}
                        </h3>
                        {password.url && (
                          <a 
                            href={password.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1 text-sm text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 hover:underline transition-colors"
                          >
                            <span className="truncate max-w-[200px]">{password.url}</span>
                            <Link2 className="w-3 h-3 flex-shrink-0" />
                          </a>
                        )}
                        
                        {/* Category badge */}
                        <div className="mt-3">
                          <span className="inline-flex items-center px-3 py-1 text-xs font-semibold bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/50 dark:to-orange-900/50 text-yellow-800 dark:text-yellow-200 rounded-full border border-yellow-200/50 dark:border-yellow-800/50 shadow-sm">
                            {password.categoria}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Content section */}
                  <div className="px-6 pb-6 space-y-4">
                    {/* Username field */}
                    <div className="group/item relative p-4 bg-gradient-to-r from-emerald-50/90 to-teal-50/90 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-2xl border border-emerald-100/50 dark:border-emerald-800/50 transition-all duration-200 hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mb-1">Usuario</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {password.usuario || '—'}
                            </p>
                          </div>
                        </div>
                        {password.usuario && (
                          <button
                            onClick={() => copiarAlPortapapeles(password.usuario || '', 'Usuario', password._id, password.titulo)}
                            className="opacity-0 group-hover/item:opacity-100 p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/50 rounded-xl transition-all duration-200"
                            title="Copiar usuario"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Email field */}
                    {password.email && (
                      <div className="group/item relative p-4 bg-gradient-to-r from-purple-50/90 to-pink-50/90 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl border border-purple-100/50 dark:border-purple-800/50 transition-all duration-200 hover:shadow-md hover:border-purple-200 dark:hover:border-purple-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-md">
                              <Mail className="w-5 h-5 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider mb-1">Email</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {password.email}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => copiarAlPortapapeles(password.email || '', 'Email', password._id, password.titulo)}
                            className="opacity-0 group-hover/item:opacity-100 p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-100/80 dark:hover:bg-purple-900/50 rounded-xl transition-all duration-200"
                            title="Copiar email"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Password field */}
                    <div className="group/item relative p-4 bg-gradient-to-r from-red-50/90 to-orange-50/90 dark:from-red-900/30 dark:to-orange-900/30 rounded-2xl border border-red-100/50 dark:border-red-800/50 transition-all duration-200 hover:shadow-md hover:border-red-200 dark:hover:border-red-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                            <Lock className="w-5 h-5 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-red-700 dark:text-red-300 uppercase tracking-wider mb-1">Contraseña</p>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono font-semibold text-gray-900 dark:text-white tracking-wider">
                                {showPasswords[password._id] && passwordsReales[password._id] 
                                  ? passwordsReales[password._id] 
                                  : '••••••••••••'
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => mostrarContrasena(password._id)}
                            className="opacity-0 group-hover/item:opacity-100 p-2 text-gray-400 hover:text-red-600 hover:bg-red-100/80 dark:hover:bg-red-900/50 rounded-xl transition-all duration-200"
                            title={showPasswords[password._id] ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          >
                            {showPasswords[password._id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          {showPasswords[password._id] && (
                            <button
                              onClick={() => copiarAlPortapapeles(passwordsReales[password._id] || '', 'Contraseña', password._id, password.titulo)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-100/80 dark:hover:bg-red-900/50 rounded-xl transition-all duration-200"
                              title="Copiar contraseña"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Notes section */}
                    {password.notas && (
                      <div className="p-4 bg-gradient-to-r from-amber-50/80 to-yellow-50/80 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-2xl border border-amber-100/50 dark:border-amber-800/50">
                        <p className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-2">Notas</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          {password.notas}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Footer actions */}
                  <div className="relative px-6 py-4 bg-gradient-to-r from-yellow-50/50 to-orange-50/50 dark:from-yellow-900/20 dark:to-orange-900/20 border-t border-yellow-100/50 dark:border-yellow-900/50">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        Creado {new Date(password.fechaCreacion).toLocaleDateString('es-ES')}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => alternarFavorito(password._id)}
                          className="p-2.5 text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 shadow-md rounded-xl transition-all duration-200"
                          title="Quitar de favoritos"
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </button>
                        <button
                          onClick={() => abrirModal(password)}
                          className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-200"
                          title="Editar contraseña"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => eliminarContrasena(password._id)}
                          className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200"
                          title="Eliminar contraseña"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Modal de formulario */}
        {showModal && (
          <ModalPortal>
            <div className="fixed inset-0 h-screen w-screen z-[9999] flex items-center justify-center bg-black/60 dark:bg-black/80">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 w-full max-w-md md:max-w-lg p-4 sm:p-6 md:p-8 overflow-y-auto max-h-[90vh] flex flex-col">
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-2">
                    <Star className="w-10 h-10 text-yellow-600 dark:text-yellow-400 drop-shadow-lg fill-current" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                    {editingPassword ? 'Editar Favorito' : 'Nuevo Favorito'}
                  </h2>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {editingPassword ? 'Modifica los datos de tu contraseña favorita' : 'Agrega una nueva contraseña a tus favoritos'}
                  </p>
                </div>

                <form onSubmit={manejarSubmit} className="space-y-5">
                  {/* Título / Sitio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sitio / Título *
                    </label>
                    <div className="relative">
                      <Star className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        required
                        value={formData.sitio}
                        onChange={(e) => setFormData({ ...formData, sitio: e.target.value })}
                        className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 px-4 py-3 pl-10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
                        placeholder="Ej: Gmail, Amazon, Banco..."
                      />
                    </div>
                  </div>

                  {/* Usuario */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Usuario (opcional)
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={formData.usuario || ''}
                        onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                        className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 px-4 py-3 pl-10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
                        placeholder="Tu usuario de acceso"
                      />
                    </div>
                  </div>

                  {/* Email adicional (opcional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Correo electronico (opcional)
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 px-4 py-3 pl-10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
                        placeholder="Opcional: email asociado a la cuenta"
                      />
                    </div>
                  </div>

                  {/* URL (opcional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      URL (opcional)
                    </label>
                    <div className="relative">
                      <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="url"
                        value={formData.url || ''}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 px-4 py-3 pl-10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
                        placeholder="https://sitio.com"
                      />
                    </div>
                  </div>

                  {/* Contraseña */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Contraseña {editingPassword ? '' : '*'}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required={!editingPassword}
                        value={formData.contrasena}
                        onChange={(e) => setFormData({ ...formData, contrasena: e.target.value })}
                        placeholder={editingPassword ? 'Dejar vacío para mantener la actual' : 'Contraseña segura'}
                        className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 px-4 py-3 pl-10 pr-10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        tabIndex={-1}
                        onClick={() => setShowPassword((v) => !v)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {editingPassword && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Deja vacío para mantener la contraseña actual
                      </p>
                    )}
                  </div>

                  {/* Categoría */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Categoría
                    </label>
                    <select
                      value={formData.categoria}
                      onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 px-4 py-3 text-gray-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
                    >
                      {CATEGORIAS.map((categoria) => (
                        <option key={categoria} value={categoria}>
                          {categoria}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Notas */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notas (opcional)
                    </label>
                    <textarea
                      value={formData.notas}
                      onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                      rows={2}
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
                      placeholder="Notas adicionales, pistas, etc."
                    />
                  </div>

                  {/* Favorito */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="esFavorito"
                      checked={formData.esFavorito}
                      onChange={(e) => setFormData({ ...formData, esFavorito: e.target.checked })}
                      className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                    />
                    <label htmlFor="esFavorito" className="text-sm text-gray-700 dark:text-gray-300 select-none">
                      Marcar como favorito
                    </label>
                  </div>

                  {/* Botones */}
                  <div className="flex gap-2 pt-4">
                    <button
                      type="button"
                      onClick={cerrarModal}
                      className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300 font-semibold shadow hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-bold shadow-lg hover:from-yellow-700 hover:to-orange-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                    >
                      {editingPassword ? 'Actualizar' : 'Crear'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </ModalPortal>
        )}

        {/* Modal de verificación de contraseña maestra */}
        {verificationModal && (
          <ModalPortal>
            <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center p-4 z-[9999]">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 p-6 w-full max-w-sm">
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-3">
                    <Lock className="w-12 h-12 text-yellow-600 dark:text-yellow-400 drop-shadow-lg" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Verificar Contraseña Maestra
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Ingresa tu contraseña maestra para ver la contraseña
                  </p>
                </div>
                
                <input
                  type="password"
                  placeholder="Contraseña maestra"
                  value={masterPassword}
                  onChange={(e) => {
                    setMasterPassword(e.target.value);
                    setErrorVerificacion(null);
                  }}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all mb-4"
                  disabled={verificando}
                  autoFocus
                />
                
                {errorVerificacion && (
                  <div className="text-sm text-red-600 dark:text-red-400 mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    {errorVerificacion}
                  </div>
                )}
                
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setVerificationModal(false);
                      setMasterPassword('');
                      setPendingShowPasswordId(null);
                      setErrorVerificacion(null);
                    }}
                    className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300 font-semibold shadow hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                    disabled={verificando}
                  >
                    Cancelar
                  </button>
                  <button
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-bold shadow-lg hover:from-yellow-700 hover:to-orange-700 transition-all duration-200 disabled:opacity-60"
                    disabled={verificando || !masterPassword}
                    onClick={async () => {
                      if (!pendingShowPasswordId) return;
                      setVerificando(true);
                      setErrorVerificacion(null);
                      try {
                        const resp = await apiService.verificarContrasenaMaestra(masterPassword);
                        if (resp.exito && resp.datos?.esValida) {
                          // Obtener la contraseña real desencriptada
                          const respPwd = await apiService.obtenerContrasenaPorId(pendingShowPasswordId);
                          console.log('Respuesta obtenerContrasenaPorId:', respPwd);
                          
                          let realPwd = null;
                          if (respPwd?.exito && respPwd?.datos?.contrasena) {
                            // El backend devuelve 'contrasenaDesencriptada' en lugar de 'contrasenaEncriptada'
                            realPwd = respPwd.datos.contrasena.contrasenaDesencriptada || respPwd.datos.contrasena.contrasenaEncriptada;
                          }
                          
                          console.log('Contraseña obtenida:', realPwd);
                          
                          if (realPwd) {
                            setPasswordsReales((prev) => ({ ...prev, [pendingShowPasswordId]: realPwd }));
                          } else {
                            console.error('No se pudo obtener la contraseña:', respPwd);
                            setPasswordsReales((prev) => ({ ...prev, [pendingShowPasswordId]: '[Error al obtener la contraseña]' }));
                          }
                          setShowPasswords({ ...showPasswords, [pendingShowPasswordId]: true });
                          setVerificationModal(false);
                          setMasterPassword('');
                          setErrorVerificacion(null);
                          // Guardar id para ocultar después
                          const idToHide = pendingShowPasswordId;
                          setPendingShowPasswordId(null);
                          setTimeout(() => {
                            setShowPasswords((prev) => ({ ...prev, [idToHide]: false }));
                            setPasswordsReales((prev) => {
                              const nuevo = { ...prev };
                              delete nuevo[idToHide];
                              return nuevo;
                            });
                          }, 10000);
                        } else {
                          setErrorVerificacion('Contraseña maestra incorrecta');
                        }
                      } catch (error) {
                        console.error('Error completo al verificar contraseña:', error);
                        setErrorVerificacion('Error al verificar la contraseña maestra');
                      } finally {
                        setVerificando(false);
                      }
                    }}
                  >
                    {verificando ? 'Verificando...' : 'Verificar'}
                  </button>
                </div>
              </div>
            </div>
          </ModalPortal>
        )}
      </div>
    </div>
  );
};

export default Favorites;
