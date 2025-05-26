import React from 'react';
import { Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import UserDropdown from './UserDropdown';
import NotificationsDropdown from './NotificationsDropdown';
import StatusInfo from './StatusInfo';

interface HeaderProps {
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const location = useLocation();

  // Títulos dinámicos según ruta
  const titulos: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/passwords': 'Contraseñas',
    '/favorites': 'Favoritos',
    '/generator': 'Generador de Contraseñas',
    '/profile': 'Perfil',
  };
  const titulo = titulos[location.pathname] || '';

  return (
    <header className="sticky top-0 z-40 bg-white/70 dark:bg-gray-900/80 backdrop-blur-xl border-b border-white/20 dark:border-gray-800/60 shadow-sm lg:static lg:z-auto lg:bg-white/90 lg:dark:bg-gray-900/90">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Lado izquierdo */}
        <div className="flex items-center gap-4">
          {/* Botón de menú móvil */}
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            aria-label="Abrir menú"
          >
            <Menu size={24} />
          </button>

          {/* Título dinámico */}
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            {titulo}
          </h1>
        </div>

        {/* Centro - Información de estado (solo escritorio) */}
        <StatusInfo />

        {/* Lado derecho */}
        <div className="flex items-center gap-2">
          {/* Notificaciones */}
          <NotificationsDropdown />
          
          {/* Avatar con dropdown (escritorio y móvil) */}
          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default Header;
