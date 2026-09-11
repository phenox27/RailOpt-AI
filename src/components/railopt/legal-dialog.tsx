'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Scale } from 'lucide-react'

export type LegalDocKey = 'terms' | 'privacy' | 'accessibility' | 'sitemap'

interface LegalDoc {
  title: string
  description: string
  body: string[]
}

const LEGAL_DOCS: Record<LegalDocKey, LegalDoc> = {
  terms: {
    title: 'Terms of Use',
    description: 'Conditions governing the use of the RailOpt AI platform',
    body: [
      'RailOpt AI is a prototype decision-support system developed for the Ministry of Railways, Government of India, as part of Smart India Hackathon 2025. By accessing this platform you agree to use it solely for evaluation, demonstration and authorised operational planning purposes.',
      'All maintenance requests, block plans, conflicts and analytics shown in this demo are simulated. The platform must not be used as the sole basis for real-world safety-critical decisions without verification by authorised railway officials.',
      'Users are responsible for the confidentiality of their credentials. Access may be revoked at any time by the system administrator. Misuse of the platform, attempts to disrupt service, or unauthorised data extraction are strictly prohibited.',
      'The content of this site is owned and maintained by the Centre for Railway Information Systems (CRIS). These terms are governed by the laws of India, with exclusive jurisdiction of the courts at New Delhi.',
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    description: 'How RailOpt AI handles your information',
    body: [
      'RailOpt AI collects only the minimum information required to operate: your name, official email address, department and role. This information is used to personalise the workspace, attribute planning actions in audit logs, and manage role-based access control.',
      'In this prototype build, no personal data is shared with third parties, sold, or used for advertising. Session information is stored in an encrypted JWT cookie and expires after 8 hours.',
      'Audit entries record actions performed on plans, blocks and maintenance requests, including the acting user\u2019s name, to maintain operational accountability as required for railway decision-support systems.',
      'For questions regarding this policy, contact the system administrator at admin@railopt.ai.',
    ],
  },
  accessibility: {
    title: 'Accessibility Statement',
    description: 'Our commitment to an inclusive platform',
    body: [
      'RailOpt AI is committed to meeting the accessibility requirements of the Guidelines for Indian Government Websites (GIGW) and WCAG 2.1 level AA.',
      'The platform provides: full keyboard navigation with visible focus states, a skip-to-content link, semantic landmark structure (header, nav, main, footer), ARIA labels on all interactive controls, colour contrast ratios that meet AA standards in both light and dark themes, and responsive layouts that reflow at 320px width without horizontal scrolling.',
      'The command palette (Ctrl/Cmd + K) and keyboard shortcut help dialog (?) provide fast keyboard-only operation of all major workflows.',
      'If you encounter any accessibility barrier, please report it to the system administrator so it can be addressed in the next release.',
    ],
  },
  sitemap: {
    title: 'Sitemap',
    description: 'Sections of the RailOpt AI platform',
    body: [
      'Landing Page — overview, features, impact, how it works, coverage.',
      'Sign In / Register — credential login, team demo accounts, Google sign-in.',
      'Dashboard — KPIs, corridor health, activity feed, system status, quick actions.',
      'Maintenance Requests — request register, AI priority scoring, request lifecycle workflow, detail drawer with comments.',
      'Planning — weekly/monthly plans, block timeline, Gantt view, crew scheduling, AI recommendations, manual block creation, duration optimizer.',
      'Timetable & Conflicts — train timetable, conflict list, impact analysis, guided conflict resolution workflow.',
      'Approvals — multi-stage approval workflow (Recommended → Edited → Verified → Finalized → Approved) with batch actions.',
      'Plans — plan comparison, health scores, JSON/CSV/PDF export and sharing.',
      'Audit Logs (Admin) — full activity trail for compliance and review.',
      'Settings (Admin) — user directory, role management, system preferences.',
    ],
  },
}

const LEGAL_LINKS: { key: LegalDocKey; label: string }[] = [
  { key: 'terms', label: 'Terms of Use' },
  { key: 'privacy', label: 'Privacy Policy' },
  { key: 'accessibility', label: 'Accessibility Statement' },
  { key: 'sitemap', label: 'Sitemap' },
]

interface LegalLinksProps {
  className?: string
  separatorClassName?: string
}

/**
 * Renders the four legal links (Terms / Privacy / Accessibility / Sitemap)
 * plus the shared dialog that opens their content.
 */
export function LegalLinks({ className, separatorClassName }: LegalLinksProps) {
  const [openDoc, setOpenDoc] = useState<LegalDocKey | null>(null)
  const doc = openDoc ? LEGAL_DOCS[openDoc] : null

  return (
    <>
      <div className={className}>
        {LEGAL_LINKS.map((link, i) => (
          <span key={link.key} className="contents">
            {i > 0 && <span className={separatorClassName ?? 'text-border'}>|</span>}
            <button
              type="button"
              className="hover:text-foreground transition-colors underline decoration-dotted underline-offset-2"
              aria-label={link.label}
              onClick={() => setOpenDoc(link.key)}
            >
              {link.label}
            </button>
          </span>
        ))}
      </div>

      <Dialog open={!!openDoc} onOpenChange={(open) => { if (!open) setOpenDoc(null) }}>
        <DialogContent className="sm:max-w-[520px]">
          {doc && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <Scale className="h-4 w-4 text-primary" />
                  {doc.title}
                </DialogTitle>
                <DialogDescription className="text-xs">{doc.description}</DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[55vh] pr-3">
                <div className="space-y-3 py-1">
                  {doc.body.map((para, i) => (
                    <p key={i} className="text-xs leading-relaxed text-foreground/85">
                      {para}
                    </p>
                  ))}
                  <p className="text-[10px] text-muted-foreground pt-1 border-t border-border/60">
                    RailOpt AI · SIH 2025 · Ministry of Railways, Government of India
                  </p>
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
