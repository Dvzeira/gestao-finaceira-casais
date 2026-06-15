// Espelha o formato de erro padronizado pelo AllExceptionsFilter do backend.
export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  path: string;
  timestamp: string;
}

export function getApiErrorMessage(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: unknown }).response === 'object'
  ) {
    const response = (error as { response?: { data?: unknown } }).response;
    const data = response?.data as Partial<ApiErrorResponse> | undefined;
    if (data?.message) {
      return Array.isArray(data.message) ? data.message.join(' ') : data.message;
    }
  }

  return 'Ocorreu um erro inesperado. Tente novamente.';
}
