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
    try {
      const data = await checkHealth();
      setHealth({
        status: data.status === 'ok' ? 'ok' : 'error',
        data,
        lastChecked: new Date(),
      });
    } catch {
      setHealth({
        status: 'error',
        data: null,
        lastChecked: new Date(),
      });
    }
  }, []);

  useEffect(() => {
    check();
    const interval = setInterval(check, intervalMs);
    return () => clearInterval(interval);
  }, [check, intervalMs]);

  return { ...health, retry: check };
}
