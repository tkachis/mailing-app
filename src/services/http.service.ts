import * as Sentry from '@sentry/nextjs';

import supabaseService from './supabase.service';

export type HttpRequestOptions = RequestInit & {
  requireAuth?: boolean;
};

export type ApiResponse<T = unknown> =
  | {
      data: T;
      success: true;
      response?: Response;
    }
  | { error: string; success: false; response?: Response };

class HttpService {
  private baseURL: string;

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || '') {
    this.baseURL = baseURL;

    if (!this.baseURL) {
      console.warn(
        'No API base URL configured. Set NEXT_PUBLIC_API_URL environment variable.',
      );
    }
  }

  private async createHeaders(
    customHeaders: HeadersInit = {},
    requireAuth: boolean = true,
  ): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (requireAuth) {
      const supabase = await supabaseService.createServerClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (token) {
        (headers as Record<string, string>)['Authorization'] =
          `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      let data: T = {} as T;

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const jsonData = await response.json();
        data = jsonData;
      }

      if (!response.ok) {
        const errorMessage = data
          ? (data as { message?: string; error?: string }).message ||
            (data as { message?: string; error?: string }).error
          : response.statusText;

        return {
          error: errorMessage || 'Something went wrong',
          success: false,
        };
      }

      return {
        data,
        success: true,
        response,
      };
    } catch (error) {
      // Log to Sentry
      Sentry.captureException(error, {
        tags: {
          feature: 'http',
          service: 'HttpService',
          method: 'handleResponse',
        },
      });

      return {
        error: error instanceof Error ? error.message : 'Something went wrong',
        success: false,
        response,
      };
    }
  }

  private createURL(endpoint: string): string {
    if (endpoint.startsWith('http')) {
      return endpoint;
    }

    const cleanEndpoint = endpoint.startsWith('/')
      ? endpoint.slice(1)
      : endpoint;
    const cleanBaseURL = this.baseURL.endsWith('/')
      ? this.baseURL.slice(0, -1)
      : this.baseURL;

    return cleanBaseURL
      ? `${cleanBaseURL}/${cleanEndpoint}`
      : `/${cleanEndpoint}`;
  }

  private async request<T>(
    endpoint: string,
    options: HttpRequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const {
      requireAuth = true,
      headers: customHeaders,
      ...fetchOptions
    } = options;

    let url: string | null = null;

    try {
      url = this.createURL(endpoint);
      const headers = await this.createHeaders(customHeaders, requireAuth);

      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('HTTP Request failed:', error);

      // Log to Sentry
      Sentry.captureException(error, {
        tags: {
          feature: 'http',
          service: 'HttpService',
          method: 'request',
        },
        extra: {
          url,
          method: options.method || 'GET',
        },
      });

      return {
        error: error instanceof Error ? error.message : 'Something went wrong',
        success: false,
      };
    }
  }

  async get<T>(
    endpoint: string,
    options?: HttpRequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: HttpRequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    options?: HttpRequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(
    endpoint: string,
    data?: unknown,
    options?: HttpRequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(
    endpoint: string,
    options?: HttpRequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }
}

const httpService = new HttpService();

export default httpService;
