/**
 * Cliente HTTP para comunicação com a API REST
 * 
 * Usa fetch nativo com interceptors para autenticação e tratamento de erros
 */

export interface ApiError {
  error: string;
  details?: Array<{ path: string; message: string }>;
  stack?: string;
}

/**
 * Classe para erros da API
 */
export class ApiClientError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: Array<{ path: string; message: string }>
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/**
 * Obtém o token de autenticação do Supabase
 */
async function getAuthToken(): Promise<string | null> {
  // Importação dinâmica para evitar dependência circular
  const { supabase } = await import('@/integrations/supabase/client');
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

/**
 * Cliente HTTP base
 */
class ApiClient {
  private baseURL: string;

  constructor() {
    // Base URL da API (padrão: http://localhost:3000)
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  }

  /**
   * Faz uma requisição HTTP
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await getAuthToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Se não houver conteúdo (204 No Content), retorna vazio
      if (response.status === 204) {
        return {} as T;
      }

      // Verifica se há conteúdo antes de fazer parse
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        if (!response.ok) {
          throw new ApiClientError(
            `Erro na requisição: ${response.statusText}`,
            response.status
          );
        }
        return {} as T;
      }

      const data = await response.json();

      if (!response.ok) {
        const apiError = data as ApiError;
        throw new ApiClientError(
          apiError.error || 'Erro na requisição',
          response.status,
          apiError.details
        );
      }

      return data as T;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }

      // Erro de rede ou outro erro
      throw new ApiClientError(
        error instanceof Error ? error.message : 'Erro de conexão',
        0
      );
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const queryString = params
      ? '?' + new URLSearchParams(params).toString()
      : '';
    return this.request<T>(`${endpoint}${queryString}`, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: unknown, params?: Record<string, string>): Promise<T> {
    const queryString = params
      ? '?' + new URLSearchParams(params).toString()
      : '';
    return this.request<T>(`${endpoint}${queryString}`, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Instância singleton do cliente
export const apiClient = new ApiClient();
