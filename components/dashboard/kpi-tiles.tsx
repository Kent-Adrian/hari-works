import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { cn } from "cn"
import { Card } from "@/components/ui/card"
import { PREV_MTD_LABEL } from "@/lib/demo-date"
import { formatPeso, formatPesoCompact, type BranchKpis } from "@/lib/mock-data"

function Delta({ value, suffix }: { value: number; suffix: string }) {
  const up = value >= 0
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", up ? "text-delta-up" : "text-status-critical")}>
      <Icon className="size-3.5" />
      {up ? "+" : "−"}
      {Math.abs(value).toFixed(1)}% <span className="font-normal text-muted-foreground">{suffix}</span>
    </span>
  )
}

function Tile({
  label,
  value,
  exact,
  footer,
  emphasis,
}: {
  label: string
  value: string
  exact?: string
  footer?: React.ReactNode
  emphasis?: boolean
}) {
  return (
    <Card className={cn("min-w-0 gap-1 px-4", emphasis && "ring-primary/25")}>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold tracking-tight" title={exact}>
        {value}
      </div>
      {footer && <div className="text-xs text-muted-foreground">{footer}</div>}
    </Card>
  )
}

export function KpiTiles({ kpis, showPayables, newSales = 0 }: { kpis: BranchKpis; showPayables: boolean; newSales?: number }) {
  const mtdDelta = ((kpis.mtdSales - kpis.lastMonthSameDaySales) / kpis.lastMonthSameDaySales) * 100
  const margin = (kpis.mtdGrossProfit / kpis.mtdSales) * 100

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Tile
          emphasis
          label="Today's sales"
          value={formatPeso(kpis.todaySales)}
          footer={
            <>
              {kpis.todayTx} transactions · avg {formatPeso(Math.round(kpis.todaySales / kpis.todayTx))}
              {newSales > 0 && <span className="ml-1 font-medium text-delta-up">· {newSales} new</span>}
            </>
          }
        />
        <Tile
          label="Month-to-date sales"
          value={formatPesoCompact(kpis.mtdSales)}
          exact={formatPeso(kpis.mtdSales)}
          footer={<Delta value={mtdDelta} suffix={`vs ${PREV_MTD_LABEL}`} />}
        />
        <Tile
          label="MTD gross profit"
          value={formatPesoCompact(kpis.mtdGrossProfit)}
          exact={formatPeso(kpis.mtdGrossProfit)}
          footer={`${margin.toFixed(1)}% gross margin`}
        />
        <Tile
          label="Inventory value (at cost)"
          value={formatPesoCompact(kpis.inventoryValue)}
          exact={formatPeso(kpis.inventoryValue)}
          footer="Weighted average cost"
        />
      </div>
      <div className={cn("grid gap-3 sm:grid-cols-2", showPayables ? "xl:grid-cols-3" : "xl:grid-cols-2")}>
        <Tile label="Cash on hand & bank" value={formatPesoCompact(kpis.cash)} exact={formatPeso(kpis.cash)} footer="As of last shift close" />
        <Tile label="Accounts receivable" value={formatPesoCompact(kpis.receivables)} exact={formatPeso(kpis.receivables)} footer="Credit sales outstanding" />
        {showPayables && (
          <Tile label="Accounts payable" value={formatPesoCompact(kpis.payables)} exact={formatPeso(kpis.payables)} footer="Due to suppliers" />
        )}
      </div>
    </div>
  )
}
