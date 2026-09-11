'use client'

import { CloudSun, CloudRain, CloudLightning, Droplets, Thermometer } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type AlertLevel = 'normal' | 'caution' | 'warning'

interface WeatherData {
  condition: string
  temperature: number
  alertLevel: AlertLevel
  humidity: number
}

// Simulated weather — in production this would come from an API
function getSimulatedWeather(): WeatherData {
  const month = new Date().getMonth() + 1 // 1-12
  const isMonsoon = month >= 6 && month <= 9

  if (isMonsoon) {
    // During monsoon, higher chance of rain
    const hour = new Date().getHours()
    if (hour >= 14 && hour <= 18) {
      return { condition: 'Heavy Rain', temperature: 28, alertLevel: 'warning', humidity: 92 }
    }
    return { condition: 'Light Rain', temperature: 30, alertLevel: 'caution', humidity: 85 }
  }

  // Non-monsoon
  const hour = new Date().getHours()
  if (hour >= 12 && hour <= 15) {
    return { condition: 'Partly Cloudy', temperature: 34, alertLevel: 'normal', humidity: 45 }
  }
  return { condition: 'Clear Sky', temperature: 29, alertLevel: 'normal', humidity: 38 }
}

const ALERT_CONFIG: Record<AlertLevel, { label: string; badgeClass: string; icon: typeof CloudSun }> = {
  normal: {
    label: 'Normal',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800',
    icon: CloudSun,
  },
  caution: {
    label: 'Caution',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800',
    icon: CloudRain,
  },
  warning: {
    label: 'Warning',
    badgeClass: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800',
    icon: CloudLightning,
  },
}

export function WeatherAlert() {
  const weather = getSimulatedWeather()
  const month = new Date().getMonth() + 1
  const isMonsoon = month >= 6 && month <= 9
  const config = ALERT_CONFIG[weather.alertLevel]
  const WeatherIcon = config.icon

  return (
    <Card className="h-full" role="region" aria-label="Weather alert for maintenance planning">
      <CardContent className="p-4 space-y-3">
        {/* Section heading */}
        <div className="flex items-center gap-2 border-l-2 border-primary/40 pl-2">
          <WeatherIcon className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Weather</h3>
        </div>

        {/* Current conditions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WeatherIcon className={cn(
              'h-5 w-5',
              weather.alertLevel === 'warning' ? 'text-red-500' :
              weather.alertLevel === 'caution' ? 'text-amber-500' :
              'text-muted-foreground'
            )} />
            <span className="text-xs font-medium">{weather.condition}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Thermometer className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-semibold tabular-nums">{weather.temperature}&deg;C</span>
          </div>
        </div>

        {/* Humidity */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">Humidity</span>
          <div className="flex items-center gap-1.5">
            <Droplets className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium tabular-nums">{weather.humidity}%</span>
          </div>
        </div>

        {/* Alert level badge */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">Alert Level</span>
          <Badge variant="outline" className={cn('text-[10px] px-2', config.badgeClass)}>
            {config.label}
          </Badge>
        </div>

        {/* Caution/Warning message */}
        {weather.alertLevel !== 'normal' && (
          <p className={cn(
            'text-[11px] rounded-md px-2.5 py-1.5 border',
            weather.alertLevel === 'warning'
              ? 'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/30 dark:border-red-800'
              : 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/30 dark:border-amber-800'
          )} role="alert">
            Outdoor maintenance may be affected
          </p>
        )}

        {/* Monsoon season banner */}
        {isMonsoon && (
          <p className="text-[11px] rounded-md px-2.5 py-1.5 border text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/30 dark:border-blue-800" role="alert">
            Monsoon Season &mdash; Extra buffer recommended for outdoor work
          </p>
        )}
      </CardContent>
    </Card>
  )
}
