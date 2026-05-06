import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, Hash, Plus, Search, Settings, UserPlus, Volume2 } from 'lucide-react'
import { guildApi, rolesApi } from '@/api/client'
import { ScrollArea } from '@/components/ui/scroll-area'
import UserArea from '@/components/layout/UserArea'
import VoicePanel from '@/components/voice/VoicePanel'
import { useAuthStore } from '@/stores/authStore'
import { useMentionStore } from '@/stores/mentionStore'
import { useUiStore } from '@/stores/uiStore'
import { useUnreadStore } from '@/stores/unreadStore'
import { ChannelType, type DtoChannel, type DtoGuild } from '@/types'
import type { DtoMember, DtoRole } from '@/client'
import { calculateEffectivePermissions, hasPermission, PermissionBits } from '@/lib/permissions'
import { cn } from '@/lib/utils'

interface Props {
  channels: DtoChannel[]
  serverId: string
}

function sortChannels(channels: DtoChannel[]) {
  return [...channels].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
}

export default function MobileChannelNavigator({ channels, serverId }: Props) {
  const { channelId: activeChannelId } = useParams<{ channelId?: string }>()
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)
  const openCreateChannel = useUiStore((s) => s.openCreateChannel)
  const openInviteModal = useUiStore((s) => s.openInviteModal)
  const openServerSettings = useUiStore((s) => s.openServerSettings)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [channelFilter, setChannelFilter] = useState('')

  const guild = queryClient.getQueryData<DtoGuild[]>(['guilds'])?.find((g) => String(g.id) === serverId)
  const serverName = guild?.name ?? 'Server'

  const { data: members } = useQuery({
    queryKey: ['members', serverId],
    queryFn: () => guildApi.guildGuildIdMembersGet({ guildId: serverId as unknown as number }).then((r) => r.data ?? []),
    enabled: !!serverId,
    staleTime: 30_000,
  })
  const { data: roles } = useQuery({
    queryKey: ['roles', serverId],
    queryFn: () => rolesApi.guildGuildIdRolesGet({ guildId: serverId as unknown as number }).then((r) => r.data ?? []),
    enabled: !!serverId,
    staleTime: 60_000,
  })

  const isOwner = guild?.owner != null && currentUser?.id !== undefined && String(guild.owner) === String(currentUser.id)
  const currentMember = members?.find((m) => String(m.user?.id) === String(currentUser?.id))
  const effectivePermissions = currentMember && roles
    ? calculateEffectivePermissions(currentMember as DtoMember, roles as DtoRole[])
    : 0
  const isAdmin = hasPermission(effectivePermissions, PermissionBits.ADMINISTRATOR)
  const canManageServer = isOwner || hasPermission(effectivePermissions, PermissionBits.MANAGE_SERVER) || isAdmin
  const canManageChannels = isOwner || hasPermission(effectivePermissions, PermissionBits.MANAGE_CHANNELS) || isAdmin
  const canCreateInvites = isOwner || hasPermission(effectivePermissions, PermissionBits.CREATE_INVITES) || isAdmin

  const sections = useMemo(() => {
    const isCategory = (channel: DtoChannel) => channel.type === ChannelType.ChannelTypeGuildCategory
    const isRegular = (channel: DtoChannel) =>
      channel.type === ChannelType.ChannelTypeGuild || channel.type === ChannelType.ChannelTypeGuildVoice

    const categories = sortChannels(channels.filter(isCategory))
    const categoryIds = new Set(categories.map((channel) => String(channel.id)))

    const memberRoleIds = new Set((currentMember?.roles ?? []).map(String))
    const canViewChannel = (channel: DtoChannel) => {
      if (isOwner || isAdmin) return true
      if (!channel.private) return true
      return (channel.roles ?? []).some((roleId) => memberRoleIds.has(String(roleId)))
    }

    const visibleCategories = categories.filter(canViewChannel)
    const visibleCategoryIds = new Set(visibleCategories.map((channel) => String(channel.id)))
    const filterText = channelFilter.trim().toLowerCase()
    const matchesFilter = (channel: DtoChannel) =>
      !filterText || (channel.name ?? '').toLowerCase().includes(filterText)

    const regular = sortChannels(
      channels
        .filter(isRegular)
        .filter(matchesFilter)
        .filter((channel) => {
          if (!canViewChannel(channel)) return false
          const parentId = channel.parent_id ? String(channel.parent_id) : null
          return !parentId || !categoryIds.has(parentId) || visibleCategoryIds.has(parentId)
        }),
    )

    return {
      uncategorized: regular.filter((channel) => !channel.parent_id || !categoryIds.has(String(channel.parent_id))),
      categories: visibleCategories.map((category) => ({
        category,
        children: regular.filter((channel) => String(channel.parent_id) === String(category.id)),
      })).filter((section) => !filterText || section.children.length > 0),
    }
  }, [channelFilter, channels, currentMember?.roles, isAdmin, isOwner])

  function toggleCategory(categoryId: string) {
    setCollapsed((previous) => {
      const next = new Set(previous)
      if (next.has(categoryId)) next.delete(categoryId)
      else next.add(categoryId)
      return next
    })
  }

  return (
    <main className="flex min-w-0 flex-1 flex-col bg-background">
      <header className="shrink-0 border-b border-border/70 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex min-h-12 items-center gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold tracking-tight">{serverName}</h1>
            <p className="truncate text-xs text-muted-foreground">Channels</p>
          </div>
          {canCreateInvites ? (
            <button
              type="button"
              onClick={() => openInviteModal(serverId)}
              aria-label="Invite people"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground active:bg-accent active:text-foreground"
            >
              <UserPlus className="h-5 w-5" />
            </button>
          ) : null}
          {canManageServer ? (
            <button
              type="button"
              onClick={() => openServerSettings(serverId)}
              aria-label="Server settings"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground active:bg-accent active:text-foreground"
            >
              <Settings className="h-5 w-5" />
            </button>
          ) : null}
        </div>
        <label className="mt-3 flex h-11 w-full items-center gap-2 rounded-xl bg-muted/70 px-3 text-sm text-muted-foreground focus-within:bg-muted">
          <Search className="h-4 w-4" />
          <input
            value={channelFilter}
            onChange={(event) => setChannelFilter(event.target.value)}
            placeholder="Search channels"
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </label>
      </header>

      <ScrollArea className="flex-1">
        <div className="space-y-4 px-3 py-3">
          <ChannelGroup
            channels={sections.uncategorized}
            serverId={serverId}
            activeChannelId={activeChannelId}
          />

          {sections.categories.map(({ category, children }) => {
            const categoryId = String(category.id)
            const isCollapsed = collapsed.has(categoryId)
            return (
              <section key={categoryId}>
                <div className="mb-1 flex items-center gap-1 px-1">
                  <button
                    type="button"
                    onClick={() => toggleCategory(categoryId)}
                    className="flex min-h-10 min-w-0 flex-1 items-center gap-1 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground"
                  >
                    <ChevronDown className={cn('h-4 w-4 transition-transform', isCollapsed && '-rotate-90')} />
                    <span className="truncate">{category.name ?? 'Category'}</span>
                  </button>
                  {canManageChannels ? (
                    <button
                      type="button"
                      onClick={() => openCreateChannel(categoryId, serverId)}
                      aria-label={`Create channel in ${category.name ?? 'category'}`}
                      className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground active:bg-accent active:text-foreground"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
                {!isCollapsed ? (
                  <ChannelGroup
                    channels={children}
                    serverId={serverId}
                    activeChannelId={activeChannelId}
                  />
                ) : null}
              </section>
            )
          })}
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t border-border/70">
        <VoicePanel />
        <div
          className="px-3 pt-2"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}
        >
          <UserArea />
        </div>
      </div>
    </main>
  )
}

function ChannelGroup({
  channels,
  serverId,
  activeChannelId,
}: {
  channels: DtoChannel[]
  serverId: string
  activeChannelId?: string
}) {
  const navigate = useNavigate()

  if (channels.length === 0) return null

  return (
    <div className="space-y-1">
      {channels.map((channel) => {
        const channelId = String(channel.id)
        return (
          <ChannelRow
            key={channelId}
            channel={channel}
            active={activeChannelId === channelId}
            onSelect={() => navigate(`/app/${serverId}/${channelId}`)}
          />
        )
      })}
    </div>
  )
}

function ChannelRow({
  channel,
  active,
  onSelect,
}: {
  channel: DtoChannel
  active: boolean
  onSelect: () => void
}) {
  const channelId = String(channel.id)
  const unread = useUnreadStore((s) => s.isChannelUnread(channelId))
  const mentionCount = useMentionStore((s) => s.getChannelMentionCount(channelId))
  const Icon = channel.type === ChannelType.ChannelTypeGuildVoice ? Volume2 : Hash

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex min-h-[48px] w-full items-center gap-3 rounded-xl px-3 text-left transition-colors',
        active ? 'bg-accent text-foreground' : 'text-muted-foreground active:bg-accent/70',
        (unread || mentionCount > 0) && !active && 'text-foreground',
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{channel.name ?? channelId}</span>
      {mentionCount > 0 ? (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
          {mentionCount > 99 ? '99+' : mentionCount}
        </span>
      ) : unread ? (
        <span className="h-2 w-2 rounded-full bg-foreground" />
      ) : null}
    </button>
  )
}
