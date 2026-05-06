import { Outlet, useLocation } from 'react-router-dom'
import DmSidebar from '@/components/layout/DmSidebar'
import MobileServerRail from '@/components/layout/mobile/MobileServerRail'
import { useClientMode } from '@/hooks/useClientMode'

export default function MeLayout() {
  const isMobile = useClientMode() === 'mobile'
  const location = useLocation()

  // /app/@me → 2 parts → show DM list
  // /app/@me/:userId → 3 parts → show chat
  const parts = location.pathname.split('/').filter(Boolean)
  const hasChannel = parts.length >= 3

  if (isMobile) {
    if (hasChannel) {
      return <Outlet />
    }
    return (
      <div className="flex h-full w-full bg-background">
        <MobileServerRail activeServerId="@me" />
        <DmSidebar showMobileBack={false} />
      </div>
    )
  }

  return (
    <>
      <DmSidebar />
      <Outlet />
    </>
  )
}
