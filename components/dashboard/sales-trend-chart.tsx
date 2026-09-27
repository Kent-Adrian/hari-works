"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { BRANCH_BY_ID, BRANCH_COLOR, DAILY_SALES, formatPeso, formatPesoCompact, type BranchId } from "@/lib/mock-data"

export function SalesTrendChart({ branchIds }: { branchIds: BranchId[] }) {
  const config = Object.fromEntries(
    branchIds.map((id) => [id, { label: BRANCH_BY_ID[id].name, color: BRANCH_COLOR[id] }])
  ) satisfies ChartConfig

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily sales by branch</CardTitle>
        <CardDescription>Last 28 days · today so far on the right · Sundays are half-day</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-72 w-full">
          <LineChart data={DAILY_SALES} margin={{ left: 4, right: 12, top: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={(v: number) => formatPesoCompact(v)}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  indicator="line"
                  formatter={(value, name, item) => (
                    <div className="flex w-full items-center gap-2">
                      <span className="h-2.5 w-1 shrink-0 rounded-[2px]" style={{ background: item.color }} />
                      <span className="text-muted-foreground">{BRANCH_BY_ID[name as BranchId]?.name ?? name}</span>
                      <span className="ml-auto pl-3 font-mono font-medium tabular-nums">{formatPeso(Number(value))}</span>
                    </div>
                  )}
                />
              }
            />
            {branchIds.map((id) => (
              <Line
                key={id}
                dataKey={id}
                type="monotone"
                stroke={`var(--color-${id})`}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
              />
            ))}
          </LineChart>
        </ChartContainer>
        {branchIds.length > 1 && (
          // Legend in fixed branch order (Recharts sorts its own legend alphabetically)
          <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
            {branchIds.map((id) => (
              <li key={id} className="flex items-center gap-1.5">
                <span className="h-0.5 w-3 rounded-full" style={{ background: BRANCH_COLOR[id] }} />
                {BRANCH_BY_ID[id].name}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
