'use client'

import Image from 'next/image'
import { LegalLinks } from './legal-dialog'

/**
 * Indian Government Portal compliant footer.
 * Includes tricolor strip, NIC/CRIS credit, legal disclaimer,
 * accessibility statement, and copyright notice.
 */
export function GovernmentFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="shrink-0 w-full border-t border-border/60 government-print-footer" role="contentinfo">
      {/* Top tricolor strip */}
      <div className="flex h-[2px] w-full" aria-hidden="true">
        <div className="flex-1 bg-[#FF9933]/50" />
        <div className="flex-1 bg-white/30 dark:bg-white/10" />
        <div className="flex-1 bg-[#138808]/50" />
      </div>

      <div className="bg-muted/30">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-5 py-2 sm:py-3">
          {/* Main footer content */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] sm:text-[11px] text-muted-foreground">
            {/* Left: Copyright */}
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full overflow-hidden border border-border/40 shrink-0">
                <Image
                  src="/logo-icon.png"
                  alt=""
                  width={20}
                  height={20}
                  className="object-contain max-w-none"
                  style={{ width: 20, height: 20 }}
                />
              </div>
              <span>
                &copy; {currentYear} Ministry of Railways, Government of India
              </span>
            </div>

            {/* Center: Legal links */}
            <LegalLinks className="hidden md:flex items-center gap-3" separatorClassName="text-border" />

            {/* Right: NIC credit + Last updated */}
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline">
                Designed & Hosted by NIC / CRIS
              </span>
              <span className="text-[9px] text-muted-foreground/70">
                Last Updated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Disclaimer text */}
          <p className="text-[9px] text-muted-foreground/60 text-center mt-1 hidden sm:block">
            This site is designed, developed and hosted by National Informatics Centre (NIC), Ministry of Electronics & Information Technology, Government of India.
            Content is owned and maintained by Centre for Railway Information Systems (CRIS), Ministry of Railways.
          </p>
        </div>
      </div>

      {/* Bottom tricolor strip */}
      <div className="flex h-[2px] w-full" aria-hidden="true">
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-white dark:bg-white/30" />
        <div className="flex-1 bg-[#138808]" />
      </div>
    </footer>
  )
}
