// Importaciones de React y librerías necesarias
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom'; // Para renderizar el dropdown fuera del DOM principal
import { Bell, AlertCircle, CheckCircle, Info, X } from 'lucide-react'; // Iconos

// Importa el contexto personalizado de notificaciones
import { useNotificaciones } from '../../contexts/NotificacionesContext';

// Props del componente
interface NotificationsDropdownProps {
  className?: string;
}

// Componente principal del dropdown de notificaciones
const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({ className = '' }) => {
  // Estado para mostrar u ocultar el dropdown
  const [isOpen, setIsOpen] = useState(false);

  // Estado para guardar la posición dinámica del dropdown
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });

  // Refs para los elementos del botón e interfaz del dropdown
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Accede al contexto de notificaciones
  const {
    notificaciones,
    notificacionesNoLeidas,
    marcarComoLeida,
    marcarTodasComoLeidas,
    eliminarNotificacion
  } = useNotificaciones();

  // Actualiza la posición del dropdown al abrir
  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect(); // Obtiene la posición del botón
      setDropdownPosition({
        top: rect.bottom + 8, // Muestra el dropdown 8px debajo del botón
        right: window.innerWidth - rect.right // Ajusta a la derecha de la pantalla
      });
    }
  };

  // Cierra el dropdown si se hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false); // Cierra si se hace clic fuera
      }
    };

    // Recalcula la posición si se redimensiona o desplaza la ventana
    const handleResize = () => {
      if (isOpen) updateDropdownPosition();
    };

    // Se ejecuta al abrir el dropdown
    if (isOpen) {
      updateDropdownPosition();
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleResize);
    }

    // Limpia los listeners cuando se cierra el dropdown
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize);
    };
  }, [isOpen]);

  // Función para mostrar el tiempo de forma amigable
  const formatTime = (fecha: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - fecha.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins} min`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} h`;
    return `${Math.floor(diffMins / 1440)} días`;
  };

  // Devuelve el icono según el tipo de notificación
  const getIcono = (tipo: 'success' | 'warning' | 'error' | 'info') => {
    switch (tipo) {
      case 'success':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'warning':
        return <AlertCircle size={16} className="text-yellow-500" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return <Info size={16} className="text-blue-500" />;
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Botón de campana con contador de notificaciones */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
        title="Notificaciones"
      >
        <Bell size={20} />
        {notificacionesNoLeidas > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {notificacionesNoLeidas > 9 ? '9+' : notificacionesNoLeidas}
          </span>
        )}
      </button>

      {/* Dropdown renderizado en un portal */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed w-80 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/20 dark:border-gray-700/60 rounded-xl shadow-2xl max-h-96 overflow-hidden"
          style={{ 
            top: dropdownPosition.top,
            right: dropdownPosition.right,
            zIndex: 99999
          }}
        >
          {/* Encabezado del dropdown */}
          <div className="px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Notificaciones
              </h3>
              {notificacionesNoLeidas > 0 && (
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  {notificacionesNoLeidas} nueva{notificacionesNoLeidas !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Lista de notificaciones */}
          <div className="max-h-64 overflow-y-auto">
            {notificaciones.length === 0 ? (
              // Estado sin notificaciones
              <div className="px-4 py-8 text-center">
                <Bell size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No tienes notificaciones
                </p>
              </div>
            ) : (
              // Renderiza cada notificación
              notificaciones.map((notificacion) => (
                <div
                  key={notificacion.id}
                  className={`px-4 py-3 border-b border-gray-200/30 dark:border-gray-700/30 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                    !notificacion.leida ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icono de tipo */}
                    <div className="flex-shrink-0 mt-0.5">
                      {getIcono(notificacion.tipo as 'success' | 'warning' | 'error' | 'info')}
                    </div>

                    {/* Información de la notificación */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          {/* Título */}
                          <p className={`text-sm font-medium ${
                            !notificacion.leida 
                              ? 'text-gray-900 dark:text-white' 
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {notificacion.titulo}
                          </p>

                          {/* Mensaje */}
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {notificacion.mensaje}
                          </p>

                          {/* Fecha formateada */}
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {formatTime(notificacion.fecha)}
                          </p>
                        </div>

                        {/* Botón para eliminar notificación */}
                        <button
                          onClick={() => eliminarNotificacion(notificacion.id)}
                          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          title="Eliminar notificación"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      {/* Botón para marcar como leída */}
                      {!notificacion.leida && (
                        <button
                          onClick={() => marcarComoLeida(notificacion.id)}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
                        >
                          Marcar como leída
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pie de dropdown: opción para marcar todas como leídas */}
          {notificaciones.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200/50 dark:border-gray-700/50">
              <button
                onClick={marcarTodasComoLeidas}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium w-full text-center"
              >
                Marcar todas como leídas
              </button>
            </div>
          )}
        </div>,
        document.body // El portal se monta directamente en el body del documento
      )}
    </div>
  );
};

// Exporta el componente para usarlo en el header u otras partes del layout
export default NotificationsDropdown;
