import { useNavigate } from 'react-router-dom'
import { Compass, Folder, Plus } from 'lucide-react'
import CachedGuildIcon from './CachedGuildIcon'
import { colorToHex, useMobileGuildItems } from './mobileGuildItems'
import { useMentionStore } from '@/stores/mentionStore'
import { useFolderStore, type GuildFolder } from '@/stores/folderStore'
import { useUiStore } from '@/stores/uiStore'
import { useUnreadStore } from '@/stores/unreadStore'
import { cn } from '@/lib/utils'
import type { DtoGuild } from '@/types'
import logoUrl from '@/assets/logo.svg'

interface Props {
  activeServerId?: string | null
}

function RailGuildButton({
  guild,
  active,
  onClick,
  nested = false,
}: {
  guild: DtoGuild
  active: boolean
  onClick: () => void
  nested?: boolean
}) {
  const guildId = String(guild.id)
  const unread = useUnreadStore((s) => s.isGuildUnread(guildId))
  const mentionCount = useMentionStore((s) => s.getGuildMentionCount(guildId))
  const name = guild.name ?? 'Server'

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={name}
      className="group relative flex h-14 w-full items-center justify-center"
    >
      <span
        className={cn(
          'absolute w-1 rounded-r-full bg-foreground transition-all',
          nested ? '-left-1' : 'left-0',
          active ? 'h-9' : unread || mentionCount > 0 ? 'h-3' : 'h-0',
        )}
      />
      <CachedGuildIcon
        guild={guild}
        className={cn(
          'h-12 w-12 transition-all group-active:scale-95',
          active ? 'ring-2 ring-primary/70' : '',
        )}
      />
      {mentionCount > 0 ? (
        <span className="absolute bottom-0 right-2 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-sidebar bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground">
          {mentionCount > 99 ? '99+' : mentionCount}
        </span>
      ) : unread ? (
        <span className="absolute bottom-1.5 right-3 h-3 w-3 rounded-full border-2 border-sidebar bg-foreground" />
      ) : null}
    </button>
  )
}

function RailFolderButton({ folder, guilds }: { folder: GuildFolder; guilds: DtoGuild[] }) {
  const toggleCollapse = useFolderStore((s) => s.toggleCollapse)
  const unread = useUnreadStore((s) => guilds.some((guild) => s.isGuildUnread(String(guild.id))))
  const mentionCount = useMentionStore((s) =>
    guilds.reduce((total, guild) => total + s.getGuildMentionCount(String(guild.id)), 0),
  )
  const colorHex = colorToHex(folder.color)
  const style = colorHex ? { backgroundColor: `${colorHex}28`, color: colorHex } : undefined

  return (
    <button
      type="button"
      onClick={() => toggleCollapse(folder.id)}
      aria-label={folder.name || 'Server folder'}
      className="group relative flex h-14 w-full items-center justify-center"
    >
      <span
        className={cn(
          'absolute left-0 w-1 rounded-r-full bg-foreground transition-all',
          unread || mentionCount > 0 ? 'h-3' : 'h-0',
        )}
      />
      <span
        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground transition-all group-active:scale-95"
        style={style}
      >
        {guilds.length > 0 ? (
          <span className="grid grid-cols-2 gap-[3px]">
            {guilds.slice(0, 4).map((guild) => (
              <CachedGuildIcon
                key={String(guild.id)}
                guild={guild}
                className="h-4 w-4 rounded-[4px] bg-background/80"
                fallbackClassName="rounded-[4px] text-[7px]"
              />
            ))}
          </span>
        ) : (
          <Folder className="h-5 w-5" />
        )}
      </span>
      {mentionCount > 0 ? (
        <span className="absolute bottom-0 right-2 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-sidebar bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground">
          {mentionCount > 99 ? '99+' : mentionCount}
        </span>
      ) : null}
    </button>
  )
}

export default function MobileServerRail({ activeServerId }: Props) {
  const navigate = useNavigate()
  const openCreateServer = useUiStore((s) => s.openCreateServer)
  const { orderedItems } = useMobileGuildItems()
  const discoveryActive = activeServerId === 'discovery'

  return (
    <aside
      className="flex h-full w-[72px] shrink-0 flex-col items-center border-r border-sidebar-border bg-sidebar pt-[max(0.75rem,env(safe-area-inset-top))]"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}
    >
      <button
        type="button"
        onClick={() => navigate('/app/@me')}
        aria-label="Direct messages"
        className="group relative flex h-14 w-full items-center justify-center"
      >
        <span
          className={cn(
            'absolute left-0 w-1 rounded-r-full bg-foreground transition-all',
            activeServerId === '@me' ? 'h-9' : 'h-0',
          )}
        />
        <span
          className={cn(
            'squircle flex h-12 w-12 items-center justify-center overflow-hidden transition-all group-active:scale-95',
            activeServerId === '@me'
              ? 'bg-indigo-500 text-white'
              : 'bg-muted text-primary-foreground group-hover:bg-indigo-500 group-hover:text-white',
          )}
        >
          <img src={logoUrl} alt="" className="h-9 w-9 object-contain" draggable={false} />
        </span>
      </button>

      <div className="my-2 h-px w-8 bg-sidebar-border" />

      <div className="min-h-0 w-full flex-1 overflow-y-auto overscroll-contain pb-2">
        <div className="space-y-1">
          {orderedItems.map((item) => {
            if (item.kind === 'folder') {
              const expanded = !item.folder.collapsed
              const colorHex = colorToHex(item.folder.color)
              return (
                <div
                  key={item.folder.id}
                  className={cn(
                    'mx-1 space-y-1 rounded-[24px] py-1 transition-colors',
                    expanded && 'bg-muted/25 ring-1 ring-sidebar-border/60',
                  )}
                  style={expanded && colorHex ? { backgroundColor: `${colorHex}10` } : undefined}
                >
                  <RailFolderButton folder={item.folder} guilds={item.guilds} />
                  {expanded
                    ? (
                        <div className="space-y-1 pb-1">
                          {item.guilds.map((guild) => {
                            const guildId = String(guild.id)
                            return (
                              <div key={guildId} className="relative">
                                <RailGuildButton
                                  guild={guild}
                                  active={activeServerId === guildId}
                                  onClick={() => navigate(`/app/${guildId}`)}
                                  nested
                                />
                              </div>
                            )
                          })}
                        </div>
                      )
                    : null}
                </div>
              )
            }
            const guildId = String(item.guild.id)
            return (
              <RailGuildButton
                key={guildId}
                guild={item.guild}
                active={activeServerId === guildId}
                onClick={() => navigate(`/app/${guildId}`)}
              />
            )
          })}
        </div>
      </div>

      <div className="mt-auto flex w-full flex-col items-center gap-1 border-t border-sidebar-border pt-2">
        <button
          type="button"
          onClick={() => navigate('/app/discovery')}
          aria-label="Discover servers"
          className={cn(
            'relative flex h-12 w-12 items-center justify-center rounded-2xl transition-colors active:scale-95',
            discoveryActive
              ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
              : 'bg-muted text-muted-foreground active:bg-emerald-500/15 active:text-emerald-500',
          )}
        >
          <span
            className={cn(
              'absolute -left-3 w-1 rounded-r-full bg-foreground transition-all',
              discoveryActive ? 'h-8' : 'h-0',
            )}
          />
          <Compass className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={openCreateServer}
          aria-label="Create server"
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-green-500 transition-colors active:bg-green-500/15"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </aside>
  )
}
