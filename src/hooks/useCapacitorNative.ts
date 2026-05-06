import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { Keyboard } from '@capacitor/keyboard'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'
import { resumeWebSocketFromBackground } from '@/services/wsService'

function routeFromDeepLink(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'gochat:') return `/${parsed.hostname}${parsed.pathname}`
    if (parsed.pathname.startsWith('/invite/')) return parsed.pathname
    return null
  } catch {
    return null
  }
}

export function useCapacitorNative() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    document.documentElement.classList.add('capacitor-native')

    void StatusBar.setStyle({ style: Style.Dark })
    void StatusBar.setBackgroundColor({ color: '#0b1018' })
    void SplashScreen.hide()

    const subscriptions: Array<{ remove: () => Promise<void> }> = []

    void CapacitorApp.addListener('appUrlOpen', ({ url }) => {
      const route = routeFromDeepLink(url)
      if (route) window.location.assign(route)
    }).then((sub) => subscriptions.push(sub))

    void CapacitorApp.addListener('backButton', () => {
      if (window.location.pathname === '/' || window.location.pathname === '/app') {
        void CapacitorApp.minimizeApp()
        return
      }

      if (window.history.length > 1) {
        window.history.back()
      } else {
        window.location.replace('/app')
      }
    }).then((sub) => subscriptions.push(sub))

    void CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) resumeWebSocketFromBackground()
    }).then((sub) => subscriptions.push(sub))

    void Keyboard.addListener('keyboardWillShow', ({ keyboardHeight }) => {
      document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`)
    }).then((sub) => subscriptions.push(sub))

    void Keyboard.addListener('keyboardWillHide', () => {
      document.documentElement.style.setProperty('--keyboard-height', '0px')
    }).then((sub) => subscriptions.push(sub))

    const onPointerUp = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null
      if (!target?.closest('button,a,[role="button"],input,textarea,select')) return
      void Haptics.impact({ style: ImpactStyle.Light }).catch(() => undefined)
    }

    window.addEventListener('pointerup', onPointerUp, { passive: true })

    return () => {
      window.removeEventListener('pointerup', onPointerUp)
      for (const sub of subscriptions) void sub.remove()
      document.documentElement.classList.remove('capacitor-native')
    }
  }, [])
}
