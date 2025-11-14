import axios, { AxiosError, AxiosHeaders } from 'axios';
import type { AxiosRequestConfig } from 'axios';

// Central axios instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Lightweight CSRF token cache in memory
let csrfToken: string | null = null;

// Attach CSRF token for unsafe methods automatically
api.interceptors.request.use(config => {
  const method = (config.method || 'get').toUpperCase();
  const unsafe = method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';
  if (unsafe && csrfToken) {
    if (!config.headers) {
      config.headers = new AxiosHeaders();
    }
    if (config.headers instanceof AxiosHeaders) {
      config.headers.set('x-csrf-token', csrfToken);
    } else {
      (config.headers as Record<string, string>)['x-csrf-token'] = csrfToken;
    }
  }
  return config;
});

// Capture CSRF token from any response header
api.interceptors.response.use(
  response => {
    const header = response.headers['x-csrf-token'] || response.headers['x-xsrf-token'];
    if (typeof header === 'string' && header.length > 0) {
      csrfToken = header;
    }
    return response;
  },
  async (error: AxiosError) => {
    // If we get a 403 with CSRF message, try to refresh token once and retry
    const original = error.config as AxiosRequestConfig & { _csrfRetried?: boolean };
    const status = error.response?.status;
    type ErrorBody = { error?: string };
    const message = (error.response?.data as ErrorBody | undefined)?.error;
    const isCsrf = status === 403 && message && /csrf/i.test(message);
    if (isCsrf && !original?._csrfRetried) {
      try {
        // Fetch a fresh token
        const r = await api.get('/api/csrf-token');
        const fresh = r.data?.token as string | undefined;
        if (fresh) csrfToken = fresh;
      } catch {
        // ignore
      }
      original._csrfRetried = true;
      if (csrfToken) {
        original.headers = { ...(original.headers || {}), 'x-csrf-token': csrfToken };
      }
      return api.request(original);
    }
    return Promise.reject(error);
  }
);
