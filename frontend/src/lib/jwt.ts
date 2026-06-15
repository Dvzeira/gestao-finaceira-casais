// Decodifica o payload de um JWT sem validar a assinatura — usado apenas
// para extrair dados não sensíveis (ex: id do usuário) no cliente.
export function decodeJwtPayload<T>(token: string): T | null {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
