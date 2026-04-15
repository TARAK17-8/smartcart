import { useState, useEffect, useRef, useCallback } from 'react'

export default function useSSE() {
  const [lastEvent, setLastEvent] = useState(null)
  const [connected, setConnected] = useState(false)
  const esRef = useRef(null)
  const reconnectTimer = useRef(null)

  const connect = useCallback(() => {
    // Clean up existing connection
    if (esRef.current) {
      esRef.current.close()
    }

    const es = new EventSource('/api/events')
    esRef.current = es

    es.onopen = () => {
      setConnected(true)
      console.log('📡 SSE connected')
    }

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type !== 'connected') {
          setLastEvent(data)
        }
      } catch (e) {
        console.warn('SSE parse error:', e)
      }
    }

    es.onerror = () => {
      setConnected(false)
      es.close()
      // Auto-reconnect after 3 seconds
      reconnectTimer.current = setTimeout(() => {
        console.log('📡 SSE reconnecting...')
        connect()
      }, 3000)
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      if (esRef.current) esRef.current.close()
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
    }
  }, [connect])

  return { lastEvent, connected }
}
