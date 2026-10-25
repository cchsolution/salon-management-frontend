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

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('luxe_token');
  const salonSlug = localStorage.getItem('luxe_active_salon_slug');

  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  if (salonSlug) {
    headers['X-Salon-Slug'] = salonSlug;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const finalUrl = `${API_BASE}${cleanEndpoint}`;

  const response = await fetch(finalUrl, {
    ...options,
    headers,
  });


  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
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

  return data as T;
}

export const api = {
  get: <T>(url: string) => request<T>(url, { method: 'GET' }),
  post: <T>(url: string, body?: any) =>
    request<T>(url, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(url: string, body?: any) =>
    request<T>(url, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(url: string, body?: any) =>
    request<T>(url, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
  upload: <T>(url: string, formData: FormData) =>
    request<T>(url, { method: 'POST', body: formData }),
};
