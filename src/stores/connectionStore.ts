import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_API_URL, DEFAULT_WS_URL, setConnectionConfig } from '@/lib/connectionConfig'

interface ConnectionState {
  apiBaseUrl: string
  wsUrl: string
  setApiBaseUrl: (url: string) => void
  setWsUrl: (url: string) => void
}

export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set) => ({
      apiBaseUrl: DEFAULT_API_URL,
      wsUrl: DEFAULT_WS_URL,
      setApiBaseUrl: (url) => {
        set({ apiBaseUrl: url })
        setConnectionConfig({ apiBaseUrl: url })
      },
      setWsUrl: (url) => {
        set({ wsUrl: url })
        setConnectionConfig({ wsUrl: url })
      },
    }),
    { name: 'gochat-mobile-connection' },
  ),
)

;(function initConnectionConfig() {
  try {
    const stored = localStorage.getItem('gochat-mobile-connection')
    if (stored) {
      const parsed = JSON.parse(stored) as { state?: { apiBaseUrl?: string; wsUrl?: string } }
      setConnectionConfig({
        apiBaseUrl: parsed.state?.apiBaseUrl ?? DEFAULT_API_URL,
        wsUrl: parsed.state?.wsUrl ?? DEFAULT_WS_URL,
      })
      return
    }
  } catch {
    // Ignore malformed persisted config and fall back to supported production server.
  }
  setConnectionConfig({ apiBaseUrl: DEFAULT_API_URL, wsUrl: DEFAULT_WS_URL })
})()
