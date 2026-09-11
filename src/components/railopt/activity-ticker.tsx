'use client'

import { cn } from '@/lib/utils'

const tickerItems = [
  { text: 'Block A1 approved by Control Office', color: 'bg-emerald-500', time: '2m ago' },
  { text: 'New conflict detected on BPL-NGP corridor', color: 'bg-red-500', time: '5m ago' },
  { text: 'AI Optimization complete for Weekly Plan v1', color: 'bg-[#1a237e]', time: '8m ago' },
  { text: 'Request MR-003 priority scored: 8.5/10', color: 'bg-blue-500', time: '12m ago' },
  { text: 'Block C1 verified by S&T department', color: 'bg-emerald-500', time: '15m ago' },
  { text: 'Traction distribution work assigned to Alivia', color: 'bg-amber-500', time: '18m ago' },
  { text: 'Plan status changed: Recommended \u2192 Reviewed', color: 'bg-violet-500', time: '22m ago' },
]

function TickerItem({ text, color, time }: { text: string; color: string; time: string }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap px-4">
      <span className={cn('inline-block h-2 w-2 rounded-full shrink-0', color)} aria-hidden="true" />
      <span className="text-xs text-foreground/80 font-medium">{text}</span>
      <span className="text-[10px] text-muted-foreground">{time}</span>
    </span>
  )
}

export function ActivityTicker() {
  return (
    <div
      className="relative h-8 w-full overflow-hidden bg-muted/30 border-b border-border/50"
      role="marquee"
      aria-label="Live system activity ticker"
      aria-live="off"
    >
      {/* Left fade mask */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-muted/30 to-transparent z-10 pointer-events-none" />
      {/* Right fade mask */}
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-muted/30 to-transparent z-10 pointer-events-none" />

      {/* Scrolling content — tripled for seamless loop */}
      <div className="flex items-center h-full ticker-scroll">
        {tickerItems.map((item, i) => (
          <TickerItem key={`a-${i}`} {...item} />
        ))}
        <span className="text-border px-2" aria-hidden="true">&bull;</span>
        {tickerItems.map((item, i) => (
          <TickerItem key={`b-${i}`} {...item} />
        ))}
        <span className="text-border px-2" aria-hidden="true">&bull;</span>
        {tickerItems.map((item, i) => (
          <TickerItem key={`c-${i}`} {...item} />
        ))}
      </div>
    </div>
  )
}
