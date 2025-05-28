import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalPortalProps {
  children: React.ReactNode; // Contenido que se mostrará dentro del modal
}

// Obtener el elemento del DOM donde se va a renderizar el modal (con id 'modal-root')
// Solo se ejecuta si estamos en un entorno de navegador (evita errores en SSR)
const modalRoot = typeof window !== 'undefined' ? document.getElementById('modal-root') : null;

export default function ModalPortal({ children }: ModalPortalProps) {
  // Hook para bloquear el scroll del body mientras el modal está abierto
  useEffect(() => {
    // Agrega clase que previene el scroll en el body
    document.body.classList.add('overflow-hidden');

    // Al desmontar el componente (cerrar modal), se elimina la clase para restaurar el scroll
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, []); // Solo se ejecuta una vez al montar y desmontar

  // Si no existe el contenedor modal-root, no renderiza nada
  if (!modalRoot) return null;

  // Renderiza los children dentro del nodo modalRoot usando createPortal
  // Esto permite que el modal se renderice fuera del árbol DOM principal, útil para manejo de z-index y estilos
  return createPortal(children, modalRoot);
}
