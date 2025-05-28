// Importa React
import React from 'react';

// Icono del menú hamburguesa desde la librería lucide-react
import { Menu } from 'lucide-react';

// Hook para obtener la ruta actual
import { useLocation } from 'react-router-dom';

// Componentes personalizados
import UserDropdown from './UserDropdown';
import NotificationsDropdown from './NotificationsDropdown';
import StatusInfo from './StatusInfo';

// Definición de las propiedades que acepta el componente Header
interface HeaderProps {
  onToggleSidebar: () => void; // Función para abrir/cerrar el menú lateral
}

// Componente funcional Header
const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  // Hook que da acceso a la ubicación actual en la app
  const location = useLocation();

  // Diccionario para mapear rutas a títulos visibles
  const titulos: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/passwords': 'Contraseñas',
    '/favorites': 'Favoritos',
    '/generator': 'Generador de Contraseñas',
    '/profile': 'Perfil',
  };

  // Obtiene el título según la ruta actual, o cadena vacía si no está definido
  const titulo = titulos[location.pathname] || '';

  return (
    <header
      className="sticky top-0 z-40 bg-white/70 dark:bg-gray-900/80 backdrop-blur-xl 
                 border-b border-white/20 dark:border-gray-800/60 shadow-sm 
                 lg:static lg:z-auto lg:bg-white/90 lg:dark:bg-gray-900/90"
    >
      {/* Contenedor principal del header */}
      <div className="flex items-center justify-between px-4 py-3">
        
        {/* --- Sección izquierda --- */}
        <div className="flex items-center gap-4">
          
          {/* Botón de menú visible solo en móviles */}
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-gray-600 
                       hover:bg-gray-100 dark:text-gray-400 
                       dark:hover:bg-gray-700"
            aria-label="Abrir menú"
          >
            {/* Icono de menú hamburguesa */}
            <Menu size={24} />
          </button>

          {/* Título de la página según la ruta actual */}
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            {titulo}
          </h1>
        </div>

        {/* --- Sección central (solo visible en escritorio) --- */}
        <StatusInfo />

        {/* --- Sección derecha --- */}
        <div className="flex items-center gap-2">
          
          {/* Componente para mostrar notificaciones */}
          <NotificationsDropdown />
          
          {/* Dropdown con el avatar del usuario */}
          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default Header;
