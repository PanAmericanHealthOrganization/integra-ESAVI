const API_URL = import.meta.env.VITE_INTEGRA_ESAVI_API_URL as string;

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime: number;
  services: {
    api: string;
    database: string;
  };
}

export async function checkHealth(): Promise<HealthStatus> {
  const response = await fetch(`${API_URL}/health`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`Health check returned ${response.status}`);
  }

  return response.json() as Promise<HealthStatus>;
}
