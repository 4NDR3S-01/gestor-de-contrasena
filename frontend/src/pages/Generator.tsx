import React, { useState, useEffect } from 'react';
import { Shuffle, Copy, RefreshCw, Settings, Shield, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiService } from '../services/api';
import { syncEvents } from '../utils/syncEvents';

interface OpcionesGenerador {
  longitud: number;
  incluirMayusculas: boolean;
  incluirMinusculas: boolean;
  incluirNumeros: boolean;
  incluirSimbolos: boolean;
  excluirCaracteresAmbiguos: boolean;
}


const Generator: React.FC = () => {
  const [contrasenaGenerada, setContrasenaGenerada] = useState<string>('');
  const [fortaleza, setFortaleza] = useState<{ fortaleza: string; puntuacion: number; sugerencias: string[] } | null>(null);
  const [opciones, setOpciones] = useState<OpcionesGenerador>({
    longitud: 16,
    incluirMayusculas: true,
    incluirMinusculas: true,
    incluirNumeros: true,
    incluirSimbolos: true,
    excluirCaracteresAmbiguos: false,
  });
  const [cargando, setCargando] = useState(false);
  const [historial, setHistorial] = useState<string[]>([]);

  useEffect(() => {
    generarContrasena();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (contrasenaGenerada) {
      verificarFortaleza();
    }
  }, [contrasenaGenerada]); // eslint-disable-line react-hooks/exhaustive-deps

  const generarContrasena = async () => {
    try {
      setCargando(true);
      const respuesta = await apiService.generarContrasena(opciones);
      
      if (respuesta.exito && respuesta.datos) {
        setContrasenaGenerada(respuesta.datos.contrasena);
        // Agregar al historial
        setHistorial(prev => [respuesta.datos!.contrasena, ...prev.slice(0, 4)]);
      }
    } catch {
      toast.error('Error al generar contraseña');
    } finally {
      setCargando(false);
    }
  };

  const verificarFortaleza = async () => {
    try {
      const respuesta = await apiService.verificarFortalezaContrasena(contrasenaGenerada);
      if (respuesta.exito && respuesta.datos) {
        setFortaleza(respuesta.datos);
      }
    } catch (error) {
      console.error('Error al verificar fortaleza:', error);
    }
  };

  const copiarAlPortapapeles = async (contrasena: string) => {
    try {
      await navigator.clipboard.writeText(contrasena);
      toast.success('Contraseña copiada al portapapeles');
      
      // Emitir evento de contraseña generada y copiada
      syncEvents.emit('PASSWORD_COPIED', { sitio: 'Generador de Contraseñas' });
    } catch {
      toast.error('Error al copiar al portapapeles');
    }
  };

  const actualizarOpcion = (clave: keyof OpcionesGenerador, valor: boolean | number) => {
    setOpciones(prev => ({
      ...prev,
      [clave]: valor
    }));
  };

  const obtenerColorFortaleza = (fortaleza: string) => {
    switch (fortaleza.toLowerCase()) {
      case 'muy débil':
      case 'débil':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'media':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'fuerte':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'muy fuerte':
        return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const obtenerPorcentajeFortaleza = (puntuacion: number) => {
    return Math.min(100, Math.max(0, puntuacion));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 transition-colors duration-300">
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/10 to-pink-500/10 dark:from-purple-600/20 dark:to-pink-600/20 rounded-3xl -z-10" />
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/50 p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg ring-4 ring-white/10">
                    <Shuffle className="w-8 h-8 text-white drop-shadow-sm" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                    <RefreshCw className="w-3 h-3 text-white" />
                  </div>
                </div>
                
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Generador de Contraseñas
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Crea contraseñas seguras y personalizadas para proteger tus cuentas
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-full text-sm font-medium">
                  Seguridad Avanzada
                </span>
                <button
                  onClick={generarContrasena}
                  disabled={cargando}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg"
                >
                  <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
                  Generar Nueva
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Panel de contraseña generada */}
          <div className="lg:col-span-2 space-y-8">
            {/* Contraseña principal */}
            <div className="relative group bg-gradient-to-br from-purple-50/80 via-white/90 to-pink-50/80 dark:from-purple-900/60 dark:via-gray-900/80 dark:to-pink-900/60 border border-purple-100 dark:border-purple-900 rounded-2xl shadow-xl hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 overflow-hidden">
              {/* Header */}
              <div className="px-6 pt-6 pb-2 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-tr from-purple-200 to-pink-200 dark:from-purple-800 dark:to-pink-800 rounded-xl flex items-center justify-center shadow">
                  <Shield className="w-6 h-6 text-purple-600 dark:text-purple-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                    Contraseña Generada
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Tu nueva contraseña segura
                  </p>
                </div>
              </div>

              {/* Contenido */}
              <div className="px-6 pb-4 space-y-4">
                {/* Contraseña */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50/80 to-indigo-100/80 dark:from-indigo-900/40 dark:to-indigo-800/40 rounded-xl border border-indigo-100 dark:border-indigo-800">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-800/50 rounded-lg flex items-center justify-center">
                      <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">Contraseña</p>
                      <div className="text-lg font-mono text-gray-900 dark:text-white break-all leading-relaxed">
                        {contrasenaGenerada || 'Generando...'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => copiarAlPortapapeles(contrasenaGenerada)}
                    disabled={!contrasenaGenerada}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Copiar contraseña"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>

                {/* Indicador de fortaleza */}
                {fortaleza && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Fortaleza de la contraseña
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${obtenerColorFortaleza(fortaleza.fortaleza)}`}>
                        {fortaleza.fortaleza}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-3 rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${obtenerPorcentajeFortaleza(fortaleza.puntuacion)}%`,
                          backgroundColor: fortaleza.puntuacion >= 80 ? '#10b981' : 
                                         fortaleza.puntuacion >= 60 ? '#f59e0b' : '#ef4444'
                        }}
                      />
                    </div>

                    {fortaleza.sugerencias.length > 0 && (
                      <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 rounded-lg px-3 py-3">
                        <p className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-2">
                          💡 Sugerencias de mejora:
                        </p>
                        <ul className="space-y-1">
                          {fortaleza.sugerencias.map((sugerencia, index) => (
                            <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                              <span className="text-amber-500 mt-0.5 font-bold">•</span>
                              {sugerencia}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/40 dark:to-pink-900/40 border-t border-purple-100 dark:border-purple-900 flex items-center justify-between">
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  Longitud: {opciones.longitud} caracteres
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={generarContrasena}
                    disabled={cargando}
                    className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-all duration-200 disabled:opacity-50"
                    title="Generar nueva contraseña"
                  >
                    <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => copiarAlPortapapeles(contrasenaGenerada)}
                    disabled={!contrasenaGenerada}
                    className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-all duration-200 disabled:opacity-50"
                    title="Copiar contraseña"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Historial */}
            {historial.length > 0 && (
              <div className="relative group bg-gradient-to-br from-blue-50/80 via-white/90 to-cyan-50/80 dark:from-blue-900/60 dark:via-gray-900/80 dark:to-cyan-900/60 border border-blue-100 dark:border-blue-900 rounded-2xl shadow-xl hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 overflow-hidden">
                {/* Header */}
                <div className="px-6 pt-6 pb-2 flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-tr from-blue-200 to-cyan-200 dark:from-blue-800 dark:to-cyan-800 rounded-xl flex items-center justify-center shadow">
                    <RefreshCw className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                      Historial Reciente
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Tus últimas contraseñas generadas
                    </p>
                  </div>
                </div>

                {/* Contenido */}
                <div className="px-6 pb-4 space-y-3">
                  {historial.map((contrasena, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50/80 to-slate-100/80 dark:from-slate-900/40 dark:to-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800/50 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{index + 1}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Contraseña #{index + 1}</p>
                          <span className="text-sm font-mono text-gray-900 dark:text-white break-all leading-relaxed">
                            {contrasena}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => copiarAlPortapapeles(contrasena)}
                        className="p-1 text-gray-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-900/30 rounded-lg transition-all duration-200"
                        title="Copiar contraseña"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/40 dark:to-cyan-900/40 border-t border-blue-100 dark:border-blue-900 flex items-center justify-between">
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    {historial.length} contraseña{historial.length !== 1 ? 's' : ''} en el historial
                  </div>
                </div>
              </div>
            )}
        </div>

        {/* Panel de configuración */}
        <div className="space-y-8">
          <div className="relative group bg-gradient-to-br from-emerald-50/80 via-white/90 to-teal-50/80 dark:from-emerald-900/60 dark:via-gray-900/80 dark:to-teal-900/60 border border-emerald-100 dark:border-emerald-900 rounded-2xl shadow-xl hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-6 pb-2 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-tr from-emerald-200 to-teal-200 dark:from-emerald-800 dark:to-teal-800 rounded-xl flex items-center justify-center shadow">
                <Settings className="w-6 h-6 text-emerald-600 dark:text-emerald-300" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                  Configuración
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Personaliza tu contraseña
                </p>
              </div>
            </div>

            {/* Contenido */}
            <div className="px-6 pb-4 space-y-6">
              {/* Longitud */}
              <div className="p-4 bg-gradient-to-r from-indigo-50/80 to-indigo-100/80 dark:from-indigo-900/40 dark:to-indigo-800/40 rounded-xl border border-indigo-100 dark:border-indigo-800">
                <label className="block text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-3">
                  Longitud: {opciones.longitud} caracteres
                </label>
                <input
                  type="range"
                  min="4"
                  max="50"
                  value={opciones.longitud}
                  onChange={(e) => actualizarOpcion('longitud', parseInt(e.target.value))}
                  className="w-full h-3 bg-indigo-200 dark:bg-indigo-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-indigo-600 dark:text-indigo-400 mt-2 font-medium">
                  <span>4</span>
                  <span>50</span>
                </div>
              </div>

              {/* Opciones de caracteres */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  Incluir caracteres:
                </h4>
                
                <div className="space-y-3">
                  <label className="flex items-center p-3 bg-gradient-to-r from-blue-50/80 to-blue-100/80 dark:from-blue-900/40 dark:to-blue-800/40 rounded-xl border border-blue-100 dark:border-blue-800 cursor-pointer hover:bg-blue-100/80 dark:hover:bg-blue-900/60 transition-all">
                    <input
                      type="checkbox"
                      checked={opciones.incluirMayusculas}
                      onChange={(e) => actualizarOpcion('incluirMayusculas', e.target.checked)}
                      className="w-5 h-5 text-blue-600 bg-white border-2 border-blue-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-blue-600"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Letras mayúsculas (A-Z)
                    </span>
                  </label>

                  <label className="flex items-center p-3 bg-gradient-to-r from-green-50/80 to-green-100/80 dark:from-green-900/40 dark:to-green-800/40 rounded-xl border border-green-100 dark:border-green-800 cursor-pointer hover:bg-green-100/80 dark:hover:bg-green-900/60 transition-all">
                    <input
                      type="checkbox"
                      checked={opciones.incluirMinusculas}
                      onChange={(e) => actualizarOpcion('incluirMinusculas', e.target.checked)}
                      className="w-5 h-5 text-green-600 bg-white border-2 border-green-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-green-600"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Letras minúsculas (a-z)
                    </span>
                  </label>

                  <label className="flex items-center p-3 bg-gradient-to-r from-orange-50/80 to-orange-100/80 dark:from-orange-900/40 dark:to-orange-800/40 rounded-xl border border-orange-100 dark:border-orange-800 cursor-pointer hover:bg-orange-100/80 dark:hover:bg-orange-900/60 transition-all">
                    <input
                      type="checkbox"
                      checked={opciones.incluirNumeros}
                      onChange={(e) => actualizarOpcion('incluirNumeros', e.target.checked)}
                      className="w-5 h-5 text-orange-600 bg-white border-2 border-orange-300 rounded focus:ring-orange-500 dark:focus:ring-orange-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-orange-600"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Números (0-9)
                    </span>
                  </label>

                  <label className="flex items-center p-3 bg-gradient-to-r from-red-50/80 to-red-100/80 dark:from-red-900/40 dark:to-red-800/40 rounded-xl border border-red-100 dark:border-red-800 cursor-pointer hover:bg-red-100/80 dark:hover:bg-red-900/60 transition-all">
                    <input
                      type="checkbox"
                      checked={opciones.incluirSimbolos}
                      onChange={(e) => actualizarOpcion('incluirSimbolos', e.target.checked)}
                      className="w-5 h-5 text-red-600 bg-white border-2 border-red-300 rounded focus:ring-red-500 dark:focus:ring-red-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-red-600"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Símbolos (!@#$%^&*)
                    </span>
                  </label>

                  <label className="flex items-center p-3 bg-gradient-to-r from-purple-50/80 to-purple-100/80 dark:from-purple-900/40 dark:to-purple-800/40 rounded-xl border border-purple-100 dark:border-purple-800 cursor-pointer hover:bg-purple-100/80 dark:hover:bg-purple-900/60 transition-all">
                    <input
                      type="checkbox"
                      checked={opciones.excluirCaracteresAmbiguos}
                      onChange={(e) => actualizarOpcion('excluirCaracteresAmbiguos', e.target.checked)}
                      className="w-5 h-5 text-purple-600 bg-white border-2 border-purple-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-purple-600"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Excluir caracteres ambiguos (0, O, l, I)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/40 dark:to-teal-900/40 border-t border-emerald-100 dark:border-emerald-900">
              <button
                onClick={generarContrasena}
                disabled={cargando}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
              >
                <Shuffle className={`w-5 h-5 ${cargando ? 'animate-spin' : ''}`} />
                {cargando ? 'Generando...' : 'Generar Contraseña'}
              </button>
            </div>
          </div>

          {/* Consejos de seguridad */}
          <div className="relative group bg-gradient-to-br from-green-50/80 via-white/90 to-emerald-50/80 dark:from-green-900/60 dark:via-gray-900/80 dark:to-emerald-900/60 border border-green-100 dark:border-green-900 rounded-2xl shadow-xl hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-6 pb-2 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-tr from-green-200 to-emerald-200 dark:from-green-800 dark:to-emerald-800 rounded-xl flex items-center justify-center shadow">
                <Shield className="w-6 h-6 text-green-600 dark:text-green-300" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                  Consejos de Seguridad
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Buenas prácticas
                </p>
              </div>
            </div>

            {/* Contenido */}
            <div className="px-6 pb-4 space-y-3">
              <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-emerald-50/80 to-emerald-100/80 dark:from-emerald-900/40 dark:to-emerald-800/40 rounded-xl border border-emerald-100 dark:border-emerald-800">
                <Check className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  Usa al menos 12 caracteres para mayor seguridad
                </span>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-blue-50/80 to-blue-100/80 dark:from-blue-900/40 dark:to-blue-800/40 rounded-xl border border-blue-100 dark:border-blue-800">
                <Check className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  Combina letras, números y símbolos
                </span>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-purple-50/80 to-purple-100/80 dark:from-purple-900/40 dark:to-purple-800/40 rounded-xl border border-purple-100 dark:border-purple-800">
                <Check className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  Evita información personal obvia
                </span>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-orange-50/80 to-orange-100/80 dark:from-orange-900/40 dark:to-orange-800/40 rounded-xl border border-orange-100 dark:border-orange-800">
                <Check className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  Usa contraseñas únicas para cada cuenta
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/40 dark:to-emerald-900/40 border-t border-green-100 dark:border-green-900 flex items-center justify-center">
              <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-2">
                <Shield className="w-3 h-3" />
                Mantén tus contraseñas seguras
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Generator;
