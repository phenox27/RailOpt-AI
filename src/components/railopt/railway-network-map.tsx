'use client'

import { networkCorridors, type NetworkCorridor } from '@/data/simulated-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from '@/components/ui/hover-card'
import { MapPin, TrainFront, AlertTriangle, CheckCircle2, Minus } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// Availability color thresholds
function getAvailabilityColor(avail: number): {
  stroke: string
  bg: string
  text: string
  badge: string
  label: string
} {
  if (avail > 85) {
    return {
      stroke: '#10b981', // emerald-500
      bg: 'bg-emerald-100 dark:bg-emerald-950',
      text: 'text-emerald-700 dark:text-emerald-400',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800',
      label: 'Good',
    }
  }
  if (avail >= 70) {
    return {
      stroke: '#f59e0b', // amber-500
      bg: 'bg-amber-100 dark:bg-amber-950',
      text: 'text-amber-700 dark:text-amber-400',
      badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800',
      label: 'Moderate',
    }
  }
  return {
    stroke: '#ef4444', // red-500
    bg: 'bg-red-100 dark:bg-red-950',
    text: 'text-red-700 dark:text-red-400',
    badge: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800',
    label: 'Low',
  }
}

// Station data derived from corridors
interface Station {
  code: string
  fullName: string
  y: number
}

const stations: Station[] = [
  { code: 'NDLS', fullName: 'New Delhi', y: 70 },
  { code: 'AGC', fullName: 'Agra', y: 170 },
  { code: 'BPL', fullName: 'Bhopal', y: 270 },
  { code: 'NGP', fullName: 'Nagpur', y: 370 },
  { code: 'SC', fullName: 'Secunderabad', y: 470 },
  { code: 'CSMT', fullName: 'Mumbai CSMT', y: 570 },
]

const CENTER_X = 200
const VIEW_BOX_W = 400
const VIEW_BOX_H = 640

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const lineVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

const stationVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },
}

const labelVariants = {
  hidden: { x: -8, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.2 },
  },
}

function CorridorLine({
  corridor,
  fromStation,
  toStation,
  index,
}: {
  corridor: NetworkCorridor
  fromStation: Station
  toStation: Station
  index: number
}) {
  const colors = getAvailabilityColor(corridor.availability)
  const midY = (fromStation.y + toStation.y) / 2

  return (
    <g>
      {/* Background track line (subtle) */}
      <motion.line
        x1={CENTER_X}
        y1={fromStation.y}
        x2={CENTER_X}
        y2={toStation.y}
        stroke="currentColor"
        strokeWidth={12}
        strokeLinecap="round"
        className="text-muted/20"
        variants={lineVariants}
      />

      {/* Colored corridor line */}
      <HoverCard openDelay={100} closeDelay={80}>
        <HoverCardTrigger asChild>
          <motion.line
            x1={CENTER_X}
            y1={fromStation.y + 12}
            x2={CENTER_X}
            y2={toStation.y - 12}
            stroke={colors.stroke}
            strokeWidth={6}
            strokeLinecap="round"
            variants={lineVariants}
            className="cursor-pointer"
            style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))' }}
          />
        </HoverCardTrigger>
        <HoverCardContent
          side="right"
          align="center"
          sideOffset={12}
          className="w-64 p-3"
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">
                {corridor.from} — {corridor.to}
              </span>
              <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0 h-4', colors.badge)}>
                {colors.label}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              {corridor.fromFull} — {corridor.toFull}
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border">
              <div className="text-center">
                <div className={cn('text-lg font-bold', colors.text)}>
                  {corridor.availability}%
                </div>
                <div className="text-[9px] text-muted-foreground">Availability</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-foreground">
                  {corridor.activeBlocks}
                </div>
                <div className="text-[9px] text-muted-foreground">Active Blocks</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-foreground">
                  {corridor.lineKm}
                </div>
                <div className="text-[9px] text-muted-foreground">Line Km</div>
              </div>
            </div>
            {corridor.activeBlocks > 0 && (
              <div className="flex items-center gap-1.5 pt-1 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-3 w-3" />
                <span className="text-[10px]">
                  {corridor.activeBlocks} active block(s) in this section
                </span>
              </div>
            )}
            {corridor.activeBlocks === 0 && (
              <div className="flex items-center gap-1.5 pt-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                <span className="text-[10px]">No active blocks — fully operational</span>
              </div>
            )}
          </div>
        </HoverCardContent>
      </HoverCard>

      {/* Availability % label alongside the corridor line */}
      <motion.text
        x={CENTER_X + 28}
        y={midY + 4}
        className={cn('text-[11px] font-semibold', colors.text)}
        fill="currentColor"
        textAnchor="start"
        variants={labelVariants}
      >
        {corridor.availability}%
      </motion.text>

      {/* Corridor name label (left side) */}
      <motion.text
        x={CENTER_X - 28}
        y={midY + 4}
        className="text-[9px] fill-muted-foreground"
        textAnchor="end"
        variants={labelVariants}
      >
        {corridor.from}-{corridor.to}
      </motion.text>
    </g>
  )
}

function StationNode({ station, index }: { station: Station; index: number }) {
  return (
    <g>
      {/* Station dot (outer ring) */}
      <motion.circle
        cx={CENTER_X}
        cy={station.y}
        r={14}
        fill="hsl(var(--background))"
        stroke="hsl(var(--primary))"
        strokeWidth={2}
        variants={stationVariants}
      />

      {/* Station dot (inner fill) */}
      <motion.circle
        cx={CENTER_X}
        cy={station.y}
        r={7}
        fill="hsl(var(--primary))"
        variants={stationVariants}
      />

      {/* Station code label (right of dot) */}
      <motion.text
        x={CENTER_X + 24}
        y={station.y + 5}
        className="text-[13px] font-bold fill-foreground"
        textAnchor="start"
        variants={labelVariants}
      >
        {station.code}
      </motion.text>

      {/* Station full name (right of code) */}
      <motion.text
        x={CENTER_X + 24}
        y={station.y + 18}
        className="text-[9px] fill-muted-foreground"
        textAnchor="start"
        variants={labelVariants}
      >
        {station.fullName}
      </motion.text>
    </g>
  )
}

export function RailwayNetworkMap() {
  // Build corridor-station pairs
  const corridorPairs = networkCorridors.map((corridor, idx) => ({
    corridor,
    fromStation: stations[idx],
    toStation: stations[idx + 1],
    index: idx,
  }))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          Railway Network Map
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 ml-1">
            NDLS–CSMT Corridor
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <motion.div
          className="w-full max-w-[320px] mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <svg
            viewBox={`0 0 ${VIEW_BOX_W} ${VIEW_BOX_H}`}
            className="w-full h-auto"
            role="img"
            aria-label="Railway network map showing NDLS to CSMT corridor with availability status"
          >
            {/* Subtle background corridor line */}
            <line
              x1={CENTER_X}
              y1={stations[0].y}
              x2={CENTER_X}
              y2={stations[stations.length - 1].y}
              stroke="currentColor"
              strokeWidth={16}
              strokeLinecap="round"
              className="text-muted/10"
            />

            {/* Corridor lines with availability coloring */}
            {corridorPairs.map(({ corridor, fromStation, toStation, index }) => (
              <CorridorLine
                key={corridor.id}
                corridor={corridor}
                fromStation={fromStation}
                toStation={toStation}
                index={index}
              />
            ))}

            {/* Station nodes */}
            {stations.map((station, index) => (
              <StationNode key={station.code} station={station} index={index} />
            ))}

            {/* Direction indicator at top */}
            <motion.text
              x={CENTER_X - 50}
              y={30}
              className="text-[9px] fill-muted-foreground"
              textAnchor="start"
              variants={labelVariants}
            >
              ▲ NORTH
            </motion.text>

            {/* Direction indicator at bottom */}
            <motion.text
              x={CENTER_X - 50}
              y={VIEW_BOX_H - 10}
              className="text-[9px] fill-muted-foreground"
              textAnchor="start"
              variants={labelVariants}
            >
              ▼ SOUTH
            </motion.text>
          </svg>
        </motion.div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 text-[10px]">
          <span className="text-muted-foreground font-medium">Availability:</span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">&gt;85%</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span className="text-muted-foreground">70–85%</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <span className="text-muted-foreground">&lt;70%</span>
          </span>
        </div>

        {/* Summary stats */}
        <div className="flex items-center justify-center gap-3 mt-2 text-[10px] text-muted-foreground">
          <TrainFront className="h-3 w-3" />
          <span>
            {networkCorridors.reduce((sum, c) => sum + c.lineKm, 0).toLocaleString()} km total ·{' '}
            {networkCorridors.reduce((sum, c) => sum + c.activeBlocks, 0)} active blocks
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
