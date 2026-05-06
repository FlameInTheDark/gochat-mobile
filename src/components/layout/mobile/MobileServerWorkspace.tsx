import type { DtoChannel } from '@/types'
import MobileChannelNavigator from './MobileChannelNavigator'
import MobileServerRail from './MobileServerRail'

interface Props {
  channels: DtoChannel[]
  serverId: string
}

export default function MobileServerWorkspace({ channels, serverId }: Props) {
  return (
    <div className="flex h-full w-full bg-background">
      <MobileServerRail activeServerId={serverId} />
      <MobileChannelNavigator channels={channels} serverId={serverId} />
    </div>
  )
}
