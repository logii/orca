import { useState } from 'react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { translate } from '@/i18n/i18n'
import type { DashboardCard } from '../../../../shared/dashboard-snapshot'
import { AgentChatPanel } from './AgentChatPanel'
import { AgentTerminalPanel, type AgentRevealArgs } from './AgentTerminalDialog'

type AgentMapInspectorDrawerProps = {
  card: DashboardCard
  side: 'left' | 'right'
  onOpenChange: (open: boolean) => void
  onReveal: (args: AgentRevealArgs) => void
  reviewed: boolean
  pinned: boolean
  onMarkReviewed: (card: DashboardCard) => void
  onTogglePinned: (card: DashboardCard) => void
}

export function AgentMapInspectorDrawer({
  card,
  side,
  onOpenChange,
  onReveal,
  reviewed,
  pinned,
  onMarkReviewed,
  onTogglePinned
}: AgentMapInspectorDrawerProps): React.JSX.Element {
  const [showTerminal, setShowTerminal] = useState(card.viewMode !== 'chat')
  const panelClassName = 'm-0 h-full flex-none rounded-none border-0 bg-transparent shadow-none'

  return (
    <Sheet open modal={false} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        showCloseButton={false}
        overlayClassName="hidden"
        aria-describedby={undefined}
        className="w-[min(42rem,calc(100vw-3rem))] p-0 sm:max-w-none"
        onEscapeKeyDown={(event) => {
          if (event.target instanceof HTMLElement && event.target.closest('.xterm')) {
            event.preventDefault()
          }
        }}
      >
        <SheetTitle className="sr-only">{translate('dashboardPopout.title', 'Agents')}</SheetTitle>
        {showTerminal ? (
          <AgentTerminalPanel
            card={card}
            onOpenChange={onOpenChange}
            onReveal={onReveal}
            reviewed={reviewed}
            pinned={pinned}
            onMarkReviewed={onMarkReviewed}
            onTogglePinned={onTogglePinned}
            className={panelClassName}
          />
        ) : (
          <AgentChatPanel
            card={card}
            onClose={() => onOpenChange(false)}
            onOpenTerminal={() => setShowTerminal(true)}
            className={panelClassName}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
