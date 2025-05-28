// Importa React y el tipo ReactNode para definir componentes con hijos
import React from 'react';
import type { ReactNode } from 'react';

// Importa Navigate, que se usa para redirigir al usuario a otra ruta
import { Navigate } from 'react-router-dom';

// Importa el contexto de autenticación personalizado
import { useAuth } from '../../contexts/AuthContext';

// Define los tipos de propiedades que acepta el componente
interface ProtectedRouteProps {
  children: ReactNode; // El contenido hijo que se mostrará si el usuario está autenticado
}

// Componente funcional que representa una ruta protegida
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // Usa el hook useAuth para obtener el estado de autenticación del usuario
  const { estaLogueado } = useAuth();

  // Si el usuario no está logueado, redirige a la página de login
  if (!estaLogueado) {
    return <Navigate to="/login" replace />;
  }

  // Si el usuario está autenticado, muestra el contenido hijo
  return <>{children}</>;
};

export default ProtectedRoute;
