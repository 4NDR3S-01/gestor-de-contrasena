// Importa React y useState para manejar el estado del componente
import React, { useState } from 'react';

// Importa el componente Outlet de React Router para mostrar rutas anidadas
import { Outlet } from 'react-router-dom';

// Importa componentes propios
import Sidebar from './Sidebar';
import Header from './Header';

// Interfaz para las props opcionales del Layout
interface LayoutProps {
  children?: React.ReactNode;
}

// Componente funcional que define el layout general de la aplicación
const Layout: React.FC<LayoutProps> = ({ children }) => {
  // Estado para saber si el sidebar (en móvil) está abierto
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  // Alterna la visibilidad del sidebar (móvil)
  const alternarSidebar = () => {
    setSidebarAbierto(!sidebarAbierto);
  };

  // Cierra el sidebar (móvil)
  const cerrarSidebar = () => {
    setSidebarAbierto(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar versión móvil: se muestra solo en pantallas pequeñas */}
      <div className="lg:hidden">
        <Sidebar 
          abierto={sidebarAbierto} 
          onCerrar={cerrarSidebar} 
        />
        
        {/* Fondo oscuro (overlay) cuando el sidebar está abierto en móvil */}
        {sidebarAbierto && (
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-50"
            onClick={cerrarSidebar} // Cierra el sidebar si se hace clic fuera
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                cerrarSidebar(); // Cierra el sidebar si se presiona ESC
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Cerrar menú"
          />
        )}
      </div>

      {/* Layout versión escritorio */}
      <div className="lg:flex lg:h-screen">
        {/* Sidebar permanente en pantallas grandes */}
        <div className="hidden lg:block lg:w-64 lg:flex-shrink-0">
          <Sidebar 
            abierto={true} 
            onCerrar={() => {}} // No se necesita cerrar en escritorio
          />
        </div>
        
        {/* Área principal: Header + contenido */}
        <div className="flex-1 lg:flex lg:flex-col lg:overflow-hidden">
          {/* Barra superior */}
          <Header onToggleSidebar={alternarSidebar} />
          
          {/* Área de contenido de la página */}
          <main className="flex-1 p-4 lg:p-8 lg:overflow-y-auto">
            {/* Renderiza los hijos o el componente de la ruta activa */}
            {children || <Outlet />}
          </main>
        </div>
      </div>
    </div>
  );
};

// Exporta el componente para ser usado en App.tsx u otras rutas
export default Layout;
