import api from './axios';

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
  register: (data) => api.post(`/auth/register`, data),
  signup: (data) => api.post(`/auth/signup`, data),
};

export const clientAPI = {
  getAll: (params) => api.get('/clients', { params }),
  getAllSimple: () => api.get('/clients/all'),
  getOne: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
};

export const contractAPI = {
  getAll: (params) => api.get('/contracts', { params }),
  getOne: (id) => api.get(`/contracts/${id}`),
  getExpiring: () => api.get('/contracts/expiring'),
  create: (data) => api.post('/contracts', data),
  update: (id, data) => api.put(`/contracts/${id}`, data),
  delete: (id) => api.delete(`/contracts/${id}`),
};

export const visitAPI = {
  getAll: (params) => api.get('/visits', { params }),
  getOne: (id) => api.get(`/visits/${id}`),
  create: (data) => api.post('/visits', data),
  update: (id, data) => api.put(`/visits/${id}`, data),
};

export const quotationAPI = {
  getAll: (params) => api.get('/quotations', { params }),
  getOne: (id) => api.get(`/quotations/${id}`),
  create: (data) => api.post('/quotations', data),
  update: (id, data) => api.put(`/quotations/${id}`, data),
  delete: (id) => api.delete(`/quotations/${id}`),
  generatePDF: (id) => api.post(`/quotations/${id}/generate-pdf`),
  sendEmail: (id) => api.post(`/quotations/${id}/send-email`),
};

export const invoiceAPI = {
  getAll: (params) => api.get('/invoices', { params }),
  getOne: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  generatePDF: (id) => api.post(`/invoices/${id}/generate-pdf`),
};

export const poAPI = {
  getAll: (params) => api.get('/purchase-orders', { params }),
  getOne: (id) => api.get(`/purchase-orders/${id}`),
  create: (data) => api.post('/purchase-orders', data),
  update: (id, data) => api.put(`/purchase-orders/${id}`, data),
};

export const followupAPI = {
  getAll: (params) => api.get('/followups', { params }),
  create: (data) => api.post('/followups', data),
  update: (id, data) => api.put(`/followups/${id}`, data),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
  uploadLogo: (formData) => api.post('/settings/logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const userAPI = {
  getAll: () => api.get('/users'),
  update: (id, data) => api.put(`/users/${id}`, data),
  deactivate: (id) => api.delete(`/users/${id}`),
};

export const excelAPI = {
  exportClients: () => api.get('/excel/export/clients', { responseType: 'blob' }),
  exportContracts: () => api.get('/excel/export/contracts', { responseType: 'blob' }),
  importClients: (formData) => api.post('/excel/import/clients', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// signup is already in authAPI but let's make sure it's there
