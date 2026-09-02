import { getApiBaseUrl } from '@/config/environment';

import { clearAuthToken, loadAuthToken } from './authTokenStorage';

export type ApiErrorCode =
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'validation_error'
  | 'conflict'
  | 'too_many_requests'
  | 'not_implemented'
  | 'internal_error'
  | 'network_error';

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;

  constructor(code: ApiErrorCode, message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  authenticated?: boolean;
  signal?: AbortSignal;
};

const REQUEST_TIMEOUT_MS = 10_000;

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new ApiError('network_error', 'No hay backend configurado.', 0);
  }

  const { method = 'GET', body, authenticated = true, signal } = options;
  const headers: Record<string, string> = { Accept: 'application/json' };

  if (body !== undefined) headers['Content-Type'] = 'application/json';

  if (authenticated) {
    const token = await loadAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  signal?.addEventListener('abort', () => controller.abort());

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/v1${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    throw new ApiError('network_error', 'No se pudo contactar con el servidor.', 0);
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 401) {
    await clearAuthToken();
  }

  if (!response.ok) {
    const fallback = new ApiError('internal_error', 'Error inesperado.', response.status);
    try {
      const payload = await response.json();
      const detail = payload?.error;
      throw new ApiError(
        detail?.code ?? fallback.code,
        detail?.message ?? fallback.message,
        response.status,
      );
    } catch (error) {
      throw error instanceof ApiError ? error : fallback;
    }
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
