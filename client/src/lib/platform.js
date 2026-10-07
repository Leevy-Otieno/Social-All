// platform.js — Detects if running inside Capacitor (Android/iOS) or web browser
// Returns the correct base URLs for API, WebSocket, and storage

const PRODUCTION_URL = 'https://youbgram.ybtshop.com'

/**
 * Check if we're running inside a Capacitor native app
 */
export function isNativePlatform() {
  if (typeof window === 'undefined') return false;
  
  // Direct Capacitor check
  const isCap = !!(window.Capacitor && window.Capacitor.getPlatform && window.Capacitor.getPlatform() !== 'web');
  
  // Native WebView specific protocols
  const isNativeProtocol = window.location.protocol === 'file:' ||
                           window.location.protocol === 'capacitor:';
                      
  return isCap || isNativeProtocol;
}

/**
 * Get the base URL for API requests
 * - Web: relative path (same-origin)
 * - Native: absolute production URL
 */
export function getApiBaseUrl() {
  return isNativePlatform() ? `${PRODUCTION_URL}/api/v1` : '/api/v1'
}

/**
 * Get the base URL for admin API requests
 */
export function getAdminApiBaseUrl() {
  return isNativePlatform() ? `${PRODUCTION_URL}/admin/api` : '/admin/api'
}

/**
 * Get the base URL for storage/images
 * - Web: relative path
 * - Native: absolute production URL
 */
export function getStorageBaseUrl() {
  return isNativePlatform() ? `${PRODUCTION_URL}/storage` : '/storage'
}

/**
 * Get the WebSocket URL
 * - Web: auto-detect from window.location
 * - Native: production WebSocket URL
 */
export function getWebSocketUrl(token) {
  if (isNativePlatform()) {
    return `wss://youbgram.ybtshop.com/ws?token=${token}`
  }
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
  return `${proto}://${window.location.host}/ws?token=${token}`
}
