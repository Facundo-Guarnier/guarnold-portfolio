import { useState, useEffect, useCallback, RefObject } from 'react';

// Dimensiones A4 a 96 DPI
const A4_WIDTH = 794; // 210mm
const A4_MIN_HEIGHT = 1123; // 297mm

interface UsePDFScaleOptions {
  /** Margen horizontal en píxeles para que no toque los bordes */
  horizontalPadding?: number;
  /** Si se debe permitir escalar más del 100% */
  allowScaleUp?: boolean;
}

interface UsePDFScaleReturn {
  scale: number;
  scaledHeight: number;
  a4Width: number;
  a4MinHeight: number;
}

/**
 * Hook para calcular el factor de escala de un documento A4
 * Similar a un visor de PDF
 * 
 * @param containerRef - Referencia al contenedor padre que define el ancho disponible
 * @param options - Opciones de configuración
 */
export function usePDFScale(
  containerRef: RefObject<HTMLElement | null>,
  options: UsePDFScaleOptions = {}
): UsePDFScaleReturn {
  const { horizontalPadding = 32, allowScaleUp = false } = options;
  
  const [scale, setScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState(A4_MIN_HEIGHT);

  const calculateScale = useCallback(() => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    const availableWidth = containerWidth - horizontalPadding;
    
    let newScale = availableWidth / A4_WIDTH;
    
    // No escalar más del 100% a menos que se permita
    if (!allowScaleUp) {
      newScale = Math.min(newScale, 1);
    }
    
    // Mínimo 0.2 para que siempre sea visible
    newScale = Math.max(newScale, 0.2);

    setScale(newScale);
    setScaledHeight(A4_MIN_HEIGHT * newScale);
  }, [containerRef, horizontalPadding, allowScaleUp]);

  useEffect(() => {
    calculateScale();

    const handleResize = () => {
      calculateScale();
    };

    window.addEventListener('resize', handleResize);
    
    // Observer para detectar cambios en el contenedor
    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, [calculateScale, containerRef]);

  return {
    scale,
    scaledHeight,
    a4Width: A4_WIDTH,
    a4MinHeight: A4_MIN_HEIGHT,
  };
}
