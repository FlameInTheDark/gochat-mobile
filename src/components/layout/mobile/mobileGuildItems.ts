import { useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { userApi } from '@/api/client'
import { useFolderStore, type GuildFolder } from '@/stores/folderStore'
import type { DtoGuild } from '@/types'
import { preloadGuildIcons } from './CachedGuildIcon'

export type MobileGuildItem =
  | { kind: 'guild'; guild: DtoGuild }
  | { kind: 'folder'; folder: GuildFolder; guilds: DtoGuild[] }

export function colorToHex(color: number): string {
  return color ? `#${color.toString(16).padStart(6, '0')}` : ''
}

export function useMobileGuildItems() {
  const folders = useFolderStore((s) => s.folders)
  const itemOrder = useFolderStore((s) => s.itemOrder)
  const settingsVersion = useFolderStore((s) => s.settingsVersion)
  const syncGuilds = useFolderStore((s) => s.syncGuilds)

  const { data: guilds = [] } = useQuery({
    queryKey: ['guilds'],
    queryFn: () => userApi.userMeGuildsGet().then((r) => r.data ?? []),
    staleTime: 5 * 60_000,
    gcTime: 60 * 60_000,
  })

  useEffect(() => {
    syncGuilds(guilds.map((guild) => String(guild.id)))
  }, [guilds, settingsVersion, syncGuilds])

  useEffect(() => {
    preloadGuildIcons(guilds)
  }, [guilds])

  const guildMap = useMemo(
    () => new Map<string, DtoGuild>(guilds.map((guild) => [String(guild.id), guild])),
    [guilds],
  )

  const orderedItems = useMemo<MobileGuildItem[]>(() => {
    return itemOrder
      .map((entry): MobileGuildItem | null => {
        if (entry.startsWith('folder:')) {
          const folder = folders.find((item) => item.id === entry.slice(7))
          if (!folder) return null
          const folderGuilds = folder.guildIds
            .map((id) => guildMap.get(id))
            .filter((guild): guild is DtoGuild => !!guild)
          return { kind: 'folder', folder, guilds: folderGuilds }
        }
        if (entry.startsWith('guild:')) {
          const guild = guildMap.get(entry.slice(6))
          return guild ? { kind: 'guild', guild } : null
        }
        return null
      })
      .filter((item): item is MobileGuildItem => item !== null)
  }, [folders, guildMap, itemOrder])

  return { guilds, orderedItems }
}
