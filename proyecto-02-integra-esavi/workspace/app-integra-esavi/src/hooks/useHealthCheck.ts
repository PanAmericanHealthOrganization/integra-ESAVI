import { useState, useEffect, useCallback } from 'react';
import { checkHealth, HealthStatus } from '../dataProviders/health.dataprovider';

export type HealthState = {
  status: 'loading' | 'ok' | 'error';
  data: HealthStatus | null;
  lastChecked: Date | null;
};

export function useHealthCheck(intervalMs = 30000) {
  const [health, setHealth] = useState<HealthState>({
    status: 'loading',
    data: null,
    lastChecked: null,
  });

  const check = useCallback(async () => {
    let siguiente: HealthState;
    try {
      const data = await checkHealth();
      siguiente = {
        status: data.status === 'ok' ? 'ok' : 'error',
        data,
        lastChecked: new Date(),
      };
    } catch {
      siguiente = {
        status: 'error',
        data: null,
        lastChecked: new Date(),
      };
    }

    // Mientras el backend siga sano se conserva el estado anterior. Publicar un objeto
    // nuevo en cada sondeo volvía a renderizar toda la aplicación cada `intervalMs`, y ese
    // re-render recreaba el authProvider de <Admin>, lo que hacía recargar sola la pantalla
    // de Calidad de Datos. `lastChecked` sólo se muestra en la pantalla de mantenimiento,
    // es decir cuando el estado ya dejó de ser 'ok'.
    setHealth(previo =>
      previo.status === 'ok' && siguiente.status === 'ok' ? previo : siguiente
    );
  }, []);

  useEffect(() => {
    check();
    const interval = setInterval(check, intervalMs);
    return () => clearInterval(interval);
  }, [check, intervalMs]);

  return { ...health, retry: check };
}
