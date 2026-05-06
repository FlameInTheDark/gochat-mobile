import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'
import { LocalNotifications } from '@capacitor/local-notifications'
import { PushNotifications } from '@capacitor/push-notifications'

const CHANNEL_ID = 'gochat_notifications'
const TOKEN_EVENT = 'gochat:push-token'
const ENABLE_REMOTE_PUSH = import.meta.env.VITE_ENABLE_PUSH_NOTIFICATIONS === 'true'

export interface NativeNotificationData {
  path?: string
  url?: string
  guildId?: string | number
  channelId?: string | number
  userId?: string | number
  type?: string
  [key: string]: unknown
}

interface InitializeOptions {
  onOpen?: (data: NativeNotificationData) => void
  onToken?: (token: string) => void
}

interface LocalNotificationOptions {
  title: string
  body: string
  data?: NativeNotificationData
}

let initPromise: Promise<void> | null = null
let openHandler: InitializeOptions['onOpen']
let tokenHandler: InitializeOptions['onToken']
let isActive = true
let notificationId = Math.floor(Date.now() % 2_000_000_000)

function isNative() {
  return Capacitor.isNativePlatform()
}

function normalizeData(data: unknown): NativeNotificationData {
  if (!data || typeof data !== 'object') return {}
  return data as NativeNotificationData
}

function nextNotificationId() {
  notificationId = (notificationId + 1) % 2_000_000_000
  return notificationId
}

function handleNotificationOpen(data: unknown) {
  openHandler?.(normalizeData(data))
}

export function notificationDataToPath(data: NativeNotificationData) {
  const directPath = typeof data.path === 'string' ? data.path : undefined
  if (directPath?.startsWith('/app')) return directPath

  if (typeof data.url === 'string') {
    try {
      const url = new URL(data.url, window.location.origin)
      if (url.origin === window.location.origin && url.pathname.startsWith('/app')) {
        return `${url.pathname}${url.search}${url.hash}`
      }
    } catch {
      // Ignore malformed push payload URLs.
    }
  }

  if (data.userId != null) return `/app/@me/${String(data.userId)}`
  if (data.guildId != null && data.channelId != null) {
    return `/app/${String(data.guildId)}/${String(data.channelId)}`
  }
  if (data.guildId != null) return `/app/${String(data.guildId)}`

  return null
}

export function isAppActive() {
  return !isNative() || (isActive && document.visibilityState === 'visible')
}

export async function initializeNativeNotifications(options: InitializeOptions = {}) {
  openHandler = options.onOpen ?? openHandler
  tokenHandler = options.onToken ?? tokenHandler

  if (!isNative()) return
  if (initPromise) return initPromise

  initPromise = (async () => {
    await CapacitorApp.addListener('appStateChange', ({ isActive: nextIsActive }) => {
      isActive = nextIsActive
    })

    const localPermission = await LocalNotifications.requestPermissions()
    if (localPermission.display === 'granted' && Capacitor.getPlatform() === 'android') {
      await LocalNotifications.createChannel({
        id: CHANNEL_ID,
        name: 'GoChat',
        description: 'Messages, mentions, friend requests, and server activity.',
        importance: 5,
        visibility: 1,
        lights: true,
        lightColor: '#5865f2',
        vibration: true,
      })
    }

    await LocalNotifications.addListener('localNotificationActionPerformed', (event) => {
      handleNotificationOpen(event.notification.extra)
    })

    if (ENABLE_REMOTE_PUSH) {
      await PushNotifications.addListener('registration', ({ value }) => {
        tokenHandler?.(value)
        window.dispatchEvent(new CustomEvent(TOKEN_EVENT, {
          detail: { token: value, platform: Capacitor.getPlatform() },
        }))
      })

      await PushNotifications.addListener('registrationError', (error) => {
        console.warn('Push notification registration failed', error.error)
      })

      await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        window.dispatchEvent(new CustomEvent('gochat:push-received', { detail: notification }))
      })

      await PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
        handleNotificationOpen(event.notification.data)
      })

      const pushPermission = await PushNotifications.requestPermissions()
      if (pushPermission.receive === 'granted') {
        await PushNotifications.register()
      }
    }
  })().catch((error) => {
    initPromise = null
    console.warn('Native notification setup failed', error)
  })

  return initPromise
}

export async function showNativeLocalNotification(options: LocalNotificationOptions) {
  if (!isNative()) return false

  await initializeNativeNotifications()
  const permission = await LocalNotifications.checkPermissions()
  if (permission.display !== 'granted') return false

  await LocalNotifications.schedule({
    notifications: [{
      id: nextNotificationId(),
      title: options.title,
      body: options.body,
      channelId: CHANNEL_ID,
      extra: options.data ?? {},
      sound: 'default',
    }],
  })

  return true
}
