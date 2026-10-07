import axios from 'axios'
import { getToken, getAdminToken, clearToken } from './auth'
import { getApiBaseUrl, getAdminApiBaseUrl } from './platform'

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const t = getToken()
  if (t) config.headers.Authorization = `Bearer ${t}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      clearToken()
      window.location.href = '/login'
    }
    if (err.response?.status === 503 && err.response?.data?.message) {
      alert(err.response.data.message)
    }
    return Promise.reject(err)
  }
)

const adminApi = axios.create({
  baseURL: getAdminApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
})

adminApi.interceptors.request.use((config) => {
  const t = getAdminToken()
  if (t) config.headers.Authorization = `Bearer ${t}`
  return config
})

adminApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      clearToken()
      window.location.href = '/admin'
    }
    return Promise.reject(err)
  }
)

// Auth
export const authAPI = {
  googleLogin: (idToken) => api.post('/auth/google', { idToken }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  step1: (data) => api.post('/auth/setup/step1', data),
  step2: (data) => api.post('/auth/setup/step2', data),
  step3: () => api.post('/auth/setup/step3'),
}

// Feed + Posts
export const feedAPI = {
  getFeed: (page = 1, params = {}) => api.get('/feed', { params: { page, ...params } }),
  getSuggestions: () => api.get('/feed/suggestions'),
}

export const postAPI = {
  create: (formData, onProgress) => api.post('/posts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress || undefined,
  }),
  get: (id) => api.get(`/posts/${id}`),
  remove: (id) => api.delete(`/posts/${id}`),
  like: (id) => api.post(`/posts/${id}/like`),
  unlike: (id) => api.delete(`/posts/${id}/like`),
  report: (target_id, reason) => api.post('/reports', { target_id, reason }),
  getSuggestions: () => api.get('/feed/suggestions'),
}

// Comments
export const commentAPI = {
  get: (postId) => api.get(`/posts/${postId}/comments`),
  create: (postId, text) => api.post(`/posts/${postId}/comments`, { text }),
  reply: (commentId, text) => api.post(`/comments/${commentId}/replies`, { text }),
  like: (id) => api.post(`/comments/${id}/like`),
  unlike: (id) => api.delete(`/comments/${id}/like`),
  remove: (id) => api.delete(`/comments/${id}`),
}

// Profile
export const profileAPI = {
  get: (username) => api.get(`/profile/${username}`),
  update: (data, onProgress) => api.put('/profile/update', data, {
    onUploadProgress: onProgress || undefined,
  }),
  getPosts: (username) => api.get(`/profile/${username}/posts`),
  follow: (id) => api.post(`/profile/follow/${id}`),
  unfollow: (id) => api.delete(`/profile/follow/${id}`),
  analytics: (params = {}) => api.get('/profile/analytics', { params }),
  getFollowers: (userId) => api.get(`/profile/${userId}/followers`),
  getFollowing: (userId) => api.get(`/profile/${userId}/following`),
}

// Explore
export const exploreAPI = {
  posts: (page = 1) => api.get('/explore/posts', { params: { page } }),
  users: (page = 1) => api.get('/explore/users', { params: { page } }),
  search: (q) => api.get('/explore/search', { params: { q } }),
}

// Notifications
export const notifAPI = {
  get: () => api.get('/notifications'),
  readAll: () => api.post('/notifications/read-all'),
  remove: (id) => api.delete(`/notifications/${id}`),
}

// Chat
export const chatAPI = {
  getConvs: () => api.get('/conversations'),
  getMessages: (id) => api.get(`/conversations/${id}`),
  send: (userId, text) => api.post(`/conversations/${userId}`, { text }),
  removeConv: (id) => api.delete(`/conversations/${id}`),
  markRead: (convId) => api.get(`/conversations/${convId}`), // GET already marks read server-side
}

// Ads
export const adAPI = {
  impression: (id) => api.post(`/ads/${id}/impression`),
  click: (id) => api.post(`/ads/${id}/click`),
}

// Config
export const configAPI = {
  get: () => api.get('/config'),
}

// Leaderboard & XP
export const leaderboardAPI = {
  get: (page = 1) => api.get('/leaderboard', { params: { page } }),
}

export const xpAPI = {
  getMyXP: () => api.get('/xp/me'),
}

export const systemAPI = {
  getLimits: () => api.get('/system-limits'),
}

// Admin
export const adminAPI = {
  googleLogin: (idToken) => adminApi.post('/auth/google', { idToken }),
  dashboard: () => adminApi.get('/dashboard'),
  users: (params) => adminApi.get('/users', { params }),
  user: (id) => adminApi.get(`/users/${id}`),
  ban: (id, reason) => adminApi.post(`/users/${id}/ban`, { reason }),
  unban: (id) => adminApi.post(`/users/${id}/unban`),
  verify: (id) => adminApi.post(`/users/${id}/verify`),
  deleteUser: (id) => adminApi.delete(`/users/${id}`),
  posts: (params) => adminApi.get('/posts', { params }),
  deletePost: (id) => adminApi.delete(`/posts/${id}`),
  togglePost: (id) => adminApi.post(`/posts/${id}/toggle`),
  reports: (params) => adminApi.get('/reports', { params }),
  report: (id) => adminApi.get(`/reports/${id}`),
  actionReport: (id, note) => adminApi.post(`/reports/${id}/action`, { admin_note: note }),
  dismissReport: (id, note) => adminApi.post(`/reports/${id}/dismiss`, { admin_note: note }),
  ads: () => adminApi.get('/ads'),
  createAd: (formData) => adminApi.post('/ads', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateAd: (id, data) => adminApi.put(`/ads/${id}`, data),
  deleteAd: (id) => adminApi.delete(`/ads/${id}`),
  toggleAd: (id) => adminApi.post(`/ads/${id}/toggle`),
  announcements: () => adminApi.get('/announcements'),
  createAnnouncement: (data) => adminApi.post('/announcements', data),
  deleteAnnouncement: (id) => adminApi.delete(`/announcements/${id}`),
  settings: () => adminApi.get('/settings'),
  updateSettings: (data) => adminApi.post('/settings', data),
  updateLimit: (data) => adminApi.put('/limits', data),
  // XP Management
  getXp: (params) => adminApi.get('/xp', { params }),
  editUserXp: (userId, xp) => adminApi.put('/xp/user', { userId, xp }),
  deleteXpTx: (id) => adminApi.delete(`/xp/${id}`),
}
