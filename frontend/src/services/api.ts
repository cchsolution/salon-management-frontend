// Production Render Backend URL
const PRODUCTION_API_URL = 'https://salon-management-e1ag.onrender.com';

// Base API URL configuration:
// 1. If VITE_API_BASE_URL environment variable is provided, use it.
// 2. In production builds (e.g. deployed on Vercel), default to the deployed Render backend URL.
// 3. In local development (npm run dev), default to '/api' (proxied by Vite to http://127.0.0.1:8000).
const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  let targetUrl: string;

  if (envUrl && envUrl.trim() !== '') {
    targetUrl = envUrl.trim();
  } else if (import.meta.env.PROD) {
    targetUrl = PRODUCTION_API_URL;
  } else {
    return '/api';
  }

  // Strip trailing slashes
  const cleanUrl = targetUrl.replace(/\/+$/, '');
  // Ensure the URL ends with exactly one '/api'
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
};

export const API_BASE = getApiBaseUrl();

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// In-memory response cache and in-flight deduplication
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const responseCache = new Map<string, CacheEntry<any>>();
const inFlightGetRequests = new Map<string, Promise<any>>();

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  cacheTtlMs?: number;
  forceRefresh?: boolean;
}

export const clearApiCache = (endpointSubstring?: string) => {
  if (!endpointSubstring) {
    responseCache.clear();
    return;
  }
  for (const key of responseCache.keys()) {
    if (key.includes(endpointSubstring)) {
      responseCache.delete(key);
    }
  }
};

const getDefaultTtl = (endpoint: string): number => {
  if (endpoint.includes('/analytics/metrics/')) return 20000;
  if (endpoint.includes('/notifications/alerts/')) return 30000;
  if (endpoint.includes('/appointments/bookings/')) return 15000;
  if (endpoint.includes('/builder/site/current/')) return 30000;
  // Catalog, categories, services, products, clients, staff, branches, salons
  return 60000;
};

const invalidateByMutation = (endpoint: string) => {
  if (endpoint.includes('/appointments/')) {
    clearApiCache('/appointments/');
    clearApiCache('/analytics/metrics/');
  } else if (endpoint.includes('/catalog/')) {
    clearApiCache('/catalog/');
  } else if (endpoint.includes('/crm/')) {
    clearApiCache('/crm/');
  } else if (endpoint.includes('/inventory/')) {
    clearApiCache('/inventory/');
  } else if (endpoint.includes('/loyalty/')) {
    clearApiCache('/loyalty/');
  } else if (endpoint.includes('/staff/')) {
    clearApiCache('/staff/');
    clearApiCache('/catalog/staff/');
  } else if (endpoint.includes('/branches/')) {
    clearApiCache('/branches/');
  } else if (endpoint.includes('/salons/')) {
    clearApiCache('/salons/');
  } else if (endpoint.includes('/builder/')) {
    clearApiCache('/builder/');
  } else if (endpoint.includes('/pos/')) {
    clearApiCache('/pos/');
    clearApiCache('/inventory/');
    clearApiCache('/analytics/metrics/');
    clearApiCache('/appointments/');
  }
};

let refreshPromise: Promise<string | null> | null = null;

const refreshAuthToken = async (): Promise<string | null> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const currentToken = localStorage.getItem('luxe_token');
    if (!currentToken) {
      return null;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ token: currentToken, refresh: currentToken }),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const newToken = data.token || data.access || data.access_token || data.refresh;
      if (newToken && typeof newToken === 'string') {
        localStorage.setItem('luxe_token', newToken);
        if (data.user) {
          localStorage.setItem('luxe_user', JSON.stringify(data.user));
        }
        return newToken;
      }
      return null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

const handleUnauthorized = () => {
  localStorage.removeItem('luxe_token');
  localStorage.removeItem('luxe_user');
  localStorage.removeItem('luxe_salon');
  localStorage.removeItem('luxe_branch');
  localStorage.removeItem('luxe_branches');
  localStorage.removeItem('luxe_active_salon_slug');
  clearApiCache();

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    const path = window.location.pathname;
    if (!path.startsWith('/login') && !path.startsWith('/register') && !path.startsWith('/s/')) {
      window.location.href = '/login';
    }
  }
};

async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
  isRetryAfterRefresh = false
): Promise<T> {
  const isGet = !options.method || options.method.toUpperCase() === 'GET';
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const token = localStorage.getItem('luxe_token');
  const salonSlug = localStorage.getItem('luxe_active_salon_slug');
  const cacheKey = `${cleanEndpoint}|${token || ''}|${salonSlug || ''}`;

  if (isGet) {
    // 1. Check response cache
    if (!options.forceRefresh) {
      const cached = responseCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return cached.data as T;
      }
    }

    // 2. In-flight deduplication for identical concurrent GET requests
    if (inFlightGetRequests.has(cacheKey)) {
      const pendingPromise = inFlightGetRequests.get(cacheKey)!;
      if (options.signal) {
        if (options.signal.aborted) {
          return Promise.reject(new DOMException('Aborted', 'AbortError'));
        }
        return new Promise<T>((resolve, reject) => {
          const onAbort = () => {
            options.signal?.removeEventListener('abort', onAbort);
            reject(new DOMException('Aborted', 'AbortError'));
          };
          options.signal?.addEventListener('abort', onAbort);
          pendingPromise.then(
            (res) => {
              options.signal?.removeEventListener('abort', onAbort);
              resolve(res);
            },
            (err) => {
              options.signal?.removeEventListener('abort', onAbort);
              reject(err);
            }
          );
        });
      }
      return pendingPromise;
    }
  } else {
    // Mutation: invalidate corresponding cache entries
    invalidateByMutation(cleanEndpoint);
  }

  const executionPromise = (async () => {
    const isFormData = options.body instanceof FormData;
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers as Record<string, string>),
    };

    const isPublicAuthEndpoint =
      cleanEndpoint.includes('/auth/login/') ||
      cleanEndpoint.includes('/auth/register/') ||
      cleanEndpoint.includes('/builder/public/');

    if (token && !isPublicAuthEndpoint) {
      const cleanToken = token.trim();
      headers['Authorization'] =
        cleanToken.startsWith('Bearer ') || cleanToken.startsWith('Token ')
          ? cleanToken
          : `Bearer ${cleanToken}`;
    }

    if (salonSlug) {
      headers['X-Salon-Slug'] = salonSlug;
    }

    const finalUrl = `${API_BASE}${cleanEndpoint}`;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let internalSignal: AbortSignal | undefined;

    if (options.timeoutMs) {
      const controller = new AbortController();
      internalSignal = controller.signal;
      timeoutId = setTimeout(() => controller.abort(), options.timeoutMs);
    }

    // Notice: We omit caller's options.signal from the underlying fetch()
    // so React component unmounts do not sever the server's TCP socket.
    const { timeoutMs, cacheTtlMs, forceRefresh, signal: callerSignal, ...fetchInit } = options;

    try {
      const response = await fetch(finalUrl, {
        ...fetchInit,
        headers,
        signal: internalSignal,
      });

      if (timeoutId) clearTimeout(timeoutId);

      if (response.status === 204) {
        return {} as T;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Handle 401 Unauthorized cleanly
        if (response.status === 401) {
          const isAuthEndpoint =
            cleanEndpoint.includes('/auth/login/') ||
            cleanEndpoint.includes('/auth/register/') ||
            cleanEndpoint.includes('/auth/token/refresh/') ||
            cleanEndpoint.includes('/auth/refresh/');

          if (!isAuthEndpoint && !isRetryAfterRefresh && token) {
            const newToken = await refreshAuthToken();
            if (newToken) {
              return request<T>(endpoint, { ...options, forceRefresh: true }, true);
            }
          }

          handleUnauthorized();
        }

        const errorMsg =
          data.error ||
          data.detail ||
          (typeof data === 'object'
            ? Object.entries(data)
                .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`)
                .join(' | ')
            : 'An unexpected error occurred.');
        throw new ApiError(errorMsg, response.status, data);
      }

      if (isGet) {
        const ttl = options.cacheTtlMs ?? getDefaultTtl(cleanEndpoint);
        if (ttl > 0) {
          responseCache.set(cacheKey, {
            data,
            timestamp: Date.now(),
            ttl,
          });
        }
      }

      return data as T;
    } catch (err: any) {
      if (timeoutId) clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw err;
      }
      if (err instanceof ApiError) {
        throw err;
      }
      const isConnectionError =
        err.message === 'Failed to fetch' ||
        err.name === 'TypeError' ||
        err.message?.toLowerCase().includes('network') ||
        err.message?.toLowerCase().includes('failed to fetch');

      const message = isConnectionError
        ? `Unable to connect to API server (${finalUrl}). Please ensure the backend is online and VITE_API_BASE_URL is configured.`
        : err.message || 'Network request failed';

      throw new ApiError(message, 0, null);
    }
  })();

  if (isGet) {
    inFlightGetRequests.set(cacheKey, executionPromise);
    executionPromise.finally(() => {
      inFlightGetRequests.delete(cacheKey);
    });
  }

  if (options.signal) {
    if (options.signal.aborted) {
      return Promise.reject(new DOMException('Aborted', 'AbortError'));
    }
    return new Promise<T>((resolve, reject) => {
      const onAbort = () => {
        options.signal?.removeEventListener('abort', onAbort);
        reject(new DOMException('Aborted', 'AbortError'));
      };
      options.signal?.addEventListener('abort', onAbort);
      executionPromise.then(
        (res) => {
          options.signal?.removeEventListener('abort', onAbort);
          resolve(res);
        },
        (err) => {
          options.signal?.removeEventListener('abort', onAbort);
          reject(err);
        }
      );
    });
  }

  return executionPromise;
}

export const api = {
  get: <T>(url: string, options?: RequestOptions) =>
    request<T>(url, { method: 'GET', ...options }),
  post: <T>(url: string, body?: any, options?: RequestOptions) =>
    request<T>(url, { method: 'POST', body: JSON.stringify(body), ...options }),
  put: <T>(url: string, body?: any, options?: RequestOptions) =>
    request<T>(url, { method: 'PUT', body: JSON.stringify(body), ...options }),
  patch: <T>(url: string, body?: any, options?: RequestOptions) =>
    request<T>(url, { method: 'PATCH', body: JSON.stringify(body), ...options }),
  delete: <T>(url: string, options?: RequestOptions) =>
    request<T>(url, { method: 'DELETE', ...options }),
  upload: <T>(url: string, formData: FormData, options?: RequestOptions) =>
    request<T>(url, { method: 'POST', body: formData, ...options }),
  getCached: <T>(url: string): T | null => {
    const token = localStorage.getItem('luxe_token');
    const salonSlug = localStorage.getItem('luxe_active_salon_slug');
    const cleanEndpoint = url.startsWith('/') ? url : `/${url}`;
    const cacheKey = `${cleanEndpoint}|${token || ''}|${salonSlug || ''}`;
    const entry = responseCache.get(cacheKey);
    if (entry && Date.now() - entry.timestamp < entry.ttl) {
      return entry.data as T;
    }
    return null;
  },
  invalidateCache: clearApiCache,
};
