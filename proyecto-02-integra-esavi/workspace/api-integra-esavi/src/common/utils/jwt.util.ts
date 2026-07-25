const FALLBACK_USER = process.env.USUARIO_INSERTA_REGISTRO || 'SYSTEM';

export function getUsernameFromJwt(authHeader: string | undefined): string {
  try {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return FALLBACK_USER;
    const token = authHeader.slice(7);
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
    return payload.preferred_username || FALLBACK_USER;
  } catch {
    return FALLBACK_USER;
  }
}
