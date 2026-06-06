import { config } from '@/config';
import type { DashboardStats } from '@/types';

const BASE_URL = config.apiUrl;

interface CacheEntry {
  data: any;
  timestamp: number;
}

const requestCache = new Map<string, CacheEntry>();
const CACHE_TTL = 15000;
const pendingRequests = new Map<string, Promise<any>>();

function getCacheKey(endpoint: string, params?: Record<string, any>): string {
  return endpoint + (params ? JSON.stringify(params) : '');
}

async function refreshToken(): Promise<boolean> {
  try {
    const refresh = localStorage.getItem(config.storageKeys.refreshToken);
    if (!refresh) return false;

    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    localStorage.setItem(config.storageKeys.token, data.data.accessToken);
    localStorage.setItem(config.storageKeys.refreshToken, data.data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  cache?: { enabled: boolean; ttl?: number },
): Promise<T> {
  const token = localStorage.getItem(config.storageKeys.token);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const isGetMethod = !options.method || options.method === 'GET';

  if (isGetMethod && cache?.enabled) {
    const cacheKey = getCacheKey(endpoint);
    const cached = requestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < (cache.ttl || CACHE_TTL)) {
      return cached.data;
    }
  }

  if (isGetMethod) {
    const cacheKey = getCacheKey(endpoint);
    const pending = pendingRequests.get(cacheKey);
    if (pending) return pending;
  }

  const fetchPromise = (async () => {
    let res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

    if (res.status === 401 && token) {
      const refreshed = await refreshToken();
      if (refreshed) {
        const newToken = localStorage.getItem(config.storageKeys.token);
        headers['Authorization'] = `Bearer ${newToken}`;
        res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
      } else {
        localStorage.removeItem(config.storageKeys.token);
        localStorage.removeItem(config.storageKeys.refreshToken);
        localStorage.removeItem(config.storageKeys.user);
        window.location.href = '/login';
        throw new Error('Sesión expirada');
      }
    }

    const json = await res.json();

    if (!res.ok) {
      const message = json.message || json.data?.message || 'Error del servidor';
      throw new Error(Array.isArray(message) ? message[0] : message);
    }

    const result = json.data !== undefined ? json.data : json;

    if (isGetMethod && cache?.enabled) {
      const cacheKey = getCacheKey(endpoint);
      requestCache.set(cacheKey, { data: result, timestamp: Date.now() });
    }

    return result;
  })();

  if (isGetMethod) {
    const cacheKey = getCacheKey(endpoint);
    pendingRequests.set(cacheKey, fetchPromise);
    fetchPromise.finally(() => pendingRequests.delete(cacheKey));
  }

  return fetchPromise;
}

function invalidateCache(pattern?: string) {
  if (!pattern) {
    requestCache.clear();
    return;
  }
  requestCache.forEach((_, key) => {
    if (key.includes(pattern)) requestCache.delete(key);
  });
}

export const api = {
  get: <T>(endpoint: string, params?: Record<string, any>, cacheOptions?: { enabled?: boolean; ttl?: number }) => {
    const query = params
      ? '?' + Object.entries(params)
          .filter(([_, v]) => v !== undefined && v !== null && v !== '')
          .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
          .join('&')
      : '';
    return request<T>(`${endpoint}${query}`, {}, { enabled: cacheOptions?.enabled ?? true, ttl: cacheOptions?.ttl });
  },

  post: <T>(endpoint: string, data?: any) => {
    invalidateCache(endpoint.split('/')[1]);
    return request<T>(endpoint, { method: 'POST', body: JSON.stringify(data) });
  },

  put: <T>(endpoint: string, data?: any) => {
    invalidateCache(endpoint.split('/')[1]);
    return request<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) });
  },

  delete: <T>(endpoint: string) => {
    invalidateCache(endpoint.split('/')[1]);
    return request<T>(endpoint, { method: 'DELETE' });
  },
};

export const authApi = {
  login: (usernameOrEmail: string, password: string) =>
    api.post<{ user: any; accessToken: string; refreshToken: string }>('/auth/login', { usernameOrEmail, password }),

  refresh: (refreshToken: string) =>
    api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken }),

  logout: () => api.post('/auth/logout'),

  getProfile: () => api.get('/auth/profile'),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

export const usersApi = {
  getAll: (params?: any) => api.get<any>('/users', params),
  getById: (id: string) => api.get<any>(`/users/${id}`),
  create: (data: any) => api.post<any>('/users', data),
  update: (id: string, data: any) => api.put<any>(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  toggleStatus: (id: string) => api.put<any>(`/users/${id}/toggle-status`),
};

export const rolesApi = {
  getAll: () => api.get<any[]>('/roles'),
  getById: (id: string) => api.get<any>(`/roles/${id}`),
  create: (data: any) => api.post<any>('/roles', data),
  update: (id: string, data: any) => api.put<any>(`/roles/${id}`, data),
  delete: (id: string) => api.delete(`/roles/${id}`),
};

export const permissionsApi = {
  getAll: () => api.get<any[]>('/permissions'),
  findByModule: (module: string) => api.get<any[]>(`/permissions/module/${module}`),
};

export const productsApi = {
  getAll: (params?: any) => api.get<any>('/products', params),
  getById: (id: string) => api.get<any>(`/products/${id}`),
  create: (data: any) => api.post<any>('/products', data),
  update: (id: string, data: any) => api.put<any>(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
  findByBarcode: (barcode: string) => api.get<any>(`/products/barcode/${barcode}`),
};

export const categoriesApi = {
  getAll: () => api.get<any[]>('/categories'),
  getById: (id: string) => api.get<any>(`/categories/${id}`),
  create: (data: any) => api.post<any>('/categories', data),
  update: (id: string, data: any) => api.put<any>(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

export const brandsApi = {
  getAll: () => api.get<any[]>('/brands'),
  getById: (id: string) => api.get<any>(`/brands/${id}`),
  create: (data: any) => api.post<any>('/brands', data),
  update: (id: string, data: any) => api.put<any>(`/brands/${id}`, data),
  delete: (id: string) => api.delete(`/brands/${id}`),
};

export const suppliersApi = {
  getAll: () => api.get<any[]>('/suppliers'),
  getById: (id: string) => api.get<any>(`/suppliers/${id}`),
  create: (data: any) => api.post<any>('/suppliers', data),
  update: (id: string, data: any) => api.put<any>(`/suppliers/${id}`, data),
  delete: (id: string) => api.delete(`/suppliers/${id}`),
};

export const customersApi = {
  getAll: (params?: any) => api.get<any>('/customers', params),
  getById: (id: string) => api.get<any>(`/customers/${id}`),
  create: (data: any) => api.post<any>('/customers', data),
  update: (id: string, data: any) => api.put<any>(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
};

export const salesApi = {
  getAll: (params?: any) => api.get<any>('/sales', params),
  getById: (id: string) => api.get<any>(`/sales/${id}`),
  create: (data: any) => api.post<any>('/sales', data),
  cancel: (id: string) => api.post<any>(`/sales/${id}/cancel`),
};

export const cashRegisterApi = {
  open: (data: any) => api.post<any>('/cash-register/open', data),
  close: (data: any) => api.post<any>('/cash-register/close', data),
  current: () => api.get<any>('/cash-register/current'),
  history: (params?: any) => api.get<any>('/cash-register/history', params),
};

export const inventoryApi = {
  createMovement: (data: any) => api.post<any>('/inventory/movements', data),
  getMovements: (params?: any) => api.get<any>('/inventory/movements', params),
};

export const promotionsApi = {
  getAll: () => api.get<any[]>('/promotions'),
  getById: (id: string) => api.get<any>(`/promotions/${id}`),
  create: (data: any) => api.post<any>('/promotions', data),
  update: (id: string, data: any) => api.put<any>(`/promotions/${id}`, data),
  delete: (id: string) => api.delete(`/promotions/${id}`),
};

export const quotesApi = {
  getAll: (params?: any) => api.get<any>('/quotes', params),
  getById: (id: string) => api.get<any>(`/quotes/${id}`),
  create: (data: any) => api.post<any>('/quotes', data),
  updateStatus: (id: string, status: string) => api.put<any>(`/quotes/${id}/status`, { status }),
};

export const saleNotesApi = {
  getAll: (params?: any) => api.get<any>('/sale-notes', params),
  getById: (id: string) => api.get<any>(`/sale-notes/${id}`),
  create: (data: any) => api.post<any>('/sale-notes', data),
  updateStatus: (id: string, status: string) => api.put<any>(`/sale-notes/${id}/status`, { status }),
};

export const auditApi = {
  getAll: (params?: any) => api.get<any>('/audit', params),
};

export const reportsApi = {
  sales: (params?: any) => api.get<any>('/reports/sales', params),
  products: () => api.get<any>('/reports/products'),
  inventory: () => api.get<any>('/reports/inventory'),
  financial: (params?: any) => api.get<any>('/reports/financial', params),
  customers: (params?: any) => api.get<any>('/reports/customers', params),
  stockAlerts: () => api.get<any>('/reports/stock-alerts'),
};

export const dashboardApi = {
  getStats: (params?: Record<string, any>) => api.get<DashboardStats>('/dashboard', params, { enabled: false }),
};

export const settingsApi = {
  getAll: () => api.get<any[]>('/settings'),
  getByGroup: (group: string) => api.get<any[]>(`/settings/group/${group}`),
  update: (key: string, value: string) => api.put<any>(`/settings/${key}`, { value }),
};
