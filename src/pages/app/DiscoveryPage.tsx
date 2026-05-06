import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Compass, Search, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { guildApi, searchApi } from '@/api/client'
import { SearchGuildsGetSortEnum, type DtoGuildDiscovery } from '@/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useClientMode } from '@/hooks/useClientMode'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 16

const QUICK_TAGS = [
  { key: 'discovery.quickCommunity', tag: 'community' },
  { key: 'discovery.quickGaming', tag: 'gaming' },
  { key: 'discovery.quickMusic', tag: 'music' },
  { key: 'discovery.quickEntertainment', tag: 'entertainment' },
  { key: 'discovery.quickScienceTech', tag: 'science-tech' },
  { key: 'discovery.quickEducation', tag: 'education' },
] as const

function parsePage(value: string | null): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0
}

function formatMembers(t: ReturnType<typeof useTranslation>['t'], count: number): string {
  return t(count === 1 ? 'discovery.members' : 'discovery.membersPlural', { count })
}

function guildIdParam(guild: DtoGuildDiscovery): number {
  return String(guild.id ?? '') as unknown as number
}

function GuildDiscoveryCard({
  guild,
  joining,
  onJoin,
  mobile = false,
}: {
  guild: DtoGuildDiscovery
  joining: boolean
  onJoin: (guild: DtoGuildDiscovery) => void
  mobile?: boolean
}) {
  const { t } = useTranslation()
  const name = guild.name?.trim() || '?'
  const description = guild.description?.trim()
  const membersCount = guild.members_count ?? 0
  const tags = guild.tags ?? []

  if (mobile) {
    return (
      <article className="rounded-2xl border border-border/70 bg-card p-3 shadow-sm transition-colors active:bg-accent/40">
        <div className="flex gap-3">
          <Avatar className="size-14 shrink-0 rounded-2xl">
            <AvatarImage src={guild.icon?.url} alt={name} className="object-cover" />
            <AvatarFallback className="rounded-2xl text-base font-semibold">
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-start gap-2">
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-[15px] font-semibold leading-5">{name}</h2>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="size-3.5" />
                  <span>{formatMembers(t, membersCount)}</span>
                </div>
              </div>
              <Button
                className="h-10 min-w-16 rounded-xl px-3"
                size="sm"
                disabled={joining}
                onClick={() => onJoin(guild)}
                aria-label={`${joining ? t('discovery.joining') : t('discovery.join')} ${name}`}
              >
                {joining ? t('discovery.joining') : t('discovery.join')}
              </Button>
            </div>

            {description ? (
              <p className="mt-2 overflow-hidden text-sm leading-5 text-muted-foreground [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                {description}
              </p>
            ) : null}

            {tags.length > 0 ? (
              <div className="mt-3 flex gap-1.5 overflow-hidden">
                {tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="max-w-[7rem] truncate rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="min-h-[214px] rounded-lg border bg-card p-4 shadow-sm transition-colors hover:border-primary/50">
      <div className="flex h-full flex-col gap-3">
        <div className="flex items-start gap-3">
          <Avatar className="size-14 rounded-lg">
            <AvatarImage src={guild.icon?.url} alt={name} className="object-cover" />
            <AvatarFallback className="rounded-lg text-base font-semibold">
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-semibold leading-6">{name}</h2>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="size-3.5" />
              <span>{formatMembers(t, membersCount)}</span>
            </div>
          </div>
        </div>

        <p className="min-h-[40px] overflow-hidden text-sm leading-5 text-muted-foreground [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
          {description || '\u00a0'}
        </p>

        <div className="flex min-h-6 flex-wrap gap-1.5 overflow-hidden">
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="max-w-full truncate rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
              title={tag}
            >
              {tag}
            </span>
          ))}
        </div>

        <Button
          className="mt-auto w-full"
          size="sm"
          disabled={joining}
          onClick={() => onJoin(guild)}
        >
          {joining ? t('discovery.joining') : t('discovery.join')}
        </Button>
      </div>
    </article>
  )
}

export default function DiscoveryPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isMobile = useClientMode() === 'mobile'
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q')?.trim() ?? ''
  const tag = searchParams.get('tag')?.trim() ?? ''
  const page = parsePage(searchParams.get('page'))
  const [draft, setDraft] = useState(q)

  useEffect(() => {
    setDraft(q)
  }, [q])

  const queryKey = useMemo(() => ['guildDiscovery', q, tag, page] as const, [q, tag, page])
  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () =>
      searchApi
        .searchGuildsGet({
          q: q || undefined,
          tags: tag || undefined,
          sort: SearchGuildsGetSortEnum.BestMatch,
          page,
          limit: PAGE_SIZE,
        })
        .then((res) => res.data),
    staleTime: 30_000,
  })

  const joinMutation = useMutation({
    mutationFn: (guild: DtoGuildDiscovery) => guildApi.guildGuildIdJoinPost({ guildId: guildIdParam(guild) }),
    onSuccess: async (res, guild) => {
      await queryClient.invalidateQueries({ queryKey: ['guilds'] })
      toast.success(t('discovery.joined'))
      navigate(`/app/${String(res.data.id ?? guild.id)}`)
    },
    onError: () => {
      toast.error(t('discovery.joinFailed'))
    },
  })

  function updateSearch(next: { q?: string; tag?: string; page?: number }) {
    const params = new URLSearchParams()
    const nextQ = next.q ?? q
    const nextTag = next.tag ?? tag
    const nextPage = next.page ?? page
    if (nextQ.trim()) params.set('q', nextQ.trim())
    if (nextTag.trim()) params.set('tag', nextTag.trim())
    if (nextPage > 0) params.set('page', String(nextPage))
    setSearchParams(params)
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    updateSearch({ q: draft, page: 0 })
  }

  const guilds = data?.guilds ?? []
  const pages = data?.pages ?? 0
  const activeJoinId = joinMutation.variables ? String(joinMutation.variables.id) : null

  if (isMobile) {
    return (
      <main className="h-full min-w-0 flex-1 overflow-hidden bg-background">
        <div className="flex h-full flex-col">
          <header className="shrink-0 border-b border-border/70 bg-background/95 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
                <Compass className="size-5" />
              </span>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold leading-6 tracking-normal">{t('discovery.title')}</h1>
                <p className="truncate text-xs text-muted-foreground">{t('discovery.subtitle')}</p>
              </div>
            </div>

            <form onSubmit={submitSearch} className="mt-3 flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={t('discovery.searchPlaceholder')}
                  className="h-11 rounded-2xl border-border/70 bg-muted/60 pl-9 pr-3 text-[15px]"
                />
              </div>
              <Button type="submit" size="icon-lg" className="h-11 w-11 rounded-2xl" aria-label={t('search.searchTitle')}>
                <Search className="size-4" />
              </Button>
            </form>

            <div className="-mx-4 mt-3 overflow-x-auto px-4 pb-1">
              <div className="flex w-max gap-2">
                {QUICK_TAGS.map((item) => (
                  <Button
                    key={item.tag}
                    type="button"
                    variant={tag === item.tag ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setDraft('')
                      updateSearch({ q: '', tag: item.tag, page: 0 })
                    }}
                    className={cn(
                      'h-9 rounded-full px-3',
                      tag === item.tag && 'border-primary/40 bg-primary/15 text-primary',
                    )}
                  >
                    {t(item.key)}
                  </Button>
                ))}
              </div>
            </div>
          </header>

          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}
          >
            {isError ? (
              <div className="mb-4 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                {t('discovery.searchFailed')}
              </div>
            ) : null}

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, index) => (
                  <Skeleton key={index} className="h-[126px] rounded-2xl" />
                ))}
              </div>
            ) : guilds.length > 0 ? (
              <>
                <div className="space-y-3">
                  {guilds.map((guild) => (
                    <GuildDiscoveryCard
                      key={String(guild.id)}
                      guild={guild}
                      mobile
                      joining={joinMutation.isPending && activeJoinId === String(guild.id)}
                      onJoin={(selectedGuild) => joinMutation.mutate(selectedGuild)}
                    />
                  ))}
                </div>

                {pages > 1 ? (
                  <div className="mt-4 flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="h-11 flex-1 rounded-2xl"
                      disabled={page <= 0}
                      onClick={() => updateSearch({ page: Math.max(0, page - 1) })}
                    >
                      {t('discovery.previousPage')}
                    </Button>
                    <span className="min-w-16 text-center text-xs text-muted-foreground">
                      {page + 1}/{pages}
                    </span>
                    <Button
                      className="h-11 flex-1 rounded-2xl"
                      disabled={page >= pages - 1}
                      onClick={() => updateSearch({ page: page + 1 })}
                    >
                      {t('discovery.nextPage')}
                      <ArrowRight className="size-4" />
                    </Button>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="flex min-h-[280px] flex-col items-center justify-center rounded-3xl border border-dashed bg-muted/20 p-8 text-center">
                <Compass className="mb-3 size-9 text-muted-foreground" />
                <h2 className="text-base font-semibold">{t('discovery.noResults')}</h2>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  {t('discovery.noResultsDesc')}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-normal">{t('discovery.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('discovery.subtitle')}</p>
        </header>

        <div className="space-y-3">
          <form onSubmit={submitSearch} className="flex max-w-3xl gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={t('discovery.searchPlaceholder')}
                className="pl-9"
              />
            </div>
            <Button type="submit" size="icon" aria-label={t('search.searchTitle')}>
              <Search className="size-4" />
            </Button>
          </form>

          <div className="flex flex-wrap gap-2">
            {QUICK_TAGS.map((item) => (
              <Button
                key={item.tag}
                type="button"
                variant={tag === item.tag ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => {
                  setDraft('')
                  updateSearch({ q: '', tag: item.tag, page: 0 })
                }}
                className={cn('h-8', tag === item.tag && 'border-primary/40')}
              >
                {t(item.key)}
              </Button>
            ))}
          </div>
        </div>

        {isError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {t('discovery.searchFailed')}
          </div>
        ) : null}

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: PAGE_SIZE }).map((_, index) => (
              <Skeleton key={index} className="h-[214px] rounded-lg" />
            ))}
          </div>
        ) : guilds.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {guilds.map((guild) => (
                <GuildDiscoveryCard
                  key={String(guild.id)}
                  guild={guild}
                  joining={joinMutation.isPending && activeJoinId === String(guild.id)}
                  onJoin={(selectedGuild) => joinMutation.mutate(selectedGuild)}
                />
              ))}
            </div>

            {pages > 1 ? (
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 0}
                  onClick={() => updateSearch({ page: Math.max(0, page - 1) })}
                >
                  {t('discovery.previousPage')}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {t('search.pageOf', { page: page + 1, total: pages })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pages - 1}
                  onClick={() => updateSearch({ page: page + 1 })}
                >
                  {t('discovery.nextPage')}
                </Button>
              </div>
            ) : null}
          </>
        ) : (
          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 p-8 text-center">
            <Compass className="mb-3 size-9 text-muted-foreground" />
            <h2 className="text-base font-semibold">{t('discovery.noResults')}</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {t('discovery.noResultsDesc')}
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
