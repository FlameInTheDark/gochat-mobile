import { useEffect, useMemo, useState } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { DtoGuild } from '@/types'
import { cn } from '@/lib/utils'

const loadedImageUrls = new Set<string>()
const loadingImages = new Map<string, Promise<void>>()

export function preloadGuildIcon(url?: string | null) {
  if (!url || loadedImageUrls.has(url) || loadingImages.has(url)) return

  const promise = new Promise<void>((resolve) => {
    const image = new Image()
    image.onload = () => {
      loadedImageUrls.add(url)
      loadingImages.delete(url)
      resolve()
    }
    image.onerror = () => {
      loadingImages.delete(url)
      resolve()
    }
    image.src = url
  })
  loadingImages.set(url, promise)
}

export function preloadGuildIcons(guilds: DtoGuild[]) {
  guilds.forEach((guild) => preloadGuildIcon(guild.icon?.url))
}

export function guildInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function CachedGuildIcon({
  guild,
  className,
  fallbackClassName,
}: {
  guild: DtoGuild
  className?: string
  fallbackClassName?: string
}) {
  const name = guild.name ?? 'Server'
  const src = guild.icon?.url ?? null
  const [loaded, setLoaded] = useState(() => !!src && loadedImageUrls.has(src))

  useEffect(() => {
    if (!src) {
      setLoaded(false)
      return
    }
    if (loadedImageUrls.has(src)) {
      setLoaded(true)
      return
    }
    let cancelled = false
    preloadGuildIcon(src)
    loadingImages.get(src)?.then(() => {
      if (!cancelled) setLoaded(loadedImageUrls.has(src))
    })
    return () => {
      cancelled = true
    }
  }, [src])

  const initials = useMemo(() => guildInitials(name) || 'S', [name])

  return (
    <Avatar className={cn('relative overflow-hidden rounded-2xl', className)}>
      {src && loaded ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          draggable={false}
          decoding="async"
        />
      ) : null}
      {!src || !loaded ? (
        <AvatarFallback className={cn('h-full w-full rounded-2xl bg-muted text-xs font-bold text-foreground', fallbackClassName)}>
          {initials}
        </AvatarFallback>
      ) : null}
    </Avatar>
  )
}
