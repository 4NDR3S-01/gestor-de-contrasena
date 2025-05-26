import React, { useState, useEffect, useCallback } from 'react';
import ModalPortal from '../components/ModalPortal';
import { Search, Plus, Star, Eye, EyeOff, Copy, Edit, Trash2, Lock, User, Mail, Link2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiService } from '../services/api';
import { syncEvents } from '../utils/syncEvents';
import type { Contrasena, CrearContrasenaData } from '../types/index';

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




const Passwords: React.FC = () => {
  const [contrasenas, setContrasenas] = useState<Contrasena[]>([]);
  const [filteredPasswords, setFilteredPasswords] = useState<Contrasena[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [showModal, setShowModal] = useState(false);
  const [editingPassword, setEditingPassword] = useState<Contrasena | null>(null);
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [passwordsReales, setPasswordsReales] = useState<{ [key: string]: string }>({});
  const [verificationModal, setVerificationModal] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const [pendingShowPasswordId, setPendingShowPasswordId] = useState<string | null>(null);
  const [verificando, setVerificando] = useState(false);
  const [errorVerificacion, setErrorVerificacion] = useState<string | null>(null);
  // Estado para mostrar/ocultar la contraseña en el modal
  const [showPassword, setShowPassword] = useState(false);


  // Estados del formulario
  const [formData, setFormData] = useState({
    sitio: '',
    usuario: '',
    email: '',
    url: '',
    contrasena: '',
    categoria: 'Personal',
    notas: '',
    esFavorito: false
  });

  useEffect(() => {
    cargarContrasenas();
  }, []);

  const filtrarContrasenas = useCallback(() => {
    let filtered = contrasenas;

    if (searchTerm) {
      filtered = filtered.filter(
        (password) =>
          password.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (password.usuario ?? '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'Todas') {
      // Normaliza la categoría para comparar correctamente
      filtered = filtered.filter(
        (password) =>
          password.categoria.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    setFilteredPasswords(filtered);
  }, [contrasenas, searchTerm, selectedCategory]);

  useEffect(() => {
    filtrarContrasenas();
  }, [filtrarContrasenas]);


  const cargarContrasenas = async () => {
    setLoading(true);
    try {
      const data = await apiService.obtenerContrasenas();
      setContrasenas(data);
      syncEvents.emit('DATA_FETCHED');
    } catch {
      toast.error('Error al cargar las contraseñas');
      syncEvents.emit('SYNC_FAILED');
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (password?: Contrasena) => {
    setShowPassword(false); // Siempre ocultar la contraseña al abrir el modal
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
        esFavorito: false
      });
    }
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditingPassword(null);
    setShowPassword(false); // Ocultar la contraseña al cerrar el modal
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
    
    console.log('=== INICIO SUBMIT ===');
    console.log('FormData:', formData);
    console.log('EditingPassword:', editingPassword);
    
    // Validación básica frontend
    if (!formData.sitio.trim() || (!editingPassword && !formData.contrasena.trim())) {
      toast.error('El título y la contraseña son obligatorios');
      return;
    }

    try {
      if (editingPassword) {
        // Para actualización, usar Partial<CrearContrasenaData>
        const dataToSend: Partial<CrearContrasenaData> = {
          sitio: formData.sitio.trim(),
          usuario: formData.usuario || undefined,
          email: formData.email || undefined,  
          url: formData.url || undefined,
          notas: formData.notas || undefined,
          categoria: formData.categoria.toLowerCase().replace(/\s+/g, '_'),
          esFavorito: formData.esFavorito
        };

        // Solo incluir contraseña si se modificó
        if (formData.contrasena.trim()) {
          dataToSend.contrasena = formData.contrasena.trim();
        }
        
        console.log('Actualizando contraseña ID:', editingPassword._id);
        console.log('DataToSend actualización:', dataToSend);
        const respuesta = await apiService.actualizarContrasena(editingPassword._id, dataToSend);
        console.log('Respuesta actualización:', respuesta);
        
        if (respuesta.exito) {
          toast.success('Contraseña actualizada exitosamente');
          await cargarContrasenas();
          cerrarModal();
        } else {
          console.error('Error en respuesta:', respuesta);
          toast.error(respuesta.mensaje || 'Error al actualizar la contraseña');
        }
      } else {
        // Para creación, usar CrearContrasenaData completo
        const dataToSend: CrearContrasenaData = {
          sitio: formData.sitio.trim(),
          usuario: formData.usuario || undefined,
          email: formData.email || undefined,  
          url: formData.url || undefined,
          contrasena: formData.contrasena.trim(), // Requerido para creación
          notas: formData.notas || undefined,
          categoria: formData.categoria.toLowerCase().replace(/\s+/g, '_'),
          esFavorito: formData.esFavorito
        };

        console.log('Creando nueva contraseña');
        console.log('DataToSend creación:', dataToSend);
        const respuesta = await apiService.crearContrasena(dataToSend);
        console.log('Respuesta creación:', respuesta);
        
        if (respuesta.exito) {
          toast.success('Contraseña creada exitosamente');
          await cargarContrasenas();
          cerrarModal();
        } else {
          console.error('Error en respuesta:', respuesta);
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

  const eliminarContrasena = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta contraseña?')) {
      try {
        await apiService.eliminarContrasena(id);
        toast.success('Contraseña eliminada correctamente');
        cargarContrasenas();
      } catch {
        toast.error('Error al eliminar la contraseña');
      }
    }
  };

  const toggleFavorito = async (id: string, esFavorito: boolean) => {
    try {
      await apiService.alternarFavorito(id);
      toast.success(esFavorito ? 'Eliminado de favoritos' : 'Agregado a favoritos');
      cargarContrasenas();
    } catch {
      toast.error('Error al actualizar favoritos');
    }
  };

  const copiarAlPortapapeles = async (texto: string, tipo: string, passwordId?: string, sitio?: string) => {
    try {
      let textoAcopiar = texto;
      
      // Si es una contraseña y tenemos el ID, obtener la contraseña real
      if (tipo === 'Contraseña' && passwordId) {
        try {
          const response = await apiService.obtenerContrasenaPorId(passwordId);
          if (response.datos && typeof response.datos.contrasena === 'string') {
            textoAcopiar = response.datos.contrasena;
          } else {
            toast.error('Error al obtener la contraseña');
            return;
          }
        } catch {
          toast.error('Error al obtener la contraseña');
          return;
        }
      }
      
      await navigator.clipboard.writeText(textoAcopiar);
      toast.success(`${tipo} copiado al portapapeles`);
      
      // Emitir evento de copia de contraseña
      if (tipo === 'Contraseña' && sitio) {
        syncEvents.emit('PASSWORD_COPIED', { sitio });
      } else if (tipo === 'Usuario' && sitio) {
        syncEvents.emit('PASSWORD_VIEWED', { sitio });
      }
    } catch {
      toast.error('Error al copiar al portapapeles');
    }
  };

  const mostrarContrasena = (id: string) => {
    if (showPasswords[id]) {
      setShowPasswords({ ...showPasswords, [id]: false });
      setPasswordsReales((prev) => {
        const nuevo = { ...prev };
        delete nuevo[id];
        return nuevo;
      });
      return;
    }
    setPendingShowPasswordId(id);
    setVerificationModal(true);
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 transition-colors duration-300">
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-500/10 dark:from-blue-600/20 dark:to-purple-600/20 rounded-3xl -z-10" />
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/50 p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg ring-4 ring-white/10">
                    <Lock className="w-8 h-8 text-white drop-shadow-sm" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{filteredPasswords.length}</span>
                  </div>
                </div>
                
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Mis Contraseñas
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Gestiona tus contraseñas de forma segura y organizada
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                  {filteredPasswords.length} contraseñas
                </span>
                <button
                  onClick={() => abrirModal()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  Nueva Contraseña
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
              placeholder="Buscar contraseñas por título, usuario o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-blue-200 dark:border-blue-800 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedCategory('Todas')}
              className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-200 shadow-md ${
                selectedCategory === 'Todas'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105'
                  : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700'
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
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105'
                    : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
              >
                {categoria}
              </button>
            ))}
          </div>
        </div>

      {/* Lista de contraseñas */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredPasswords.length === 0 ? (
          <div className="text-center py-16 col-span-full">
            <div className="mx-auto mb-6 w-16 h-16 bg-gradient-to-tr from-blue-200 to-purple-200 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center shadow-lg">
              <Lock className="w-8 h-8 text-blue-500 dark:text-blue-300" />
            </div>
            <div className="text-gray-600 dark:text-gray-300 text-xl font-medium mb-2">No se encontraron contraseñas</div>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              {searchTerm || selectedCategory !== 'Todas'
                ? 'Intenta cambiar los filtros de búsqueda para encontrar tus contraseñas'
                : 'Comienza agregando tu primera contraseña de forma segura'}
            </p>
          </div>
        ) : (
          filteredPasswords.map((password) => (
            <div
              key={password._id}
              className="relative group bg-gradient-to-br from-blue-50/80 via-white/90 to-purple-50/80 dark:from-blue-900/60 dark:via-gray-900/80 dark:to-purple-900/60 border border-blue-100 dark:border-blue-900 rounded-2xl shadow-xl hover:scale-[1.025] hover:shadow-2xl transition-all duration-300 overflow-hidden"
            >
              {/* Cinta de favorito */}
              {password.esFavorito && (
                <div className="absolute top-0 right-0 z-10 px-3 py-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-xs font-bold text-white rounded-bl-2xl shadow-md">
                  <Star className="inline w-4 h-4 mr-1 -mt-1" /> Favorito
                </div>
              )}

              {/* Header */}
              <div className="px-6 pt-6 pb-2 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-tr from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 rounded-xl flex items-center justify-center shadow">
                  <Lock className="w-6 h-6 text-blue-600 dark:text-blue-300 fill-current" />
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
                      className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors truncate max-w-[200px]"
                    >
                      <span className="truncate">{password.url}</span>
                      <Link2 className="w-3 h-3 flex-shrink-0" />
                    </a>
                  )}
                </div>
              </div>

              {/* Categoría */}
              <div className="px-6 mb-3">
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 text-xs font-bold rounded-full">
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
                      onClick={() => copiarAlPortapapeles(password.usuario || '', 'Usuario', password._id, password.titulo)}
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
                      onClick={() => copiarAlPortapapeles(password.email || '', 'Email', password._id, password.titulo)}
                      className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-all duration-200"
                      title="Copiar email"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Contraseña */}
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50/80 to-red-100/80 dark:from-red-900/40 dark:to-red-800/40 rounded-xl border border-red-100 dark:border-red-800">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 bg-red-100 dark:bg-red-800/50 rounded-lg flex items-center justify-center">
                      <Lock className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-red-700 dark:text-red-300 uppercase tracking-wide">Contraseña</p>
                      <p className="text-sm font-mono text-gray-900 dark:text-white">
                        {showPasswords[password._id] && passwordsReales[password._id] 
                          ? passwordsReales[password._id] 
                          : '••••••••••••'
                        }
                      </p>
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
                        onClick={() => copiarAlPortapapeles(passwordsReales[password._id] || '', 'Contraseña', password._id, password.titulo)}
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
              <div className="px-6 py-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/40 dark:to-purple-900/40 border-t border-blue-100 dark:border-blue-900 flex items-center justify-between">
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  Creado {new Date(password.fechaCreacion).toLocaleDateString('es-ES')}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleFavorito(password._id, password.esFavorito)}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      password.esFavorito 
                        ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                        : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                    }`}
                    title={password.esFavorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                  >
                    <Star className={`w-4 h-4 ${password.esFavorito ? 'fill-current' : ''}`} />
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

      {/* Modal de formulario */}
      {showModal && (
        <ModalPortal>
          <div className="fixed inset-0 h-screen w-screen z-[9999] flex items-center justify-center bg-black/60 dark:bg-black/80">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 w-full max-w-md md:max-w-lg p-4 sm:p-6 md:p-8 overflow-y-auto max-h-[90vh] flex flex-col">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-2">
                <Lock className="w-10 h-10 text-blue-600 dark:text-blue-400 drop-shadow-lg" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {editingPassword ? 'Editar Contraseña' : 'Nueva Contraseña'}
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {editingPassword ? 'Modifica los datos de tu contraseña guardada' : 'Agrega una nueva contraseña a tu bóveda'}
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
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 px-4 py-3 pl-10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 px-4 py-3 pl-10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 px-4 py-3 pl-10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 px-4 py-3 pl-10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 px-4 py-3 pl-10 pr-10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 px-4 py-3 text-gray-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
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
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
                  <Lock className="w-12 h-12 text-blue-600 dark:text-blue-400 drop-shadow-lg" />
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
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all mb-4"
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
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-60"
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

export default Passwords;
