'use client'

import { Bar, BarChart, XAxis, YAxis, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { corridors } from '@/data/simulated-data'

const chartData = corridors.map(c => ({
  name: c.name,
  fullName: c.fullName,
  availability: c.availability,
}))

function getBarColor(value: number): string {
  if (value >= 90) return 'var(--success)'
  if (value >= 80) return 'var(--warning)'
  return 'var(--danger)'
}

const chartConfig: ChartConfig = {
  availability: {
    label: 'Availability',
    color: 'var(--success)',
  },
}

export function CorridorChart() {
  return (
    <Card className="py-0 gap-0">
      <CardHeader className="px-4 pt-4 pb-2">
        <CardTitle className="text-sm font-semibold">Corridor Availability</CardTitle>
        <CardDescription className="text-xs">Asset availability by section (%)</CardDescription>
      </CardHeader>
      <CardContent className="px-2 pb-4">
        <ChartContainer config={chartConfig} className="h-[220px] w-full aspect-auto">
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
            <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} unit="%" />
            <YAxis
              type="category"
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              width={60}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name, item) => (
                    <span className="font-mono font-medium">{value}%</span>
                  )}
                  labelFormatter={(label, payload) => {
                    const item = payload?.[0]?.payload
                    return item?.fullName || label
                  }}
                />
              }
            />
            <Bar dataKey="availability" radius={[0, 4, 4, 0]} barSize={14}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={getBarColor(entry.availability)} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
