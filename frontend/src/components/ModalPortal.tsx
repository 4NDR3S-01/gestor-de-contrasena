import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalPortalProps {
  children: React.ReactNode;
}

const modalRoot = typeof window !== 'undefined' ? document.getElementById('modal-root') : null;

export default function ModalPortal({ children }: ModalPortalProps) {
  useEffect(() => {
    // Evita scroll en el body cuando el modal está abierto
    document.body.classList.add('overflow-hidden');
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, []);

  if (!modalRoot) return null;
  return createPortal(children, modalRoot);
}
