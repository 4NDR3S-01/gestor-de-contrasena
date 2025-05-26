import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  const alternarSidebar = () => {
    setSidebarAbierto(!sidebarAbierto);
  };

  const cerrarSidebar = () => {
    setSidebarAbierto(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar para móvil - Fixed */}
      <div className="lg:hidden">
        <Sidebar 
          abierto={sidebarAbierto} 
          onCerrar={cerrarSidebar} 
        />
        
        {/* Overlay para móvil */}
        {sidebarAbierto && (
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-50"
            onClick={cerrarSidebar}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                cerrarSidebar();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Cerrar menú"
          />
        )}
      </div>

      {/* Layout para escritorio */}
      <div className="lg:flex lg:h-screen">
        {/* Sidebar para escritorio - Estático */}
        <div className="hidden lg:block lg:w-64 lg:flex-shrink-0">
          <Sidebar 
            abierto={true} 
            onCerrar={() => {}} 
          />
        </div>
        
        {/* Contenido principal */}
        <div className="flex-1 lg:flex lg:flex-col lg:overflow-hidden">
          {/* Header */}
          <Header onToggleSidebar={alternarSidebar} />
          
          {/* Contenido de la página */}
          <main className="flex-1 p-4 lg:p-8 lg:overflow-y-auto">
            {children || <Outlet />}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
