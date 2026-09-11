'use client'

import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { departmentSummary } from '@/data/simulated-data'

const chartData = departmentSummary.map(d => ({
  department: d.department,
  total: d.requests,
  assigned: d.assigned,
}))

const chartConfig: ChartConfig = {
  total: {
    label: 'Total Requests',
    color: '#2563EB',
  },
  assigned: {
    label: 'Assigned',
    color: '#0EA5A4',
  },
}

export function DepartmentChart() {
  return (
    <Card className="py-0 gap-0">
      <CardHeader className="px-4 pt-4 pb-2">
        <CardTitle className="text-sm font-semibold">Requests by Department</CardTitle>
        <CardDescription className="text-xs">Total vs assigned maintenance requests</CardDescription>
      </CardHeader>
      <CardContent className="px-2 pb-4">
        <ChartContainer config={chartConfig} className="h-[220px] w-full aspect-auto">
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="department"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              width={90}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="total" fill="var(--color-total)" radius={[0, 4, 4, 0]} barSize={16} />
            <Bar dataKey="assigned" fill="var(--color-assigned)" radius={[0, 4, 4, 0]} barSize={16} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
