import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - добавляем токен к каждому запросу
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - обрабатываем ошибки
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Если 401 и это не запрос на login/refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      // Если это ошибка refresh токена, сразу разлогиниваем
      if (originalRequest.url?.includes('/auth/refresh/')) {
        console.log('Refresh token expired, logging out...');
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const refreshToken = useAuthStore.getState().refreshToken
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          })
          
          const { access } = response.data
          useAuthStore.getState().setToken(access)
          
          originalRequest.headers.Authorization = `Bearer ${access}`
          return api(originalRequest)
        } else {
          throw new Error('No refresh token');
        }
      } catch (refreshError) {
        console.log('Failed to refresh token, logging out...');
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: async (username, password) => {
    const response = await api.post('/auth/login/', { username, password });
    return response.data;
  },
  logout: async (refreshToken) => {
    const response = await api.post('/auth/logout/', { refresh: refreshToken });
    return response.data;
  },
  refresh: async (refreshToken) => {
    const response = await api.post('/auth/refresh/', { refresh: refreshToken });
    return response.data;
  },
}

// Users API
export const usersAPI = {
  getList: async (params) => {
    const response = await api.get('/users/', { params });
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/users/', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.patch(`/users/${id}/`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/users/${id}/`);
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/users/me/');
    return response.data;
  },
  updateMe: async (data) => {
    // For FormData (file upload) delete Content-Type so axios sets multipart/form-data with correct boundary
    const config = data instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    const response = await api.patch('/users/me/', data, config);
    return response.data;
  },
  changePassword: async (data) => {
    const response = await api.post('/users/me/change-password/', data);
    return response.data;
  },
}

// Groups API
export const groupsAPI = {
  getList: async (params) => {
    const response = await api.get('/groups/', { params });
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/groups/', data);
    return response.data;
  },
  get: async (id) => {
    const response = await api.get(`/groups/${id}/`);
    return response.data;
  },
  updateProgress: async (id, data) => {
    const response = await api.patch(`/groups/${id}/progress/`, data);
    return response.data;
  },
  changeStatus: async (id, status) => {
    const response = await api.patch(`/groups/${id}/change-status/`, { status });
    return response.data;
  },
  getStudents: async (id) => {
    const response = await api.get(`/groups/${id}/students/`);
    return response.data;
  },
}

// Students API
export const studentsAPI = {
  getList: async (params) => {
    const response = await api.get('/students/', { params });
    return response.data;
  },
  register: async (data) => {
    const response = await api.post('/students/register/', data);
    return response.data;
  },
  get: async (id) => {
    const response = await api.get(`/students/${id}/`);
    return response.data;
  },
  makePayment: async (id, data) => {
    const response = await api.post(`/students/${id}/payments/`, data);
    return response.data;
  },
  changeStatus: async (id, status) => {
    const response = await api.patch(`/students/${id}/change_status/`, { status });
    return response.data;
  },
  transferGroup: async (id, groupId) => {
    const response = await api.post(`/students/${id}/transfer/`, { group_id: groupId });
    return response.data;
  },
}

// Transactions API
export const transactionsAPI = {
  getList: async (params) => {
    const response = await api.get('/transactions/', { params });
    return response.data;
  },
  get: async (id) => {
    const response = await api.get(`/transactions/${id}/`);
    return response.data;
  },
}

// Balances API
export const balancesAPI = {
  getMine: async () => {
    const response = await api.get('/balances/me/');
    return response.data;
  },
  getList: async () => {
    const response = await api.get('/balances/');
    return response.data;
  },
}

// Collections API
export const collectionsAPI = {
  getList: async (params) => {
    const response = await api.get('/collections/', { params });
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/collections/', data);
    return response.data;
  },
}

// Expenses API
export const expensesAPI = {
  getList: async (params) => {
    const response = await api.get('/expenses/', { params });
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/expenses/', data);
    return response.data;
  },
}

// Analytics API
export const analyticsAPI = {
  getSummary: async (params = {}) => {
    const response = await api.get('/analytics/summary/', { params });
    return response.data;
  },
  getMonthly: async (params = {}) => {
    const response = await api.get('/analytics/monthly/', { params });
    return response.data;
  },
  getExpenses: async (params = {}) => {
    const response = await api.get('/analytics/expenses/', { params });
    return response.data;
  },
  getCashiers: async (params = {}) => {
    const response = await api.get('/analytics/cashiers/', { params });
    return response.data;
  },
  getGroups: async () => {
    const response = await api.get('/analytics/groups/');
    return response.data;
  },
  exportExcel: async (params = {}) => {
    try {
      const response = await api.get('/analytics/download-excel/', {
        params: { format: 'xlsx', ...params },
        responseType: 'blob',
      });
      
      // Проверяем, что это действительно blob, а не JSON с ошибкой
      if (response.data.type === 'application/json') {
        const text = await response.data.text();
        const error = JSON.parse(text);
        throw new Error(error.detail || 'Ошибка экспорта');
      }
      
      return response.data;
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  },
}

// Audit Log API
export const auditAPI = {
  getList: async (params) => {
    const response = await api.get('/audit-log/', { params });
    return response.data;
  },
}

export default api
