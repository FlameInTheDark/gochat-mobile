import { Outlet } from 'react-router-dom'
import DiscoverySidebar from '@/components/layout/DiscoverySidebar'
import MobileServerRail from '@/components/layout/mobile/MobileServerRail'
import { useClientMode } from '@/hooks/useClientMode'

export default function DiscoveryLayout() {
  const isMobile = useClientMode() === 'mobile'

  if (isMobile) {
    return (
      <div className="flex h-full w-full overflow-hidden bg-background">
        <MobileServerRail activeServerId="discovery" />
        <Outlet />
      </div>
    )
  }

  return (
    <>
      <DiscoverySidebar />
      <Outlet />
    </>
  )
}
