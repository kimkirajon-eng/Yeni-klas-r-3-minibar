import { LoginResponse } from '../types';

const API_BASE = '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  if (res.status === 204) return undefined as T;

  const text = await res.text();

  if (!text) {
    if (!res.ok) throw new Error(`Hata (${res.status}): Boş yanıt`);
    return undefined as T;
  }

  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    if (!res.ok) throw new Error(`Hata (${res.status}): ${text.slice(0, 100)}`);
    return text as T;
  }

  if (!res.ok) {
    throw new Error(data.message || `Hata (${res.status}): ${text.slice(0, 100)}`);
  }

  return data as T;
}

export const api = {
  auth: {
    login: (data: { username: string; password: string }) =>
      request<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    me: () => request<LoginResponse['user']>('/auth/me'),
  },

  blocks: {
    getAll: () => request<any[]>('/blocks'),
    getById: (id: string) => request<any>(`/blocks/${id}`),
    create: (data: { name: string }) =>
      request<any>('/blocks', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: { name?: string }) =>
      request<any>(`/blocks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<void>(`/blocks/${id}`, { method: 'DELETE' }),
  },

  floors: {
    getByBlock: (blockId: string) => request<any[]>(`/floors/block/${blockId}`),
    getById: (id: string) => request<any>(`/floors/${id}`),
    create: (data: { name: string; blockId: string }) =>
      request<any>('/floors', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: { name?: string; blockId?: string }) =>
      request<any>(`/floors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<void>(`/floors/${id}`, { method: 'DELETE' }),
  },

  rooms: {
    getAll: (params?: { blockId?: string; floorId?: string }) => {
      const query = new URLSearchParams();
      if (params?.blockId) query.set('blockId', params.blockId);
      if (params?.floorId) query.set('floorId', params.floorId);
      const qs = query.toString();
      return request<any[]>(`/rooms${qs ? `?${qs}` : ''}`);
    },
    getById: (id: string) => request<any>(`/rooms/${id}`),
    getDetails: () => request<any[]>('/rooms/details'),
    create: (data: { name: string; floorId: string; blockId: string }) =>
      request<any>('/rooms', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<void>(`/rooms/${id}`, { method: 'DELETE' }),
    batchOccupancy: (data: { roomIds: string[]; occupancyStatus: string }) =>
      request<any[]>('/rooms/batch-occupancy', { method: 'POST', body: JSON.stringify(data) }),
  },

  users: {
    getAll: () => request<any[]>('/users'),
    getById: (id: string) => request<any>(`/users/${id}`),
    create: (data: any) =>
      request<any>('/users', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<void>(`/users/${id}`, { method: 'DELETE' }),
  },

  products: {
    getAll: (includeInactive = false) =>
      request<any[]>(`/products?includeInactive=${includeInactive}`),
    create: (data: { name: string; price: number; stock?: number; minStockLevel?: number }) =>
      request<any>('/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<void>(`/products/${id}`, { method: 'DELETE' }),
    updateStock: (id: string, quantity: number) =>
      request<any>(`/products/${id}/stock`, { method: 'PUT', body: JSON.stringify({ quantity }) }),
    getLowStock: () => request<any[]>('/products/low-stock'),
    getStockSummary: () => request<any>('/products/stock-summary'),
  },

  shifts: {
    getAll: () => request<any[]>('/shifts'),
    getById: (id: string) => request<any>(`/shifts/${id}`),
    getByDate: (date?: string) =>
      request<any[]>(`/shifts/by-date${date ? `?date=${date}` : ''}`),
    create: (data: { userId: string; date: string; startTime: string; endTime: string; note?: string }) =>
      request<any>('/shifts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/shifts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<void>(`/shifts/${id}`, { method: 'DELETE' }),
  },

  minibar: {
    updateStatus: (data: { roomId: string; status: string; note?: string }) =>
      request<any>('/minibar/status', { method: 'PUT', body: JSON.stringify(data) }),
    recordConsumption: (data: { roomId: string; items: Array<{ productId: string; quantity: number }>; note?: string }) =>
      request<any>('/minibar/consumption', { method: 'POST', body: JSON.stringify(data) }),
    getRoomHistory: (roomId: string) => request<any[]>(`/minibar/history/${roomId}`),
    getTodayLogs: () => request<any[]>('/minibar/today-logs'),
    getDashboard: () => request<any>('/minibar/dashboard'),
    getStatusHistories: () => request<any[]>('/minibar/status-histories'),
    updateNote: (roomId: string, note: string | null) =>
      request<any>(`/minibar/${roomId}/note`, { method: 'PUT', body: JSON.stringify({ note }) }),
  },

  reports: {
    excel: () => `${API_BASE}/reports/excel`,
    pdf: () => `${API_BASE}/reports/pdf`,
    performance: () => request<any[]>('/reports/performance'),
    productRevenue: (start?: string, end?: string) => {
      const params = new URLSearchParams();
      if (start) params.set('start', start);
      if (end) params.set('end', end);
      const qs = params.toString();
      return request<any>(`/reports/product-revenue${qs ? `?${qs}` : ''}`);
    },
    roomHeatmap: (blockId?: string, floorId?: string) => {
      const params = new URLSearchParams();
      if (blockId) params.set('blockId', blockId);
      if (floorId) params.set('floorId', floorId);
      const qs = params.toString();
      return request<any>(`/reports/room-heatmap${qs ? `?${qs}` : ''}`);
    },
    roomConsumption: (start?: string, end?: string) => {
      const params = new URLSearchParams();
      if (start) params.set('start', start);
      if (end) params.set('end', end);
      const qs = params.toString();
      return request<any>(`/reports/room-consumption${qs ? `?${qs}` : ''}`);
    },
    roomConsumptionPdf: (start?: string, end?: string) => {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (token) params.set('token', token);
      if (start) params.set('start', start);
      if (end) params.set('end', end);
      return `${API_BASE}/reports/room-consumption/pdf?${params.toString()}`;
    },
  },

  backup: {
    json: () => `${API_BASE}/backup/json`,
    sqlite: () => `${API_BASE}/backup/sqlite`,
  },

  snapshots: {
    create: () => request<any>('/snapshots', { method: 'POST' }),
    list: () => request<any[]>('/snapshots'),
    get: (id: string) => request<any>(`/snapshots/${id}`),
    delete: (id: string) => request<void>(`/snapshots/${id}`, { method: 'DELETE' }),
    pdf: (id: string) => {
      const token = localStorage.getItem('token');
      return `${API_BASE}/snapshots/${id}/pdf?token=${token}`;
    },
  },
};
