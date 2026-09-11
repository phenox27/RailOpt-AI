'use client'

import { useState, useMemo } from 'react'
import { maintenanceRequests, blocks, corridors } from '@/data/simulated-data'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle } from 'lucide-react'

interface ManualBlockFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: ManualBlockData) => void
  /** Pre-filled times (e.g. "Create block here" from a free-hour toast) */
  prefill?: { startTime?: string; endTime?: string } | null
}

export interface ManualBlockData {
  name: string
  section: string
  stationFrom: string
  stationTo: string
  startTime: string
  endTime: string
  department: string
  line: string
}

const SECTIONS = corridors.map((c) => c.name)
const DEPARTMENTS = [
  { value: 'engineering', label: 'Engineering' },
  { value: 'snt', label: 'S&T' },
  { value: 'traction', label: 'Traction' },
  { value: 'combined', label: 'Combined' },
]
const LINES = [
  { value: 'up', label: 'UP' },
  { value: 'down', label: 'DOWN' },
  { value: 'both', label: 'Both' },
]

// Station mapping for sections
const SECTION_STATIONS: Record<string, { from: string; to: string }> = {
  'NDLS-GZB': { from: 'New Delhi', to: 'Ghaziabad' },
  'TDL-MTJ': { from: 'Tundla', to: 'Mathura' },
  'CNB-LKO': { from: 'Kanpur', to: 'Lucknow' },
  'ALD-MGS': { from: 'Prayagraj', to: 'Mughal Sarai' },
  'BPL-JHS': { from: 'Bhopal', to: 'Jhansi' },
  'NDLS-AGC': { from: 'New Delhi', to: 'Agra' },
}

export function ManualBlockForm({ open, onOpenChange, onSubmit, prefill }: ManualBlockFormProps) {
  // Pre-filled times are baked into the initial state — the parent re-keys the
  // form per prefill ("Create block here" from a free-hour toast) so a remount
  // applies them without sync effects.
  const [name, setName] = useState('')
  const [section, setSection] = useState('')
  const [stationFrom, setStationFrom] = useState('')
  const [stationTo, setStationTo] = useState('')
  const [startTime, setStartTime] = useState(prefill?.startTime ?? '01:00')
  const [endTime, setEndTime] = useState(prefill?.endTime ?? '04:00')
  const [department, setDepartment] = useState('')
  const [line, setLine] = useState('')

  // Derive station values from section
  const derivedStations = section && SECTION_STATIONS[section]
    ? SECTION_STATIONS[section]
    : null
  const effectiveStationFrom = derivedStations ? derivedStations.from : stationFrom
  const effectiveStationTo = derivedStations ? derivedStations.to : stationTo

  // Derive name from section + department
  const derivedName = section && department
    ? `Manual Block — ${section} ${DEPARTMENTS.find((d) => d.value === department)?.label || department}`
    : name
  const effectiveName = (section && department) ? derivedName : name

  // Calculate duration
  const duration = useMemo((): number => {
    const [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)
    return (eh * 60 + em) - (sh * 60 + sm)
  }, [startTime, endTime])

  // Derive conflict check
  const showConflict = useMemo(() => {
    if (!section || !startTime || !endTime) return false

    const [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)
    const newStart = sh + sm / 60
    const newEnd = eh + em / 60

    return blocks.some((b) => {
      if (b.section !== section) return false
      const bStart = new Date(b.startTime).getHours() + new Date(b.startTime).getMinutes() / 60
      const bEnd = new Date(b.endTime).getHours() + new Date(b.endTime).getMinutes() / 60
      return newStart < bEnd && newEnd > bStart
    })
  }, [section, startTime, endTime])

  const handleSectionChange = (value: string) => {
    setSection(value)
    if (SECTION_STATIONS[value]) {
      setStationFrom(SECTION_STATIONS[value].from)
      setStationTo(SECTION_STATIONS[value].to)
    }
  }

  const handleDepartmentChange = (value: string) => {
    setDepartment(value)
    if (section) {
      const deptLabel = DEPARTMENTS.find((d) => d.value === value)?.label || value
      setName(`Manual Block — ${section} ${deptLabel}`)
    }
  }

  const handleSubmit = () => {
    if (!effectiveName || !section || !department || !line || duration <= 0) return

    onSubmit?.({
      name: effectiveName,
      section,
      stationFrom: effectiveStationFrom,
      stationTo: effectiveStationTo,
      startTime,
      endTime,
      department,
      line,
    })

    // Reset
    setName('')
    setSection('')
    setStationFrom('')
    setStationTo('')
    setStartTime('01:00')
    setEndTime('04:00')
    setDepartment('')
    setLine('')
    onOpenChange(false)
  }

  const isValid = effectiveName && section && department && line && duration > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manual Add Block</DialogTitle>
          <DialogDescription>
            Create a new maintenance block manually. Fill in the details below.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-xs">Block Name</Label>
            <Input
              value={effectiveName}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter block name"
              className="text-sm"
            />
          </div>

          {/* Section + Department row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Section</Label>
              <Select value={section} onValueChange={handleSectionChange}>
                <SelectTrigger className="w-full text-sm">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {SECTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Department</Label>
              <Select value={department} onValueChange={handleDepartmentChange}>
                <SelectTrigger className="w-full text-sm">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stations row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Station From</Label>
              <Input
                value={effectiveStationFrom}
                onChange={(e) => setStationFrom(e.target.value)}
                placeholder="From station"
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Station To</Label>
              <Input
                value={effectiveStationTo}
                onChange={(e) => setStationTo(e.target.value)}
                placeholder="To station"
                className="text-sm"
              />
            </div>
          </div>

          {/* Time row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Start Time</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">End Time</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Duration</Label>
              <div className="flex h-9 items-center px-3 rounded-md border bg-muted/30 text-sm text-muted-foreground">
                {duration > 0 ? `${duration} min` : '—'}
              </div>
            </div>
          </div>

          {/* Line */}
          <div className="space-y-1.5">
            <Label className="text-xs">Line</Label>
            <Select value={line} onValueChange={setLine}>
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="Select line" />
              </SelectTrigger>
              <SelectContent>
                {LINES.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Conflict warning */}
          {showConflict && (
            <div className="flex items-start gap-2 p-2.5 rounded-md bg-amber-50 border border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-amber-700">Potential conflict detected</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  This block overlaps with an existing block in the same section. 
                  Please verify the timing before proceeding.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-sm">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid} className="text-sm">
            Create Block
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
