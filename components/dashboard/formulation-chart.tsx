"use client"

import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { formatPeso, formatPesoCompact, salesByFormulation, type BranchId } from "@/lib/mock-data"

const config = {
  sales: { label: "MTD sales", color: "var(--primary)" },
} satisfies ChartConfig

export function FormulationChart({ branchIds }: { branchIds: BranchId[] }) {
  const data = salesByFormulation(branchIds)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales by formulation</CardTitle>
        <CardDescription>Month to date, all brands and packaging</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-64 w-full">
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 56 }} barCategoryGap={6}>
            <XAxis type="number" hide />
            <YAxis dataKey="formulation" type="category" tickLine={false} axisLine={false} width={68} />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideIndicator formatter={(v) => <span className="font-mono tabular-nums">{formatPeso(Number(v))}</span>} />}
            />
            <Bar dataKey="sales" fill="var(--color-sales)" radius={[0, 4, 4, 0]} isAnimationActive={false}>
              <LabelList
                dataKey="sales"
                position="right"
                className="fill-muted-foreground"
                fontSize={11}
                formatter={(v) => formatPesoCompact(Number(v))}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
