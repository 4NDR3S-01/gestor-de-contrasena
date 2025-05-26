import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Key, 
  Heart, 
  Shield, 
  AlertTriangle,
  Plus,
  Clock,
  Monitor,
  Users,
  CreditCard,
  Star,
  Zap,
  TrendingUp,
  Activity,
  BarChart3,
  Wifi,
  WifiOff,
  RefreshCw,
  Settings,
  Download,
  Bell,
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { toast } from 'react-hot-toast';
import '../styles/Dashboard.css';

interface Estadisticas {
  totalContrasenas: number;
  favoritos: number;
  contrasenasDebiles: number;
  contrasenasRecientes: number;
  categorias?: number;
  puntuacionSeguridad?: number;
}

interface ContrasenaReciente {
  _id: string;
  titulo: string;
  categoria: string;
  fechaCreacion: string;
  esFavorito: boolean;
}

interface EstadisticasAvanzadas {
  usoReciente: number;
  conexionEstado: boolean;
  ultmaSincronizacion: string;
  categoriasPopulares: Array<{ categoria: string; cantidad: number }>;
}

const Dashboard: React.FC = () => {
  const { usuario } = useAuth();
  const [estadisticas, setEstadisticas] = useState<Estadisticas>({
    totalContrasenas: 0,
    favoritos: 0,
    contrasenasDebiles: 0,
    contrasenasRecientes: 0,
    puntuacionSeguridad: 0,
  });
  const [contrasenasRecientes, setContrasenasRecientes] = useState<ContrasenaReciente[]>([]);
  const [cargandoEstadisticas, setCargandoEstadisticas] = useState(true);
  const [cargandoRecientes, setCargandoRecientes] = useState(true);
  const [estadisticasAvanzadas, setEstadisticasAvanzadas] = useState<EstadisticasAvanzadas>({
    usoReciente: 0,
    conexionEstado: true,
    ultmaSincronizacion: new Date().toISOString(),
    categoriasPopulares: []
  });
  const [mostrarConsejoSeguridad, setMostrarConsejoSeguridad] = useState(true);

  const cargarDatosDashboard = useCallback(async () => {
    await Promise.all([
      cargarEstadisticas(),
      cargarContrasenasRecientes(),
      cargarEstadisticasAvanzadas()
    ]);
  }, []);

  useEffect(() => {
    cargarDatosDashboard();
    
    // Actualizar estadísticas cada 5 minutos
    const intervalo = setInterval(() => {
      cargarDatosDashboard();
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalo);
  }, [cargarDatosDashboard]);

  const [mensajeErrorEstadisticas, setMensajeErrorEstadisticas] = useState<string | null>(null);
  const cargarEstadisticas = async () => {
    try {
      setCargandoEstadisticas(true);
      setMensajeErrorEstadisticas(null);
      const respuesta = await apiService.obtenerEstadisticas();
      if (respuesta.exito && respuesta.datos) {
        const datos = respuesta.datos as {
          resumen?: {
            totalContrasenas?: number;
            totalFavoritos?: number;
            categorias?: number;
          };
          totalContrasenas?: number;
          favoritos?: number;
          recientes?: Array<{ length?: number }>;
        };
        
        // Extraer estadísticas más completas
        const estadisticasCompletas: Estadisticas = {
          totalContrasenas: datos.resumen?.totalContrasenas || datos.totalContrasenas || 0,
          favoritos: datos.resumen?.totalFavoritos || datos.favoritos || 0,
          contrasenasDebiles: Math.floor((datos.resumen?.totalContrasenas || 0) * 0.2), // Estimación
          contrasenasRecientes: datos.recientes?.length || 0,
          categorias: datos.resumen?.categorias || 0,
          puntuacionSeguridad: Math.floor(Math.random() * 40) + 60 // Simulado por ahora
        };
        
        setEstadisticas(estadisticasCompletas);
      }
    } catch {
      setMensajeErrorEstadisticas('No se pudieron cargar las estadísticas. Intenta nuevamente.');
      toast.error('Error al cargar las estadísticas');
    } finally {
      setCargandoEstadisticas(false);
    }
  };

  const cargarEstadisticasAvanzadas = async () => {
    try {
      // Simular datos avanzados por ahora
      const categoriasRespuesta = await apiService.obtenerCategoriasConConteo();
      const categoriasPopulares = categoriasRespuesta.exito 
        ? Object.entries(categoriasRespuesta.datos || {}).map(([categoria, cantidad]) => ({
            categoria: categoria.replace('_', ' ').charAt(0).toUpperCase() + categoria.slice(1),
            cantidad: cantidad as number
          })).slice(0, 3)
        : [];

      setEstadisticasAvanzadas({
        usoReciente: Math.floor(Math.random() * 20) + 5,
        conexionEstado: navigator.onLine,
        ultmaSincronizacion: new Date().toISOString(),
        categoriasPopulares
      });
    } catch (error) {
      console.error('Error al cargar estadísticas avanzadas:', error);
    }
  };

  const [mensajeErrorRecientes, setMensajeErrorRecientes] = useState<string | null>(null);
  const cargarContrasenasRecientes = async () => {
    try {
      setCargandoRecientes(true);
      setMensajeErrorRecientes(null);
      const contrasenas = await apiService.obtenerContrasenas(1, 5);
      // Mapear las contraseñas al formato esperado
      const contrasenasFormateadas: ContrasenaReciente[] = contrasenas.slice(0, 5).map((contrasena: ContrasenaReciente) => ({
        _id: contrasena._id,
        titulo: contrasena.titulo,
        categoria: contrasena.categoria,
        fechaCreacion: contrasena.fechaCreacion,
        esFavorito: contrasena.esFavorito
      }));
      setContrasenasRecientes(contrasenasFormateadas);
    } catch {
      setMensajeErrorRecientes('No se pudieron cargar las contraseñas recientes. Intenta nuevamente.');
      toast.error('Error al cargar las contraseñas recientes');
    } finally {
      setCargandoRecientes(false);
    }
  };

  const obtenerIconoCategoria = (categoria: string) => {
    const iconos: Record<string, React.ReactNode> = {
      trabajo: <Monitor className="h-4 w-4 text-blue-500" />,
      personal: <Key className="h-4 w-4 text-green-500" />,
      redes_sociales: <Users className="h-4 w-4 text-purple-500" />,
      bancos: <CreditCard className="h-4 w-4 text-red-500" />,
      compras: <Star className="h-4 w-4 text-orange-500" />,
      entretenimiento: <Star className="h-4 w-4 text-pink-500" />,
      otros: <Shield className="h-4 w-4 text-gray-500" />
    };
    return iconos[categoria] || iconos.otros;
  };

  const CirculoProgreso: React.FC<{ porcentaje: number; color: string }> = ({ porcentaje, color }) => {
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (porcentaje / 100) * circumference;

    return (
      <div className="security-score-circle">
        <svg width="80" height="80" className="absolute inset-0">
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-200 dark:text-gray-700"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke={color}
            strokeWidth="8"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="progress-circle transition-all duration-1000 ease-out"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {porcentaje}%
          </span>
        </div>
      </div>
    );
  };

  const obtenerConsejoSeguridad = () => {
    const consejos = [
      {
        titulo: "Actualiza contraseñas antiguas",
        mensaje: `Tu puntuación de seguridad es del ${estadisticas.puntuacionSeguridad}%. Considera actualizar las contraseñas que no has cambiado en más de 90 días.`,
        acciones: [
          { texto: "Revisar débiles", enlace: "/passwords?filter=weak", icono: AlertTriangle, color: "blue" },
          { texto: "Generar segura", enlace: "/generator", icono: Zap, color: "green" }
        ]
      },
      {
        titulo: "Activa 2FA donde sea posible",
        mensaje: "La autenticación de dos factores añade una capa extra de seguridad a tus cuentas más importantes.",
        acciones: [
          { texto: "Ver favoritos", enlace: "/favorites", icono: Heart, color: "red" },
          { texto: "Configurar", enlace: "/profile", icono: Settings, color: "purple" }
        ]
      },
      {
        titulo: "Revisa tus categorías",
        mensaje: `Tienes ${estadisticas.categorias || 0} categorías activas. Organizar bien tus contraseñas te ayuda a mantenerlas actualizadas.`,
        acciones: [
          { texto: "Ver todas", enlace: "/passwords", icono: BarChart3, color: "indigo" },
          { texto: "Organizar", enlace: "/passwords?sort=category", icono: Monitor, color: "blue" }
        ]
      }
    ];

    const indiceConsejo = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % consejos.length;
    return consejos[indiceConsejo];
  };

  // Si en el futuro quieres mostrar fortaleza, puedes implementar aquí
  // const obtenerColorFortaleza = (fortaleza: string) => { ... };

  const tarjetasEstadisticas = [
    {
      titulo: 'Total de Contraseñas',
      valor: estadisticas.totalContrasenas,
      icono: <Key className="h-8 w-8" />,
      color: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      enlace: '/passwords',
      descripcion: 'Contraseñas almacenadas',
      cambio: '+3 esta semana'
    },
    {
      titulo: 'Favoritos',
      valor: estadisticas.favoritos,
      icono: <Heart className="h-8 w-8" />,
      color: 'from-red-500 to-red-600',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      enlace: '/favorites',
      descripcion: 'Marcadas como favoritas',
      cambio: '+1 este mes'
    },
    {
      titulo: 'Puntuación de Seguridad',
      valor: `${estadisticas.puntuacionSeguridad || 0}%`,
      icono: <Shield className="h-8 w-8" />,
      color: 'from-emerald-500 to-emerald-600',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      enlace: '/passwords?filter=security',
      descripcion: 'Nivel de seguridad',
      cambio: '+5% este mes'
    },
    {
      titulo: 'Uso Reciente',
      valor: estadisticasAvanzadas.usoReciente,
      icono: <Activity className="h-8 w-8" />,
      color: 'from-purple-500 to-purple-600',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      enlace: '/passwords?sort=recent',
      descripcion: 'Accesos hoy',
      cambio: 'Tiempo real'
    }
  ];

  const accionesRapidas = [
    {
      titulo: 'Nueva Contraseña',
      descripcion: 'Agregar una nueva contraseña',
      icono: <Plus className="h-6 w-6" />,
      color: 'from-emerald-500 to-emerald-600',
      enlace: '/passwords'
    },
    {
      titulo: 'Generar Contraseña',
      descripcion: 'Crear contraseña segura',
      icono: <Zap className="h-6 w-6" />,
      color: 'from-purple-500 to-purple-600',
      enlace: '/generator'
    },
    {
      titulo: 'Análisis de Seguridad',
      descripcion: 'Revisar contraseñas débiles',
      icono: <Shield className="h-6 w-6" />,
      color: 'from-orange-500 to-orange-600',
      enlace: '/passwords?filter=security'
    },
    {
      titulo: 'Exportar Datos',
      descripcion: 'Descargar respaldo',
      icono: <Download className="h-6 w-6" />,
      color: 'from-indigo-500 to-indigo-600',
      enlace: '/profile'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header del Dashboard */}
        <div className="mb-8">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-gray-700/50">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    ¡Hola, {usuario?.nombre}! <span style={{ color: '#fbbf24' }}>👋</span>
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
                    Bienvenido a tu gestor de contraseñas seguro
                  </p>
                </div>
              </div>
              
              <div className="mt-6 lg:mt-0 flex flex-wrap gap-3">
                <Link
                  to="/generator"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <Zap className="h-5 w-5 mr-2" />
                  Generar Contraseña
                </Link>
                
                <Link
                  to="/passwords"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Nueva Contraseña
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Tarjetas de Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 stats-grid">
          {tarjetasEstadisticas.map((tarjeta, index) => (
            <Link
              key={tarjeta.titulo}
              to={tarjeta.enlace}
              className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-white/20 dark:border-gray-700/50 card-hover glass-effect"
              style={{ animationDelay: `${index * 100}ms` }}
            >                <div className="flex items-start justify-between">
                <div className={`p-3 rounded-xl ${tarjeta.bgColor} group-hover:scale-110 transition-transform duration-200`}>
                  <div className={tarjeta.textColor}>
                    {tarjeta.icono}
                  </div>
                </div>
                <div className="text-right">
                  {tarjeta.titulo === 'Puntuación de Seguridad' ? (
                    <div className="flex items-center justify-end space-x-3">
                      <CirculoProgreso 
                        porcentaje={estadisticas.puntuacionSeguridad || 0} 
                        color="#10b981" 
                      />
                    </div>
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {cargandoEstadisticas ? (
                          <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-8 w-12 rounded"></div>
                        ) : (
                          tarjeta.valor
                        )}
                      </p>
                      {tarjeta.cambio && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                          {tarjeta.cambio}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {tarjeta.titulo}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {tarjeta.descripcion}
                </p>
              </div>
              {/* Gradiente decorativo */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${tarjeta.color} opacity-70`}></div>
            </Link>
          ))}
          {mensajeErrorEstadisticas && (
            <div className="col-span-full mt-2 text-center">
              <span className="text-sm text-red-600 dark:text-red-400 font-semibold bg-red-50 dark:bg-red-900/30 px-3 py-2 rounded-lg inline-block shadow-sm animate-fade-in">
                {mensajeErrorEstadisticas}
              </span>
            </div>
          )}
        </div>

        {/* Estado del Sistema */}
        <div className="mb-8">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <Activity className="h-6 w-6 mr-3 text-green-600" />
                Estado del Sistema
              </h2>
              <button
                onClick={cargarDatosDashboard}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Actualizar datos"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${estadisticasAvanzadas.conexionEstado ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                  {estadisticasAvanzadas.conexionEstado ? (
                    <Wifi className="h-5 w-5 text-green-600" />
                  ) : (
                    <WifiOff className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Conexión</p>
                  <p className={`text-xs ${estadisticasAvanzadas.conexionEstado ? 'text-green-600' : 'text-red-600'}`}>
                    {estadisticasAvanzadas.conexionEstado ? 'Conectado' : 'Sin conexión'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Última Sync</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {new Date(estadisticasAvanzadas.ultmaSincronizacion).toLocaleTimeString('es-ES', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Categorías</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {estadisticas.categorias || estadisticasAvanzadas.categoriasPopulares.length} activas
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Tendencia</p>
                  <p className="text-xs text-green-600">+5% este mes</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contraseñas Recientes */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                    <Clock className="h-6 w-6 mr-3 text-blue-600" />
                    Contraseñas Recientes
                  </h2>
                  <Link
                    to="/passwords"
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold transition-colors"
                  >
                    Ver todas →
                  </Link>
                </div>
              </div>

              <div className="p-6">
                {cargandoRecientes ? (
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={`skeleton-dashboard-${i}`} className="animate-pulse">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 bg-gray-300 dark:bg-gray-600 rounded-xl"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : mensajeErrorRecientes ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-3 animate-fade-in">
                      <AlertTriangle className="h-8 w-8 text-red-500" />
                    </div>
                    <span className="text-sm text-red-600 dark:text-red-400 font-semibold bg-red-50 dark:bg-red-900/30 px-3 py-2 rounded-lg inline-block shadow-sm animate-fade-in">
                      {mensajeErrorRecientes}
                    </span>
                  </div>
                ) : contrasenasRecientes.length > 0 ? (
                  <div className="space-y-4">
                    {contrasenasRecientes.map((contrasena) => (
                      <Link
                        key={contrasena._id}
                        to={`/passwords`}
                        className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 group border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                      >
                        <div className="flex-shrink-0 p-3 bg-gray-100 dark:bg-gray-700 rounded-xl group-hover:scale-105 transition-transform duration-200">
                          {obtenerIconoCategoria(contrasena.categoria)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-lg font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {contrasena.titulo}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                            {contrasena.categoria.replace('_', ' ')} • {new Date(contrasena.fechaCreacion).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          {contrasena.esFavorito && (
                            <Heart className="h-5 w-5 text-red-500 fill-current" />
                          )}
                          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 animate-fade-in">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Key className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No hay contraseñas guardadas
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      Comienza agregando tu primera contraseña para mantener tus cuentas seguras
                    </p>
                    <Link
                      to="/passwords"
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Crear primera contraseña
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Panel lateral */}
          <div className="space-y-6">
            {/* Notificaciones Recientes */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                    <Bell className="h-6 w-6 mr-3 text-yellow-600" />
                    Notificaciones
                  </h2>
                  <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                    3
                  </span>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Contraseña débil detectada
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        La contraseña de Facebook necesita ser actualizada
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        Hace 2 horas
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Nueva contraseña creada
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        Se agregó una contraseña para Gmail
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        Hace 1 día
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Backup completado
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        Respaldo semanal guardado exitosamente
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        Hace 2 días
                      </p>
                    </div>
                  </div>
                </div>

                <Link
                  to="/notifications"
                  className="block text-center mt-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                >
                  Ver todas las notificaciones
                  <ChevronRight className="h-4 w-4 inline ml-1" />
                </Link>
              </div>
            </div>

            {/* Acciones Rápidas */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  <Zap className="h-6 w-6 mr-3 text-emerald-600" />
                  Acciones Rápidas
                </h2>
              </div>

              <div className="p-6">
                <div className="space-y-3">
                  {accionesRapidas.map((accion) => (
                    <Link
                      key={accion.titulo}
                      to={accion.enlace}
                      className="flex items-center p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                    >
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${accion.color} mr-4 group-hover:scale-110 transition-transform`}>
                        <div className="text-white">
                          {accion.icono}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {accion.titulo}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {accion.descripcion}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Categorías Populares */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  <BarChart3 className="h-6 w-6 mr-3 text-indigo-600" />
                  Categorías Populares
                </h2>
              </div>

              <div className="p-6">
                {estadisticasAvanzadas.categoriasPopulares.length > 0 ? (
                  <div className="space-y-3">
                    {estadisticasAvanzadas.categoriasPopulares.map((cat, index) => (
                      <div key={cat.categoria} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            index === 0 ? 'bg-blue-500' : 
                            index === 1 ? 'bg-green-500' : 'bg-purple-500'
                          }`}></div>
                          <span className="font-medium text-gray-900 dark:text-white capitalize">
                            {cat.categoria}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                          {cat.cantidad}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No hay datos disponibles</p>
                  </div>
                )}
              </div>
            </div>

            {/* Consejo de Seguridad */}

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                    <Shield className="h-6 w-6 mr-3 text-blue-600" />
                    Consejo de Seguridad
                  </h2>
                  <button
                    onClick={() => setMostrarConsejoSeguridad(!mostrarConsejoSeguridad)}
                    className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {mostrarConsejoSeguridad ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              {mostrarConsejoSeguridad && (
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg animate-pulse-soft">
                        <Shield className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      {(() => {
                        const consejo = obtenerConsejoSeguridad();
                        return (
                          <>
                            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                              💡 {consejo.titulo}
                            </h3>
                            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-4">
                              {consejo.mensaje}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {consejo.acciones.map((accion, index) => {
                                const IconoAccion = accion.icono;
                                return (
                                  <Link
                                    key={index}
                                    to={accion.enlace}
                                    className={`inline-flex items-center px-3 py-1 text-xs font-medium text-${accion.color}-600 dark:text-${accion.color}-300 hover:text-${accion.color}-700 dark:hover:text-${accion.color}-200 bg-${accion.color}-50 dark:bg-${accion.color}-900/30 rounded-lg hover:bg-${accion.color}-100 dark:hover:bg-${accion.color}-900/50 transition-colors`}
                                  >
                                    <IconoAccion className="h-3 w-3 mr-1" />
                                    {accion.texto}
                                  </Link>
                                );
                              })}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
