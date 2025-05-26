import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Key, 
  Heart, 
  Shuffle, 
  User, 
  X,
  Shield,
  Sun,
  Moon,
  // LogOut
} from 'lucide-react';
// import { useAuth } from '../../contexts/AuthContext';
import { useTema } from '../../contexts/TemaContext';

interface SidebarProps {
  abierto: boolean;
  onCerrar: () => void;
}


const Sidebar: React.FC<SidebarProps> = ({ abierto, onCerrar }) => {
  // const { usuario, logout } = useAuth();
  const { tema, alternarTema } = useTema();
  const navegacionItems = [
    {
      nombre: 'Dashboard',
      href: '/dashboard',
      icono: LayoutDashboard,
    },
    {
      nombre: 'Contraseñas',
      href: '/passwords',
      icono: Key,
    },
    {
      nombre: 'Favoritos',
      href: '/favorites',
      icono: Heart,
    },
    {
      nombre: 'Generador',
      href: '/generator',
      icono: Shuffle,
    },
    {
      nombre: 'Perfil',
      href: '/profile',
      icono: User,
    },
  ];

  return (
    <>
      {/* Sidebar */}
      <div className={`
        w-64 bg-white/70 dark:bg-gray-900/80 shadow-2xl backdrop-blur-xl border-r border-white/20 dark:border-gray-800/60
        lg:h-full lg:shadow-none lg:border-r-gray-200 lg:dark:border-r-gray-700 lg:relative
        ${!abierto ? 'lg:block hidden' : 'lg:block'}
        ${abierto ? 'fixed inset-y-0 left-0 z-50 h-full lg:relative lg:z-auto transform translate-x-0' : 'fixed inset-y-0 left-0 z-50 h-full lg:relative lg:z-auto transform -translate-x-full lg:translate-x-0'}
        transition-transform duration-300 ease-in-out lg:transition-none
        flex flex-col
      `}>
        {/* Logo y nombre */}
        <div className="flex items-center justify-between p-5 border-b border-white/20 dark:border-gray-800/60 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Shield className="w-9 h-9 text-blue-600 dark:text-blue-400 drop-shadow-lg" />
            <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-700 via-purple-600 to-indigo-500 bg-clip-text text-transparent tracking-tight select-none">
              Boveda virtual
            </span>
          </div>
          {/* Botón cerrar sidebar móvil */}
          <button
            onClick={onCerrar}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            aria-label="Cerrar menú"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navegación - Scrollable */}
        <nav className="flex-1 overflow-y-auto mt-6 px-4 lg:pb-32">
          <ul className="space-y-2 pb-6">
            {navegacionItems.map((item) => {
              const Icono = item.icono;
              return (
                <li key={item.nombre}>
                  <NavLink
                    to={item.href}
                    onClick={() => {
                      // Solo cerrar sidebar en móvil
                      if (window.innerWidth < 1024) {
                        onCerrar();
                      }
                    }}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-all duration-200
                      ${isActive
                        ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white shadow-lg scale-105'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-gray-800/60 hover:scale-105'}
                    `}
                  >
                    <Icono size={22} />
                    <span>{item.nombre}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer del sidebar */}
        <div className="flex-shrink-0 lg:absolute lg:bottom-0 lg:left-0 lg:right-0 p-5 border-t border-white/20 dark:border-gray-800/60 bg-white/60 dark:bg-gray-900/70 backdrop-blur-xl">
          {/* Botón de tema */}
          <button
            onClick={alternarTema}
            className="w-full flex items-center justify-center gap-2 py-2 mb-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold shadow hover:scale-105 transition-all"
            title={tema === 'claro' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
          >
            {tema === 'claro' ? <Moon size={18} /> : <Sun size={18} />}
            {tema === 'claro' ? 'Modo Oscuro' : 'Modo Claro'}
          </button>
          {/* Usuario y logout */}
          {/* <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow">
                {usuario?.nombre?.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[100px]">{usuario?.nombre}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[100px]">{usuario?.email}</span>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={20} />
            </button>
          </div> */}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
