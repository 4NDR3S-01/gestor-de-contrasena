import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom'; // Para renderizar el dropdown fuera del DOM principal
import { User, LogOut, ChevronDown } from 'lucide-react'; // Íconos usados
import { Link } from 'react-router-dom'; // Para navegación interna
import { useAuth } from '../../contexts/AuthContext'; // Contexto para obtener usuario y logout

interface UserDropdownProps {
  className?: string; // Clase CSS opcional para personalización
}

const UserDropdown: React.FC<UserDropdownProps> = ({ className = '' }) => {
  // Obtener usuario y función logout desde contexto de autenticación
  const { usuario, logout } = useAuth();

  // Estado para controlar si el menú desplegable está abierto o cerrado
  const [isOpen, setIsOpen] = useState(false);

  // Estado para almacenar la posición del dropdown en la pantalla (top y right)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });

  // Referencia al botón que abre el dropdown (para obtener su posición)
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Referencia al contenedor del dropdown (para detectar clics fuera)
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Función para actualizar la posición del dropdown con base en la posición del botón
  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8, // Posicionar justo debajo del botón con margen de 8px
        right: window.innerWidth - rect.right // Distancia desde la derecha de la ventana
      });
    }
  };

  // Efecto para manejar cierre del dropdown al hacer click fuera y actualizar posición al cambiar tamaño o hacer scroll
  useEffect(() => {
    // Detecta clicks fuera del dropdown y botón para cerrarlo
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) && // No está dentro del dropdown
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) // Ni dentro del botón
      ) {
        setIsOpen(false); // Cerrar dropdown
      }
    };

    // Actualizar posición del dropdown al cambiar tamaño o al hacer scroll
    const handleResize = () => {
      if (isOpen) {
        updateDropdownPosition();
      }
    };

    if (isOpen) {
      updateDropdownPosition(); // Actualizar posición al abrir
      document.addEventListener('mousedown', handleClickOutside); // Escuchar clicks fuera
      window.addEventListener('resize', handleResize); // Escuchar cambios de tamaño ventana
      window.addEventListener('scroll', handleResize); // Escuchar scroll para reposicionar
    }

    // Limpiar listeners al cerrar o desmontar
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize);
    };
  }, [isOpen]); // Se vuelve a ejecutar si cambia el estado de apertura

  // Alternar apertura/cierre del dropdown al pulsar el botón
  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  // Función para cerrar sesión y cerrar dropdown
  const handleLogout = () => {
    setIsOpen(false);
    logout();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Botón del avatar clickeable */}
      <button
        ref={buttonRef} // Referencia para calcular posición
        onClick={handleToggle} // Abrir/cerrar dropdown
        className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Menú de usuario" // Accesibilidad
      >
        {/* Avatar con inicial del usuario */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow">
          {usuario?.nombre?.charAt(0).toUpperCase()} {/* Inicial mayúscula */}
        </div>
        {/* Flecha desplegable solo visible en pantallas grandes */}
        <ChevronDown 
          size={16} 
          className={`hidden lg:block text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : '' // Gira 180° si está abierto
          }`} 
        />
      </button>

      {/* Dropdown se renderiza usando Portal para evitar problemas con z-index */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div 
          ref={dropdownRef} // Referencia para detectar clicks fuera
          className="fixed w-56 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/60 rounded-xl shadow-2xl"
          style={{ 
            top: dropdownPosition.top, // Posición calculada
            right: dropdownPosition.right,
            zIndex: 99999
          }}
        >
          {/* Información del usuario en la parte superior */}
          <div className="px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">
                {usuario?.nombre?.charAt(0).toUpperCase()} {/* Inicial del usuario */}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {usuario?.nombre} {/* Nombre completo */}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {usuario?.email} {/* Email del usuario */}
                </p>
              </div>
            </div>
          </div>

          {/* Opciones del menú */}
          <div className="py-2">
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)} // Cerrar dropdown al navegar
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <User size={16} /> {/* Icono de usuario */}
              Ver perfil
            </Link>
          </div>

          {/* Botón para cerrar sesión */}
          <div className="border-t border-gray-200/50 dark:border-gray-700/50 py-2">
            <button
              onClick={handleLogout} // Cerrar sesión
              className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full text-left"
            >
              <LogOut size={16} /> {/* Icono de salir */}
              Cerrar sesión
            </button>
          </div>
        </div>,
        document.body // Portal renderiza en el body del documento
      )}
    </div>
  );
};

export default UserDropdown;
