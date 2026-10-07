import { useState, useEffect, useRef, useCallback } from 'react'
import { getWebSocketUrl } from '../lib/platform'

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const m = window.matchMedia(query)
    const handler = (e) => setMatches(e.matches)
    m.addEventListener('change', handler)
    return () => m.removeEventListener('change', handler)
  }, [query])
  return matches
}

/**
 * useWebSocket
 * @param {string} token  - JWT auth token
 * @param {function} onMessage - called with parsed JSON message
 * @returns {{ send, ws }} - send(payload) function and ws ref
 */
export function useWebSocket(token, onMessage) {
  const wsRef = useRef(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!token) return
    const socket = new WebSocket(getWebSocketUrl(token))
    wsRef.current = socket

    socket.onopen = () => setConnected(true)
    socket.onmessage = (e) => {
      try { onMessage(JSON.parse(e.data)) } catch {}
    }
    socket.onclose = () => {
      setConnected(false)
      wsRef.current = null
    }
    return () => socket.close()
  }, [token])

  const send = useCallback((payload) => {
    if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(JSON.stringify(payload))
    }
  }, [])

  return { send, connected }
}
