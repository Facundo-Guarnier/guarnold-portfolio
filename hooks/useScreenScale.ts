import { useState, useEffect } from 'react';

// Ancho base del CV en píxeles (equivalente a 210mm A4)
const CV_WIDTH = 794;

/**
 * Hook para calcular el factor de escala basado en el ancho de la ventana.
 * Implementa un efecto "Zoom Out" para que el CV se ajuste automáticamente
 * al ancho de la pantalla sin perder su estructura A4.
 * 
 * @param margin - Margen de seguridad en píxeles (default: 30)
 * @returns El factor de escala (entre 0.2 y 1)
 */
export function useScreenScale(margin: number = 30): number {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const calculateScale = () => {
      // Calcular escala basada en el ancho de la ventana menos el margen
      const availableWidth = window.innerWidth - margin;
      let newScale = availableWidth / CV_WIDTH;
      
      // Tope máximo: no escalar más del 100%
      if (newScale > 1) {
        newScale = 1;
      }
      
      // Tope mínimo: siempre visible
      if (newScale < 0.2) {
        newScale = 0.2;
      }
      
      setScale(newScale);
    };

    // Calcular al montar
    calculateScale();

    // Escuchar cambios de tamaño de ventana
    window.addEventListener('resize', calculateScale);

    return () => {
      window.removeEventListener('resize', calculateScale);
    };
  }, [margin]);

  return scale;
}
