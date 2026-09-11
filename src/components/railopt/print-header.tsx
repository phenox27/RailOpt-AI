'use client'

interface PrintHeaderProps {
  title?: string
  corridor?: string
  planName?: string
}

export function PrintHeader({
  title = 'RailOpt AI — Block Planning Report',
  corridor,
  planName,
}: PrintHeaderProps) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  const timeStr = now.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  })

  return (
    <div className="hidden print:block print-header">
      {/* Main Title */}
      <h1 className="text-xl font-bold text-black tracking-tight">
        {title}
      </h1>

      {/* Metadata Row */}
      <div className="flex items-center justify-center gap-4 mt-1 text-xs text-[#555]">
        <span>Generated: {dateStr} at {timeStr}</span>
        {corridor && (
          <>
            <span>·</span>
            <span>Corridor: {corridor}</span>
          </>
        )}
        {planName && (
          <>
            <span>·</span>
            <span>Plan: {planName}</span>
          </>
        )}
      </div>

      {/* Confidential Watermark */}
      <div className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-[#888] border-t border-[#ccc] pt-2">
        Confidential — For Internal Use Only
      </div>
    </div>
  )
}
