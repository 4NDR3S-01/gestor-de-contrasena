import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { ContextoTema, Tema } from '../types/index';

// Crear el contexto
const TemaContext = createContext<ContextoTema | undefined>(undefined);

// Hook para usar el contexto
export const useTema = (): ContextoTema => {
  const contexto = useContext(TemaContext);
  if (!contexto) {
    throw new Error('useTema debe ser usado dentro de un TemaProvider');
  }
  return contexto;
};

// Provider del contexto
interface TemaProviderProps {
  children: ReactNode;
}

export const TemaProvider: React.FC<TemaProviderProps> = ({ children }) => {
  const [tema, setTema] = useState<Tema>(() => {
    // Verificar si hay una preferencia guardada
    const temaGuardado = localStorage.getItem('tema') as Tema;
    if (temaGuardado) {
      return temaGuardado;
    }

    // Si no hay preferencia guardada, usar la preferencia del sistema
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'oscuro';
    }

    return 'claro';
  });

  // Aplicar el tema al elemento HTML
  useEffect(() => {
    const root = window.document.documentElement;
    
    if (tema === 'oscuro') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Guardar la preferencia
    localStorage.setItem('tema', tema);
  }, [tema]);

  // Escuchar cambios en la preferencia del sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const manejarCambio = (e: MediaQueryListEvent) => {
      // Solo cambiar automáticamente si no hay preferencia guardada
      if (!localStorage.getItem('tema')) {
        setTema(e.matches ? 'oscuro' : 'claro');
      }
    };

    mediaQuery.addEventListener('change', manejarCambio);
    
    return () => mediaQuery.removeEventListener('change', manejarCambio);
  }, []);

  const alternarTema = () => {
    setTema(temaActual => temaActual === 'claro' ? 'oscuro' : 'claro');
  };

  const valor: ContextoTema = {
    tema,
    alternarTema,
  };

  return (
    <TemaContext.Provider value={valor}>
      {children}
    </TemaContext.Provider>
  );
};
