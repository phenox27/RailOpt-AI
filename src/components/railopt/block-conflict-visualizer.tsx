'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Wrench, Radio, Zap, TrainFront, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'

// ── Types ──────────────────────────────────────────────────────────────────

type BlockType = 'engineering' | 's&t' | 'traction'
type SectionId = 'NDLS-GZB' | 'AGC-BPL' | 'BPL-NGP' | 'NGP-SC'

interface MaintenanceBlock {
  id: string
  type: BlockType
  section: SectionId
  startHour: number
  endHour: number
  label: string
}

interface TrainPath {
  id: string
  name: string
  section: SectionId
  passHour: number
}

interface ConflictZone {
  section: SectionId
  startHour: number
  endHour: number
  reason: string
}

// ── Data ───────────────────────────────────────────────────────────────────

const SECTIONS: SectionId[] = ['NDLS-GZB', 'AGC-BPL', 'BPL-NGP', 'NGP-SC']

const BLOCKS: MaintenanceBlock[] = [
  { id: 'A1', type: 'engineering', section: 'NDLS-GZB', startHour: 1, endHour: 4, label: 'A1: Engg Block' },
  { id: 'A2', type: 's&t',        section: 'NDLS-GZB', startHour: 2, endHour: 3.5, label: 'A2: S&T Block' },
  { id: 'B1', type: 'engineering', section: 'AGC-BPL', startHour: 6, endHour: 9, label: 'B1: Engg Block' },
  { id: 'B2', type: 'traction',   section: 'BPL-NGP', startHour: 10, endHour: 13, label: 'B2: Traction Block' },
  { id: 'C1', type: 'engineering', section: 'NGP-SC', startHour: 14, endHour: 17, label: 'C1: Engg Block' },
]

const TRAINS: TrainPath[] = [
  { id: '12302', name: '12302 Rajdhani', section: 'NDLS-GZB', passHour: 2.5 },
  { id: '22691', name: '22691 Duronto',  section: 'AGC-BPL', passHour: 7.0 },
  { id: '512XX', name: '512XX Freight',  section: 'BPL-NGP', passHour: 11.5 },
]

const CONFLICT_ZONES: ConflictZone[] = [
  { section: 'NDLS-GZB', startHour: 2, endHour: 3.5, reason: 'A1 ∩ A2 overlap (Engineering + S&T)' },
  { section: 'NDLS-GZB', startHour: 2.3, endHour: 2.7, reason: 'Rajdhani passes during A1 block' },
  { section: 'BPL-NGP', startHour: 11.3, endHour: 11.7, reason: 'Freight passes during B2 block' },
]

// ── Helpers ────────────────────────────────────────────────────────────────

const BLOCK_TYPE_CONFIG: Record<BlockType, { color: string; darkColor: string; label: string; icon: typeof Wrench }> = {
  engineering: { color: '#f59e0b', darkColor: '#d97706', label: 'Engineering', icon: Wrench },
  's&t':       { color: '#3b82f6', darkColor: '#2563eb', label: 'S&T',        icon: Radio },
  traction:    { color: '#8b5cf6', darkColor: '#7c3aed', label: 'Traction',   icon: Zap },
}

function formatHour(h: number): string {
  const hr = Math.floor(h)
  const min = Math.round((h - hr) * 60)
  return `${String(hr).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

// ── SVG layout constants ──────────────────────────────────────────────────

const MARGIN_LEFT = 90
const MARGIN_RIGHT = 20
const MARGIN_TOP = 32
const MARGIN_BOTTOM = 36
const SECTION_HEIGHT = 64
const TOTAL_HOURS = 24

// ── Component ─────────────────────────────────────────────────────────────

export function BlockConflictVisualizer() {
  const [selectedBlock, setSelectedBlock] = useState<MaintenanceBlock | null>(null)
  const [selectedTrain, setSelectedTrain] = useState<TrainPath | null>(null)

  const containerWidth = 900
  const chartWidth = containerWidth - MARGIN_LEFT - MARGIN_RIGHT
  const chartHeight = SECTIONS.length * SECTION_HEIGHT
  const svgHeight = MARGIN_TOP + chartHeight + MARGIN_BOTTOM

  const hourToX = useCallback((h: number) => MARGIN_LEFT + (h / TOTAL_HOURS) * chartWidth, [chartWidth])
  const sectionToY = useCallback((idx: number) => MARGIN_TOP + idx * SECTION_HEIGHT, [])

  const xPerHour = chartWidth / TOTAL_HOURS

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Card className="border border-red-200 dark:border-red-900/50 overflow-hidden">
        <CardHeader className="pb-2 pt-4 px-4 sm:px-6">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span>Block Conflict Diagram / ब्लॉक विरोध आरेख</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-4 pb-4">
          {/* Scrollable SVG container */}
          <div className="w-full overflow-x-auto">
            <svg
              width={containerWidth}
              height={svgHeight}
              viewBox={`0 0 ${containerWidth} ${svgHeight}`}
              className="min-w-[700px] block"
              role="img"
              aria-label="Block Conflict Time-Space Diagram"
            >
              {/* Defs: hatched pattern for conflict zones */}
              <defs>
                <pattern id="conflict-hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="6" stroke="#ef4444" strokeWidth="2" />
                </pattern>
                <pattern id="conflict-hatch-dark" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="6" stroke="#f87171" strokeWidth="2" />
                </pattern>
              </defs>

              {/* Background */}
              <rect x={0} y={0} width={containerWidth} height={svgHeight} className="fill-background" />

              {/* Chart area background */}
              <rect
                x={MARGIN_LEFT}
                y={MARGIN_TOP}
                width={chartWidth}
                height={chartHeight}
                className="fill-muted/30"
              />

              {/* Section row stripes (alternating) */}
              {SECTIONS.map((_, idx) => (
                idx % 2 === 0 ? (
                  <rect
                    key={`stripe-${idx}`}
                    x={MARGIN_LEFT}
                    y={sectionToY(idx)}
                    width={chartWidth}
                    height={SECTION_HEIGHT}
                    className="fill-muted/20"
                  />
                ) : null
              ))}

              {/* Section horizontal dividers */}
              {SECTIONS.map((_, idx) => (
                <line
                  key={`hdiv-${idx}`}
                  x1={MARGIN_LEFT}
                  y1={sectionToY(idx)}
                  x2={MARGIN_LEFT + chartWidth}
                  y2={sectionToY(idx)}
                  className="stroke-border"
                  strokeWidth={0.5}
                />
              ))}
              {/* Bottom border */}
              <line
                x1={MARGIN_LEFT}
                y1={sectionToY(SECTIONS.length)}
                x2={MARGIN_LEFT + chartWidth}
                y2={sectionToY(SECTIONS.length)}
                className="stroke-border"
                strokeWidth={0.5}
              />

              {/* Y-axis: Section labels */}
              {SECTIONS.map((sec, idx) => {
                const cy = sectionToY(idx) + SECTION_HEIGHT / 2
                return (
                  <text
                    key={`sec-${sec}`}
                    x={MARGIN_LEFT - 8}
                    y={cy}
                    textAnchor="end"
                    dominantBaseline="central"
                    className="fill-foreground text-[11px] font-medium"
                  >
                    {sec}
                  </text>
                )
              })}

              {/* X-axis: Time gridlines (every 2 hours) + labels */}
              {Array.from({ length: 13 }, (_, i) => i * 2).map((hr) => {
                const x = hourToX(hr)
                const isMajor = hr % 2 === 0
                return (
                  <g key={`grid-${hr}`}>
                    <line
                      x1={x}
                      y1={MARGIN_TOP}
                      x2={x}
                      y2={MARGIN_TOP + chartHeight}
                      className={isMajor ? 'stroke-border' : 'stroke-border/40'}
                      strokeWidth={isMajor ? 0.8 : 0.4}
                      strokeDasharray={isMajor ? undefined : '2,3'}
                    />
                    <text
                      x={x}
                      y={MARGIN_TOP + chartHeight + 16}
                      textAnchor="middle"
                      className="fill-muted-foreground text-[10px]"
                    >
                      {formatHour(hr)}
                    </text>
                  </g>
                )
              })}

              {/* Minor gridlines (every 1 hour, between majors) */}
              {Array.from({ length: 24 }, (_, i) => i).filter(h => h % 2 !== 0).map((hr) => {
                const x = hourToX(hr)
                return (
                  <line
                    key={`minor-${hr}`}
                    x1={x}
                    y1={MARGIN_TOP}
                    x2={x}
                    y2={MARGIN_TOP + chartHeight}
                    className="stroke-border/30"
                    strokeWidth={0.3}
                    strokeDasharray="1,4"
                  />
                )
              })}

              {/* ── Maintenance Blocks ── */}
              {BLOCKS.map((block) => {
                const secIdx = SECTIONS.indexOf(block.section)
                const bx = hourToX(block.startHour)
                const bw = (block.endHour - block.startHour) * xPerHour
                const by = sectionToY(secIdx) + 6
                const bh = SECTION_HEIGHT - 12
                const cfg = BLOCK_TYPE_CONFIG[block.type]

                return (
                  <Popover key={`block-${block.id}`}>
                    <PopoverTrigger asChild>
                      <g
                        className="cursor-pointer"
                        onClick={() => { setSelectedBlock(block); setSelectedTrain(null) }}
                        role="button"
                        aria-label={`${block.label} on ${block.section}`}
                      >
                        <rect
                          x={bx}
                          y={by}
                          width={bw}
                          height={bh}
                          rx={4}
                          fill={cfg.color}
                          fillOpacity={0.25}
                          stroke={cfg.color}
                          strokeWidth={1.2}
                        />
                        {/* Block label */}
                        <text
                          x={bx + bw / 2}
                          y={by + bh / 2}
                          textAnchor="middle"
                          dominantBaseline="central"
                          className="fill-foreground text-[10px] font-semibold pointer-events-none"
                        >
                          {block.id}
                        </text>
                        {/* Type indicator line at top */}
                        <line
                          x1={bx + 4}
                          y1={by + 3}
                          x2={bx + bw - 4}
                          y2={by + 3}
                          stroke={cfg.color}
                          strokeWidth={2}
                          strokeLinecap="round"
                        />
                      </g>
                    </PopoverTrigger>
                    <PopoverContent side="top" className="w-56 p-3 text-xs" sideOffset={4}>
                      <div className="font-semibold text-sm mb-1">{block.label}</div>
                      <div className="text-muted-foreground space-y-0.5">
                        <div>Type: <Badge variant="outline" className="text-[10px] px-1.5 py-0">{cfg.label}</Badge></div>
                        <div>Section: {block.section}</div>
                        <div>Time: {formatHour(block.startHour)} – {formatHour(block.endHour)}</div>
                        <div>Duration: {block.endHour - block.startHour}h</div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )
              })}

              {/* ── Conflict Zones (hatched overlay) ── */}
              {CONFLICT_ZONES.map((cz, idx) => {
                const secIdx = SECTIONS.indexOf(cz.section)
                const cx = hourToX(cz.startHour)
                const cw = (cz.endHour - cz.startHour) * xPerHour
                const cy = sectionToY(secIdx) + 6
                const ch = SECTION_HEIGHT - 12

                return (
                  <Popover key={`conflict-${idx}`}>
                    <PopoverTrigger asChild>
                      <g
                        className="cursor-pointer"
                        onClick={() => { setSelectedBlock(null); setSelectedTrain(null) }}
                        role="button"
                        aria-label={`Conflict zone: ${cz.reason}`}
                      >
                        {/* Hatched fill */}
                        <rect
                          x={cx}
                          y={cy}
                          width={cw}
                          height={ch}
                          rx={2}
                          fill="url(#conflict-hatch)"
                          fillOpacity={0.7}
                        />
                        {/* Red border */}
                        <rect
                          x={cx}
                          y={cy}
                          width={cw}
                          height={ch}
                          rx={2}
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth={1.5}
                          strokeDasharray="3,2"
                        />
                      </g>
                    </PopoverTrigger>
                    <PopoverContent side="top" className="w-60 p-3 text-xs" sideOffset={4}>
                      <div className="flex items-center gap-1.5 font-semibold text-sm mb-1 text-red-600 dark:text-red-400">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Conflict Zone
                      </div>
                      <div className="text-muted-foreground space-y-0.5">
                        <div>Section: {cz.section}</div>
                        <div>Time: {formatHour(cz.startHour)} – {formatHour(cz.endHour)}</div>
                        <div>Reason: {cz.reason}</div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )
              })}

              {/* ── Train diagonal lines ── */}
              {TRAINS.map((train) => {
                const secIdx = SECTIONS.indexOf(train.section)
                const rowY = sectionToY(secIdx)
                const tx = hourToX(train.passHour)
                const midY = rowY + SECTION_HEIGHT / 2

                // Diagonal: enters from top-left, exits bottom-right (or similar)
                const halfW = 18
                const halfH = SECTION_HEIGHT / 2 - 2

                return (
                  <Popover key={`train-${train.id}`}>
                    <PopoverTrigger asChild>
                      <g
                        className="cursor-pointer"
                        onClick={() => { setSelectedTrain(train); setSelectedBlock(null) }}
                        role="button"
                        aria-label={`Train ${train.name} passing ${train.section}`}
                      >
                        <line
                          x1={tx - halfW}
                          y1={midY - halfH}
                          x2={tx + halfW}
                          y2={midY + halfH}
                          stroke="#10b981"
                          strokeWidth={2.2}
                          strokeLinecap="round"
                        />
                        {/* Arrow head */}
                        <polygon
                          points={`${tx + halfW},${midY + halfH} ${tx + halfW - 5},${midY + halfH - 2} ${tx + halfW - 2},${midY + halfH - 5}`}
                          fill="#10b981"
                        />
                        {/* Train number label */}
                        <text
                          x={tx + halfW + 3}
                          y={midY + halfH + 2}
                          textAnchor="start"
                          className="fill-emerald-700 dark:fill-emerald-400 text-[8px] font-medium pointer-events-none"
                        >
                          {train.id}
                        </text>
                      </g>
                    </PopoverTrigger>
                    <PopoverContent side="top" className="w-52 p-3 text-xs" sideOffset={4}>
                      <div className="flex items-center gap-1.5 font-semibold text-sm mb-1">
                        <TrainFront className="w-3.5 h-3.5 text-emerald-600" />
                        {train.name}
                      </div>
                      <div className="text-muted-foreground space-y-0.5">
                        <div>Section: {train.section}</div>
                        <div>Passes at: {formatHour(train.passHour)}</div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )
              })}

              {/* Axis labels */}
              <text
                x={MARGIN_LEFT + chartWidth / 2}
                y={svgHeight - 2}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px]"
              >
                Time (hrs)
              </text>
              <text
                x={6}
                y={MARGIN_TOP + chartHeight / 2}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-muted-foreground text-[10px]"
                transform={`rotate(-90, 6, ${MARGIN_TOP + chartHeight / 2})`}
              >
                Section
              </text>
            </svg>
          </div>

          {/* ── Legend ── */}
          <div className="mt-3 px-2 sm:px-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground text-[11px] mr-1">Legend:</span>
            {/* Engineering */}
            <div className="flex items-center gap-1.5">
              <svg width="16" height="10" className="shrink-0"><rect width="16" height="10" rx="2" fill="#f59e0b" fillOpacity={0.3} stroke="#f59e0b" strokeWidth={1} /></svg>
              <span>Block (Engineering)</span>
            </div>
            {/* S&T */}
            <div className="flex items-center gap-1.5">
              <svg width="16" height="10" className="shrink-0"><rect width="16" height="10" rx="2" fill="#3b82f6" fillOpacity={0.3} stroke="#3b82f6" strokeWidth={1} /></svg>
              <span>Block (S&T)</span>
            </div>
            {/* Traction */}
            <div className="flex items-center gap-1.5">
              <svg width="16" height="10" className="shrink-0"><rect width="16" height="10" rx="2" fill="#8b5cf6" fillOpacity={0.3} stroke="#8b5cf6" strokeWidth={1} /></svg>
              <span>Block (Traction)</span>
            </div>
            {/* Train */}
            <div className="flex items-center gap-1.5">
              <svg width="16" height="10" className="shrink-0"><line x1="0" y1="0" x2="16" y2="10" stroke="#10b981" strokeWidth={2} strokeLinecap="round" /></svg>
              <span>Train</span>
            </div>
            {/* Conflict Zone */}
            <div className="flex items-center gap-1.5">
              <svg width="16" height="10" className="shrink-0">
                <rect width="16" height="10" rx="1" fill="url(#conflict-hatch)" fillOpacity={0.7} />
                <rect width="16" height="10" rx="1" fill="none" stroke="#ef4444" strokeWidth={1} strokeDasharray="2,1" />
              </svg>
              <span className="text-red-600 dark:text-red-400 font-medium">Conflict Zone</span>
            </div>
          </div>

          {/* ── Selected detail summary ── */}
          {(selectedBlock || selectedTrain) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 px-2 sm:px-4"
            >
              <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs">
                {selectedBlock && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">
                      {BLOCK_TYPE_CONFIG[selectedBlock.type].label}
                    </Badge>
                    <span className="font-medium">{selectedBlock.label}</span>
                    <span className="text-muted-foreground">
                      {selectedBlock.section} • {formatHour(selectedBlock.startHour)}–{formatHour(selectedBlock.endHour)}
                    </span>
                  </div>
                )}
                {selectedTrain && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-300">
                      Train
                    </Badge>
                    <span className="font-medium">{selectedTrain.name}</span>
                    <span className="text-muted-foreground">
                      {selectedTrain.section} • passes at {formatHour(selectedTrain.passHour)}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
