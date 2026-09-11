'use client'

import { useEffect, useMemo } from 'react'
import type { SimBlock, SimPlan } from '@/data/simulated-data'

/**
 * Official-style A4 "Corridor Block Planning Summary" for one plan.
 * Hidden on screen (`corridor-summary-print`); printed exclusively when the
 * parent view is in `printing-single-plan` mode (see globals.css).
 * Auto-triggers window.print() on mount and reports back via onDone.
 */

interface CorridorSummaryPrintProps {
  plan: SimPlan
  blocks: SimBlock[]
  requests: { id: string; title: string; section: string; priority: string | number; department: string }[]
  onDone: () => void
}

const DEPT_FULL: Record<string, string> = {
  engineering: 'Engineering (P-Way)',
  snt: 'Signal & Telecom',
  traction: 'Traction (OHE)',
  combined: 'Combined (Multi-dept)',
}

const DEPT_SHORT: Record<string, string> = {
  engineering: 'Engineering',
  snt: 'S&T',
  traction: 'Traction',
  combined: 'Combined',
}

function fmtDay(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })
}

function fmtTime(iso: string): string {
  const d = new Date(iso)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

export function CorridorSummaryPrint({ plan, blocks: planBlocks, requests, onDone }: CorridorSummaryPrintProps) {
  // Auto-print once mounted; clear the print mode when the dialog closes.
  // The body class drives global print CSS (hides app chrome, shows only this sheet)
  // so it works regardless of where the header/footer sit in the DOM.
  useEffect(() => {
    const done = () => onDone()
    window.addEventListener('afterprint', done)
    document.body.classList.add('printing-single-plan')
    const t = setTimeout(() => window.print(), 150)
    return () => {
      window.removeEventListener('afterprint', done)
      document.body.classList.remove('printing-single-plan')
      clearTimeout(t)
    }
  }, [onDone])

  const sorted = useMemo(
    () => [...planBlocks].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [planBlocks]
  )

  const totalMin = planBlocks.reduce((s, b) => s + b.duration, 0)
  const sections = [...new Set(planBlocks.map((b) => b.section))]
  const depts = [...new Set(planBlocks.map((b) => b.department))]
  const aiCount = planBlocks.filter((b) => b.isAiRecommended).length
  const generated = new Date().toLocaleString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
  })

  return (
    <div className="corridor-summary-print text-black" aria-hidden="true">
      {/* Letterhead */}
      <div style={{ borderBottom: '3px double #1a237e', paddingBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <p style={{ fontSize: 10, letterSpacing: 1, color: '#444' }}>भारत सरकार · GOVERNMENT OF INDIA</p>
            <p style={{ fontSize: 11, letterSpacing: 1, color: '#444' }}>मंत्रालय · MINISTRY OF RAILWAYS (RAIL BOARD)</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#1a237e' }}>RailOpt AI</p>
            <p style={{ fontSize: 9, color: '#555' }}>Block Planning &amp; Optimization System · NIC / CRIS</p>
          </div>
        </div>
        <h1 style={{ textAlign: 'center', fontSize: 16, fontWeight: 700, letterSpacing: 2, margin: '10px 0 2px' }}>
          CORRIDOR BLOCK PLANNING SUMMARY
        </h1>
        <p style={{ textAlign: 'center', fontSize: 10, color: '#555' }}>
          Confidential — For Official Use Only · Generated {generated}
        </p>
      </div>

      {/* Plan identification */}
      <table style={{ width: '100%', fontSize: 10.5, marginTop: 10, borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={metaLabel}>Plan Name</td>
            <td style={metaValue}><strong>{plan.name}</strong></td>
            <td style={metaLabel}>Plan Type</td>
            <td style={metaValue}>{plan.type === 'weekly' ? 'Weekly Block Plan' : 'Monthly Block Plan'}</td>
          </tr>
          <tr>
            <td style={metaLabel}>Plan Period</td>
            <td style={metaValue}>{plan.startDate} to {plan.endDate}</td>
            <td style={metaLabel}>Version / Status</td>
            <td style={metaValue}>v{plan.version} · {(plan.status || 'draft').toUpperCase()}</td>
          </tr>
          <tr>
            <td style={metaLabel}>Prepared By</td>
            <td style={metaValue}>{plan.createdBy === 'planner-rk' ? 'Jeet (Planner)' : plan.createdBy}</td>
            <td style={metaLabel}>Corridors / Sections</td>
            <td style={metaValue}>{sections.length > 0 ? sections.join(', ') : '—'}</td>
          </tr>
          {plan.notes ? (
            <tr>
              <td style={metaLabel}>Notes</td>
              <td style={metaValue} colSpan={3}>{plan.notes}</td>
            </tr>
          ) : null}
        </tbody>
      </table>

      {/* Summary line */}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        {[
          { label: 'Total Blocks', value: String(planBlocks.length) },
          { label: 'Engineer Hours', value: `${Math.floor(totalMin / 60)}h ${totalMin % 60}m` },
          { label: 'Departments', value: String(depts.length) },
          { label: 'AI Recommended', value: `${planBlocks.length > 0 ? Math.round((aiCount / planBlocks.length) * 100) : 0}%` },
          { label: 'Linked Requests', value: String(requests.length) },
        ].map((s) => (
          <div key={s.label} style={{ flex: 1, border: '1px solid #999', padding: '5px 8px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, fontWeight: 700 }}>{s.value}</p>
            <p style={{ fontSize: 8.5, color: '#444', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Block schedule */}
      <h2 style={{ fontSize: 11.5, fontWeight: 700, margin: '14px 0 4px', borderBottom: '1.5px solid #1a237e', paddingBottom: 2 }}>
        A. BLOCK SCHEDULE ({sorted.length} {sorted.length === 1 ? 'block' : 'blocks'})
      </h2>
      {sorted.length === 0 ? (
        <p style={{ fontSize: 10, color: '#555', fontStyle: 'italic' }}>No blocks have been scheduled under this plan yet.</p>
      ) : (
        <table style={{ width: '100%', fontSize: 9.5, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#e8eaf6' }}>
              <th style={th}>#</th>
              <th style={th}>Block / Work Description</th>
              <th style={th}>Section</th>
              <th style={th}>Stations</th>
              <th style={th}>Day</th>
              <th style={th}>Window</th>
              <th style={th}>Min</th>
              <th style={th}>Department</th>
              <th style={th}>Line</th>
              <th style={th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((b, i) => (
              <tr key={b.id} style={{ borderBottom: '1px solid #ccc' }}>
                <td style={td}>{i + 1}</td>
                <td style={{ ...td, maxWidth: 170 }}>
                  {b.name}
                  {b.isAiRecommended ? <span style={{ fontSize: 8, color: '#0d47a1' }}> ◆ AI</span> : null}
                </td>
                <td style={td}>{b.section}</td>
                <td style={td}>{b.stationFrom} → {b.stationTo}</td>
                <td style={td}>{fmtDay(b.startTime)}</td>
                <td style={td}>{fmtTime(b.startTime)}–{fmtTime(b.endTime)}</td>
                <td style={tdNum}>{b.duration}</td>
                <td style={td}>{DEPT_FULL[b.department] || b.department}</td>
                <td style={td}>{String(b.line).toUpperCase()}</td>
                <td style={{ ...td, textTransform: 'capitalize' }}>{b.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Linked maintenance requests */}
      {requests.length > 0 && (
        <>
          <h2 style={{ fontSize: 11.5, fontWeight: 700, margin: '14px 0 4px', borderBottom: '1.5px solid #1a237e', paddingBottom: 2 }}>
            B. LINKED MAINTENANCE REQUESTS ({requests.length})
          </h2>
          <table style={{ width: '100%', fontSize: 9.5, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#e8eaf6' }}>
                <th style={th}>Request ID</th>
                <th style={th}>Title</th>
                <th style={th}>Section</th>
                <th style={th}>Score</th>
                <th style={th}>Department</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #ccc' }}>
                  <td style={td}>{r.id.toUpperCase()}</td>
                  <td style={td}>{r.title}</td>
                  <td style={td}>{r.section}</td>
                  <td style={tdNum}>{r.priority}</td>
                  <td style={td}>{DEPT_SHORT[r.department] || r.department}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Approval / signature block */}
      <h2 style={{ fontSize: 11.5, fontWeight: 700, margin: '14px 0 4px', borderBottom: '1.5px solid #1a237e', paddingBottom: 2 }}>
        C. SIGN-OFF
      </h2>
      <table style={{ width: '100%', fontSize: 10, borderCollapse: 'collapse', marginTop: 6 }}>
        <tbody>
          <tr>
            {[
              { role: 'Prepared by', name: 'Jeet', desc: 'Assistant Block Planner' },
              { role: 'Checked by', name: 'Diya', desc: 'Control Office (TC)' },
              { role: 'Approved by', name: 'Debarshi', desc: 'Divisional Engineer' },
            ].map((s) => (
              <td key={s.role} style={{ width: '33.33%', padding: '10px 12px 26px', border: '1px solid #999', verticalAlign: 'top' }}>
                <p style={{ fontSize: 9, color: '#444', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.role}</p>
                <p style={{ fontSize: 11, fontWeight: 700, marginTop: 2 }}>{s.name}</p>
                <p style={{ fontSize: 9, color: '#555' }}>{s.desc}</p>
                <p style={{ fontSize: 8.5, color: '#777', marginTop: 18, borderTop: '1px dotted #777', paddingTop: 2 }}>
                  Signature &amp; Date
                </p>
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      {/* Footer */}
      <p style={{ fontSize: 8.5, color: '#666', marginTop: 12, textAlign: 'center', borderTop: '1px solid #999', paddingTop: 4 }}>
        This summary is system-generated by RailOpt AI v2.1 (Prototype Data — Simulated / Demo) · NIC / CRIS · Ministry of Railways
      </p>
    </div>
  )
}

// Shared table cell styles (kept as plain objects — print output ignores Tailwind)
const metaLabel: React.CSSProperties = {
  border: '1px solid #999', padding: '4px 8px', background: '#f4f5fa',
  fontWeight: 600, width: '16%', color: '#1a237e', whiteSpace: 'nowrap',
}
const metaValue: React.CSSProperties = {
  border: '1px solid #999', padding: '4px 8px', width: '34%',
}
const th: React.CSSProperties = {
  border: '1px solid #999', padding: '4px 6px', textAlign: 'left', fontWeight: 700, fontSize: 9,
}
const td: React.CSSProperties = {
  border: '1px solid #bbb', padding: '3px 6px', verticalAlign: 'top',
}
const tdNum: React.CSSProperties = {
  ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums',
}
