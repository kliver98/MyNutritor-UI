import { ENV } from '../config/env';
import { defaultTokenStorage, type ITokenStorage } from '../storage/TokenStorage';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface HttpRequestOptions {
  url: string;
  method?: HttpMethod;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | null | undefined>;
  data?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
  skipAuth?: boolean;
  retries?: number;
}

export interface HttpResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

export class AppHttpError extends Error {
  public readonly status: number;
  public readonly statusText: string;
  public readonly url: string;
  public readonly data?: unknown;

  constructor(status: number, statusText: string, url: string, message: string, data?: unknown) {
    super(message);
    this.name = 'AppHttpError';
    this.status = status;
    this.statusText = statusText;
    this.url = url;
    this.data = data;
    Object.setPrototypeOf(this, AppHttpError.prototype);
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isServerError(): boolean {
    return this.status >= 500;
  }
}

export interface IHttpClient {
  request<T>(options: HttpRequestOptions): Promise<HttpResponse<T>>;
  get<T>(
    url: string,
    options?: Omit<HttpRequestOptions, 'url' | 'method'>
  ): Promise<HttpResponse<T>>;
  post<T>(
    url: string,
    data?: unknown,
    options?: Omit<HttpRequestOptions, 'url' | 'method' | 'data'>
  ): Promise<HttpResponse<T>>;
  put<T>(
    url: string,
    data?: unknown,
    options?: Omit<HttpRequestOptions, 'url' | 'method' | 'data'>
  ): Promise<HttpResponse<T>>;
  patch<T>(
    url: string,
    data?: unknown,
    options?: Omit<HttpRequestOptions, 'url' | 'method' | 'data'>
  ): Promise<HttpResponse<T>>;
  delete<T>(
    url: string,
    options?: Omit<HttpRequestOptions, 'url' | 'method'>
  ): Promise<HttpResponse<T>>;
  setOnUnauthorized?(callback: () => void): void;
}

export class FetchHttpClient implements IHttpClient {
  private baseUrl: string;
  private tokenStorage: ITokenStorage;
  private customFetch: typeof fetch;
  private onUnauthorizedCallback?: () => void;

  constructor(
    baseUrl: string = ENV.API_BASE_URL,
    tokenStorage: ITokenStorage = defaultTokenStorage,
    customFetch: typeof fetch = fetch
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.tokenStorage = tokenStorage;
    this.customFetch = customFetch;
  }

  public setOnUnauthorized(callback: () => void): void {
    this.onUnauthorizedCallback = callback;
  }

  public setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/$/, '');
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  private buildUrl(path: string, params?: HttpRequestOptions['params']): string {
    const isAbsolute = /^https?:\/\//i.test(path);
    const fullUrl = isAbsolute ? path : `${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;

    if (!params) return fullUrl;

    const urlObj = new URL(fullUrl);
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        urlObj.searchParams.append(key, String(val));
      }
    });

    return urlObj.toString();
  }

  private async executeFetch<T>(
    fullUrl: string,
    options: HttpRequestOptions,
    attempt: number
  ): Promise<HttpResponse<T>> {
    const controller = new AbortController();
    const timeout = options.timeoutMs ?? ENV.DEFAULT_TIMEOUT_MS;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const headers = new Headers(options.headers || {});

    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }

    if (options.data && !(options.data instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    if (!options.skipAuth && !headers.has('Authorization')) {
      const token = this.tokenStorage.getToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    const init: RequestInit = {
      method: options.method || 'GET',
      headers,
      signal: options.signal || controller.signal
    };

    if (options.data !== undefined && options.method !== 'GET') {
      init.body = options.data instanceof FormData ? options.data : JSON.stringify(options.data);
    }

    try {
      const response = await this.customFetch(fullUrl, init);
      clearTimeout(timeoutId);

      // Si es un error 5xx y aún tenemos reintentos, reintentamos con backoff exponencial
      const maxRetries = options.retries ?? ENV.MAX_RETRIES;
      if (response.status >= 500 && attempt < maxRetries && options.method === 'GET') {
        const delay = ENV.RETRY_DELAY_MS * Math.pow(2, attempt);
        await new Promise((res) => setTimeout(res, delay));
        return this.executeFetch<T>(fullUrl, options, attempt + 1);
      }

      let responseData: unknown = null;
      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        const text = await response.text();
        try {
          responseData = JSON.parse(text);
        } catch {
          responseData = text;
        }
      }

      if (!response.ok) {
        let message = `HTTP Error ${response.status}: ${response.statusText}`;
        if (responseData && typeof responseData === 'object') {
          const payload = responseData as Record<string, unknown>;
          if (typeof payload.message === 'string') message = payload.message;
          else if (typeof payload.error === 'string') message = payload.error;
          else if (typeof payload.detail === 'string') message = payload.detail;
        }

        if (response.status === 401 && this.onUnauthorizedCallback && !options.skipAuth) {
          this.onUnauthorizedCallback();
        }

        throw new AppHttpError(
          response.status,
          response.statusText,
          fullUrl,
          message,
          responseData
        );
      }

      return {
        data: responseData as T,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      };
    } catch (err) {
      clearTimeout(timeoutId);

      if (err instanceof AppHttpError) {
        throw err;
      }

      const isAbort = (err as { name?: string })?.name === 'AbortError';
      const errorMessage = isAbort
        ? `Solicitud abortada por timeout de ${timeout}ms`
        : (err as Error)?.message || 'Error de conexión de red';

      const maxRetries = options.retries ?? ENV.MAX_RETRIES;
      if (!isAbort && attempt < maxRetries && options.method === 'GET') {
        const delay = ENV.RETRY_DELAY_MS * Math.pow(2, attempt);
        await new Promise((res) => setTimeout(res, delay));
        return this.executeFetch<T>(fullUrl, options, attempt + 1);
      }

      throw new AppHttpError(0, 'Network/Client Error', fullUrl, errorMessage, err);
    }
  }

  async request<T>(options: HttpRequestOptions): Promise<HttpResponse<T>> {
    const fullUrl = this.buildUrl(options.url, options.params);
    return this.executeFetch<T>(fullUrl, options, 0);
  }

  get<T>(
    url: string,
    options?: Omit<HttpRequestOptions, 'url' | 'method'>
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ ...options, url, method: 'GET' });
  }

  post<T>(
    url: string,
    data?: unknown,
    options?: Omit<HttpRequestOptions, 'url' | 'method' | 'data'>
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ ...options, url, method: 'POST', data });
  }

  put<T>(
    url: string,
    data?: unknown,
    options?: Omit<HttpRequestOptions, 'url' | 'method' | 'data'>
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ ...options, url, method: 'PUT', data });
  }

  patch<T>(
    url: string,
    data?: unknown,
    options?: Omit<HttpRequestOptions, 'url' | 'method' | 'data'>
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ ...options, url, method: 'PATCH', data });
  }

  delete<T>(
    url: string,
    options?: Omit<HttpRequestOptions, 'url' | 'method'>
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ ...options, url, method: 'DELETE' });
  }
}

export const defaultHttpClient: IHttpClient = new FetchHttpClient();
