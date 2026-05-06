import { useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, ChevronRight, Folder, MessageCircle, Users } from 'lucide-react'
import CachedGuildIcon from './CachedGuildIcon'
import { colorToHex, useMobileGuildItems } from './mobileGuildItems'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useMentionStore } from '@/stores/mentionStore'
import { useUnreadStore } from '@/stores/unreadStore'
import { useFolderStore, type GuildFolder } from '@/stores/folderStore'
import { cn } from '@/lib/utils'
import type { DtoGuild } from '@/types'
import MobileServerRail from './MobileServerRail'
import UserArea from '@/components/layout/UserArea'

function ServerRow({ guild, onClick }: { guild: DtoGuild; onClick: () => void }) {
  const guildId = String(guild.id)
  const unread = useUnreadStore((s) => s.isGuildUnread(guildId))
  const mentionCount = useMentionStore((s) => s.getGuildMentionCount(guildId))
  const name = guild.name ?? 'Server'

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[64px] w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors active:bg-accent"
    >
      <div className="relative shrink-0">
        <CachedGuildIcon guild={guild} className="h-12 w-12" />
        {mentionCount > 0 ? (
          <span className="absolute -bottom-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-background bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {mentionCount > 99 ? '99+' : mentionCount}
          </span>
        ) : unread ? (
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-foreground" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-sm font-semibold', unread || mentionCount > 0 ? 'text-foreground' : 'text-muted-foreground')}>
          {name}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {mentionCount > 0 ? `${mentionCount} mention${mentionCount === 1 ? '' : 's'}` : unread ? 'Unread messages' : 'No new activity'}
        </p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
    </button>
  )
}

function FolderRow({ folder, guilds }: { folder: GuildFolder; guilds: DtoGuild[] }) {
  const toggleCollapse = useFolderStore((s) => s.toggleCollapse)
  const colorHex = colorToHex(folder.color)
  const unread = useUnreadStore((s) => guilds.some((guild) => s.isGuildUnread(String(guild.id))))
  const mentionCount = useMentionStore((s) =>
    guilds.reduce((total, guild) => total + s.getGuildMentionCount(String(guild.id)), 0),
  )

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => toggleCollapse(folder.id)}
        className="flex min-h-[64px] w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors active:bg-accent"
      >
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground"
          style={colorHex ? { backgroundColor: `${colorHex}28`, color: colorHex } : undefined}
        >
          {guilds.length > 0 ? (
            <div className="grid grid-cols-2 gap-[3px]">
              {guilds.slice(0, 4).map((guild) => (
                <CachedGuildIcon
                  key={String(guild.id)}
                  guild={guild}
                  className="h-4 w-4 rounded-[4px] bg-background/80"
                  fallbackClassName="rounded-[4px] text-[7px]"
                />
              ))}
            </div>
          ) : (
            <Folder className="h-5 w-5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn('truncate text-sm font-semibold', unread || mentionCount > 0 ? 'text-foreground' : 'text-muted-foreground')}>
            {folder.name || 'Folder'}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {guilds.length} server{guilds.length === 1 ? '' : 's'}
            {mentionCount > 0 ? ` · ${mentionCount} mention${mentionCount === 1 ? '' : 's'}` : ''}
          </p>
        </div>
        <ChevronDown className={cn('h-5 w-5 shrink-0 text-muted-foreground transition-transform', folder.collapsed && '-rotate-90')} />
      </button>
    </div>
  )
}

export default function MobileServerHome() {
  const navigate = useNavigate()
  const { orderedItems } = useMobileGuildItems()

  return (
    <div className="flex h-full w-full bg-background">
      <MobileServerRail activeServerId={null} />
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-[64px] shrink-0 items-center border-b border-border/70 px-4 pt-[env(safe-area-inset-top)]">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold tracking-tight">GoChat</h1>
            <p className="truncate text-xs text-muted-foreground">Messages and servers</p>
          </div>
        </header>

        <ScrollArea className="flex-1">
          <div className="space-y-5 px-4 pb-6 pt-4">
            <section className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => navigate('/app/@me')}
                className="flex min-h-[92px] flex-col justify-between rounded-2xl bg-muted/60 p-4 text-left transition-colors active:bg-accent"
              >
                <MessageCircle className="h-6 w-6 text-primary" />
                <span className="text-sm font-semibold">Direct messages</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/app/@me')}
                className="flex min-h-[92px] flex-col justify-between rounded-2xl bg-muted/60 p-4 text-left transition-colors active:bg-accent"
              >
                <Users className="h-6 w-6 text-primary" />
                <span className="text-sm font-semibold">Friends</span>
              </button>
            </section>

            <section>
              <div className="mb-2 flex items-center justify-between px-1">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Servers</h2>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                {orderedItems.map((item) => {
                  if (item.kind === 'folder') {
                    return (
                      <div key={item.folder.id}>
                        <FolderRow folder={item.folder} guilds={item.guilds} />
                        {!item.folder.collapsed ? (
                          <div className="ml-4 border-l border-border/70 pl-2">
                            {item.guilds.map((guild) => (
                              <ServerRow
                                key={String(guild.id)}
                                guild={guild}
                                onClick={() => navigate(`/app/${String(guild.id)}`)}
                              />
                            ))}
                          </div>
                        ) : null}
                      </div>
                    )
                  }
                  return (
                    <ServerRow
                      key={String(item.guild.id)}
                      guild={item.guild}
                      onClick={() => navigate(`/app/${String(item.guild.id)}`)}
                    />
                  )
                })}
              </div>
            </section>
          </div>
        </ScrollArea>

        <div
          className="shrink-0 border-t border-border/70 px-3 pt-2"
          style={{ paddingBottom: 'calc(max(1rem, env(safe-area-inset-bottom, 0px)) + var(--keyboard-height, 0px))' }}
        >
          <UserArea />
        </div>
      </main>
    </div>
  )
}
