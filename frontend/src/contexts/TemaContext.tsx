import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { ContextoTema, Tema } from '../types/index';

// Crear un contexto para el tema (oscuro o claro)
// Inicialmente es undefined, se usará para proveer y consumir el estado del tema
const TemaContext = createContext<ContextoTema | undefined>(undefined);

// Hook personalizado para usar el contexto Tema
// Lanza un error si se usa fuera del provider, para evitar errores silenciosos
export const useTema = (): ContextoTema => {
  const contexto = useContext(TemaContext);
  if (!contexto) {
    throw new Error('useTema debe ser usado dentro de un TemaProvider');
  }
  return contexto;
};

// Props que recibe el provider, que es un contenedor para proveer el contexto
interface TemaProviderProps {
  children: ReactNode;
}

// Componente Provider que provee el estado y funciones del tema a sus hijos
export const TemaProvider: React.FC<TemaProviderProps> = ({ children }) => {
  // Estado local para el tema, con valor inicial obtenido de:
  // 1) Preferencia guardada en localStorage
  // 2) Preferencia del sistema (modo oscuro)
  // 3) Por defecto modo claro
  const [tema, setTema] = useState<Tema>(() => {
    const temaGuardado = localStorage.getItem('tema') as Tema;
    if (temaGuardado) {
      return temaGuardado;
    }

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'oscuro';
    }

    return 'claro';
  });

  // useEffect para aplicar la clase CSS correspondiente al tema actual
  // y guardar la preferencia en localStorage cada vez que cambia el tema
  useEffect(() => {
    const root = window.document.documentElement;

    if (tema === 'oscuro') {
      root.classList.add('dark');  // Añadir clase para modo oscuro
    } else {
      root.classList.remove('dark'); // Remover clase para modo claro
    }

    // Guardar preferencia en localStorage para persistirla
    localStorage.setItem('tema', tema);
  }, [tema]);

  // useEffect para escuchar cambios en la preferencia del sistema operativo
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // Función que maneja cambios en la preferencia del sistema
    const manejarCambio = (e: MediaQueryListEvent) => {
      // Cambiar el tema solo si no hay preferencia guardada en localStorage
      if (!localStorage.getItem('tema')) {
        setTema(e.matches ? 'oscuro' : 'claro');
      }
    };

    // Añadir listener para cambios en la preferencia del sistema
    mediaQuery.addEventListener('change', manejarCambio);

    // Limpiar listener cuando el componente se desmonta
    return () => mediaQuery.removeEventListener('change', manejarCambio);
  }, []);

  // Función para alternar el tema entre claro y oscuro
  const alternarTema = () => {
    setTema(temaActual => temaActual === 'claro' ? 'oscuro' : 'claro');
  };

  // Valor que se pasa en el contexto: estado actual y función para cambiarlo
  const valor: ContextoTema = {
    tema,
    alternarTema,
  };

  // Proveer el contexto a los componentes hijos
  return (
    <TemaContext.Provider value={valor}>
      {children}
    </TemaContext.Provider>
  );
};
