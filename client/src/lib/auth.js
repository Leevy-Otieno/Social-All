const TOKEN_KEY = 'sa_token'
const ADMIN_KEY = 'sa_admin_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ADMIN_KEY)
}

export function getAdminToken() {
  return localStorage.getItem(ADMIN_KEY)
}

export function setAdminToken(token) {
  localStorage.setItem(ADMIN_KEY, token)
}

export function isAdmin() {
  return !!getAdminToken()
}
