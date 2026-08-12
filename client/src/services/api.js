const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('token');

const headers = (withAuth = true) => {
  const h = { 'Content-Type': 'application/json' };
  if (withAuth) {
    const token = getToken();
    if (token) h['Authorization'] = `Bearer ${token}`;
  }
  return h;
};

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) {
    const msg = data.error || data.errors?.join(', ') || 'Terjadi kesalahan.';
    throw new Error(msg);
  }
  return data;
};

// ─── Auth ────────────────────────────────────────────────
export const authApi = {
  login: (username, password) =>
    fetch(`${API_BASE}/auth/login`, { method: 'POST', headers: headers(false), body: JSON.stringify({ username, password }) }).then(handleResponse),
  me: () =>
    fetch(`${API_BASE}/auth/me`, { headers: headers() }).then(handleResponse),
  resetRequest: (username, catatan) =>
    fetch(`${API_BASE}/auth/reset-request`, { method: 'POST', headers: headers(false), body: JSON.stringify({ username, catatan }) }).then(handleResponse),
  changePassword: (password_lama, password_baru, konfirmasi) =>
    fetch(`${API_BASE}/auth/change-password`, { method: 'PUT', headers: headers(), body: JSON.stringify({ password_lama, password_baru, konfirmasi }) }).then(handleResponse),
};

// ─── Dashboard ───────────────────────────────────────────
export const dashboardApi = {
  stats: (month) => {
    const qs = month ? `?month=${month}` : '';
    return fetch(`${API_BASE}/dashboard/stats${qs}`, { headers: headers() }).then(handleResponse);
  },
  upcoming: () =>
    fetch(`${API_BASE}/dashboard/upcoming`, { headers: headers() }).then(handleResponse),
  departmentStats: (month) => {
    const qs = month ? `?month=${month}` : '';
    return fetch(`${API_BASE}/dashboard/department-stats${qs}`, { headers: headers() }).then(handleResponse);
  },
};

// ─── Rapat ───────────────────────────────────────────────
export const rapatApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/rapat${qs ? '?' + qs : ''}`, { headers: headers() }).then(handleResponse);
  },
  getById: (id) =>
    fetch(`${API_BASE}/rapat/${id}`, { headers: headers() }).then(handleResponse),
  getTv: () =>
    fetch(`${API_BASE}/rapat/tv`).then(handleResponse), // Public, no auth
  create: (data) =>
    fetch(`${API_BASE}/rapat`, { method: 'POST', headers: headers(), body: JSON.stringify(data) }).then(handleResponse),
  createBulk: (data) =>
    fetch(`${API_BASE}/rapat/bulk`, { method: 'POST', headers: headers(), body: JSON.stringify(data) }).then(handleResponse),
  update: (id, data) =>
    fetch(`${API_BASE}/rapat/${id}`, { method: 'PUT', headers: headers(), body: JSON.stringify(data) }).then(handleResponse),
  delete: (id) =>
    fetch(`${API_BASE}/rapat/${id}`, { method: 'DELETE', headers: headers() }).then(handleResponse),
};

// ─── Departemen ──────────────────────────────────────────
export const departemenApi = {
  getAll: () =>
    fetch(`${API_BASE}/departemen`, { headers: headers() }).then(handleResponse),
  create: (data) =>
    fetch(`${API_BASE}/departemen`, { method: 'POST', headers: headers(), body: JSON.stringify(data) }).then(handleResponse),
  update: (id, data) =>
    fetch(`${API_BASE}/departemen/${id}`, { method: 'PUT', headers: headers(), body: JSON.stringify(data) }).then(handleResponse),
  delete: (id) =>
    fetch(`${API_BASE}/departemen/${id}`, { method: 'DELETE', headers: headers() }).then(handleResponse),
};

// ─── User ────────────────────────────────────────────────
export const userApi = {
  getAll: () =>
    fetch(`${API_BASE}/user`, { headers: headers() }).then(handleResponse),
  create: (data) =>
    fetch(`${API_BASE}/user`, { method: 'POST', headers: headers(), body: JSON.stringify(data) }).then(handleResponse),
  update: (id, data) =>
    fetch(`${API_BASE}/user/${id}`, { method: 'PUT', headers: headers(), body: JSON.stringify(data) }).then(handleResponse),
  delete: (id) =>
    fetch(`${API_BASE}/user/${id}`, { method: 'DELETE', headers: headers() }).then(handleResponse),
};

// ─── Log ─────────────────────────────────────────────────
export const logApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/log${qs ? '?' + qs : ''}`, { headers: headers() }).then(handleResponse);
  },
};

export const notifikasiApi = {
  getAll: () => fetch(`${API_BASE}/notifikasi`, { headers: headers() }).then(handleResponse),
  markAsRead: (id) => fetch(`${API_BASE}/notifikasi/${id}/read`, { method: 'PUT', headers: headers() }).then(handleResponse),
  markAllAsRead: () => fetch(`${API_BASE}/notifikasi/read-all`, { method: 'PUT', headers: headers() }).then(handleResponse),
};

// ─── Backup ──────────────────────────────────────────────────
export const backupApi = {
  getAll: () =>
    fetch(`${API_BASE}/backup`, { headers: headers() }).then(handleResponse),
  create: () =>
    fetch(`${API_BASE}/backup`, { method: 'POST', headers: headers() }).then(handleResponse),
  download: (filename) =>
    fetch(`${API_BASE}/backup/download/${filename}`, { headers: headers() }).then(res => {
      if (!res.ok) throw new Error('Gagal mengunduh backup');
      return res.blob();
    }),
  delete: (filename) =>
    fetch(`${API_BASE}/backup/${filename}`, { method: 'DELETE', headers: headers() }).then(handleResponse),
};

export const resetApi = {
  getPending: () =>
    fetch(`${API_BASE}/reset/pending`, { headers: headers() }).then(handleResponse),
  getHistory: () =>
    fetch(`${API_BASE}/reset/history`, { headers: headers() }).then(handleResponse),
  approve: (data) =>
    fetch(`${API_BASE}/reset/approve`, { method: 'POST', headers: headers(), body: JSON.stringify(data) }).then(handleResponse),
  ignore: (data) =>
    fetch(`${API_BASE}/reset/ignore`, { method: 'POST', headers: headers(), body: JSON.stringify(data) }).then(handleResponse),
};