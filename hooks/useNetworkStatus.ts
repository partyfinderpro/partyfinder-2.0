'use client';

import { useState, useEffect, useCallback } from 'react';

interface NetworkStatus {
  online: boolean;
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g' | 'unknown';
  downlink: number; // Mbps
  rtt: number; // Round-trip time en ms
  saveData: boolean;
  type: string; // wifi, cellular, ethernet, etc.
}

interface NetworkInformation extends EventTarget {
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g';
  downlink: number;
  rtt: number;
  saveData: boolean;
  type?: string;
  addEventListener(type: 'change', listener: () => void): void;
  removeEventListener(type: 'change', listener: () => void): void;
}

declare global {
  interface Navigator {
    connection?: NetworkInformation;
    mozConnection?: NetworkInformation;
    webkitConnection?: NetworkInformation;
  }
}

const getConnection = (): NetworkInformation | null => {
  if (typeof navigator === 'undefined') return null;
  return navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
};

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    online: true,
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    saveData: false,
    type: 'unknown',
  });

  const updateStatus = useCallback(() => {
    const connection = getConnection();
    
    setStatus({
      online: typeof navigator !== 'undefined' ? navigator.onLine : true,
      effectiveType: connection?.effectiveType || '4g',
      downlink: connection?.downlink || 10,
      rtt: connection?.rtt || 50,
      saveData: connection?.saveData || false,
      type: connection?.type || 'unknown',
    });
  }, []);

  useEffect(() => {
    // Estado inicial
    updateStatus();

    // Listeners
    const connection = getConnection();

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    connection?.addEventListener('change', updateStatus);

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      connection?.removeEventListener('change', updateStatus);
    };
  }, [updateStatus]);

  return status;
}

// Hook simplificado para saber si la conexión es lenta
export function useIsSlowConnection(): boolean {
  const { effectiveType, saveData, rtt } = useNetworkStatus();
  
  return (
    saveData ||
    effectiveType === '2g' ||
    effectiveType === 'slow-2g' ||
    rtt > 500
  );
}

// Hook para ajustar features según conexión
export function useAdaptiveFeatures() {
  const { effectiveType, saveData, online } = useNetworkStatus();
  const isSlowConnection = useIsSlowConnection();

  return {
    // Deshabilitar animaciones en conexiones lentas
    enableAnimations: !isSlowConnection && online,
    
    // Calidad de imagen sugerida
    imageQuality: saveData ? 40 : isSlowConnection ? 60 : 80,
    
    // Prefetch habilitado solo en conexiones rápidas
    enablePrefetch: effectiveType === '4g' && !saveData,
    
    // Autoplay de videos solo en 4G sin save-data
    enableVideoAutoplay: effectiveType === '4g' && !saveData && online,
    
    // Cantidad de items a pre-cargar
    prefetchCount: isSlowConnection ? 2 : 5,
    
    // Mostrar indicador de conexión lenta
    showSlowConnectionWarning: isSlowConnection && online,
    
    // Offline mode
    isOffline: !online,
  };
}

export default useNetworkStatus;
