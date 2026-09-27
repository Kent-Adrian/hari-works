import { cn } from "cn"
import { PRODUCT_BY_SKU, toKg } from "@/lib/catalog"
import { formatNumber, formatPeso } from "@/lib/mock-data"

export const NORMAL_LOSS_PCT = 2

export type CostInput = {
  sourceSku: string
  sourceQty: number
  finishedSku: string
  outputQty: number
  rawCost: number
  packaging: number
  labor: number
  other: number
}

export function computeRebag(c: CostInput) {
  const total = c.rawCost + c.packaging + c.labor + c.other
  const unitCost = c.outputQty > 0 ? total / c.outputQty : 0
  const inputKg = toKg(c.sourceSku, c.sourceQty)
  const outputKg = toKg(c.finishedSku, c.outputQty)
  const lossKg = inputKg - outputKg
  const lossPct = inputKg > 0 ? (lossKg / inputKg) * 100 : 0
  const price = PRODUCT_BY_SKU[c.finishedSku].price
  const margin = price - unitCost
  return { total, unitCost, inputKg, outputKg, lossKg, lossPct, price, margin, marginPct: (margin / price) * 100 }
}

export function CostBreakdown({ input, compact }: { input: CostInput; compact?: boolean }) {
  const r = computeRebag(input)
  const rows: [string, number, string?][] = [
    ["Raw material", input.rawCost, `${input.sourceQty} sacks at weighted average cost`],
    ["Packaging (bags, labels)", input.packaging],
    ["Direct labor – rebagging", input.labor],
    ["Other direct costs", input.other],
  ]

  return (
    <div className="space-y-4">
      <table className="w-full text-sm tabular-nums">
        <tbody>
          {rows.map(([label, value, hint]) => (
            <tr key={label} className="border-b border-dashed last:border-0">
              <td className="py-1.5">
                {label}
                {hint && !compact && <div className="text-xs text-muted-foreground">{hint}</div>}
              </td>
              <td className="py-1.5 text-right">{formatPeso(value)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-foreground/80 font-semibold">
            <td className="pt-2">Total finished-goods cost</td>
            <td className="pt-2 text-right">{formatPeso(r.total)}</td>
          </tr>
        </tfoot>
      </table>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-primary/8 p-3 ring-1 ring-primary/20">
          <div className="text-xs text-muted-foreground">Unit cost per bag</div>
          <div className="text-2xl font-semibold tracking-tight text-primary">{formatPeso(Math.round(r.unitCost))}</div>
          <div className="text-xs text-muted-foreground">
            {formatPeso(r.total)} ÷ {formatNumber(input.outputQty)} bags
          </div>
        </div>
        <div className="rounded-lg bg-muted p-3">
          <div className="text-xs text-muted-foreground">Margin at {formatPeso(r.price)} selling price</div>
          <div className={cn("text-2xl font-semibold tracking-tight", r.margin < 0 && "text-status-critical")}>
            {formatPeso(Math.round(r.margin))}
          </div>
          <div className="text-xs text-muted-foreground">{r.marginPct.toFixed(1)}% gross margin per bag</div>
        </div>
      </div>

      <YieldBar inputKg={r.inputKg} outputKg={r.outputKg} />
    </div>
  )
}

export function YieldBar({ inputKg, outputKg }: { inputKg: number; outputKg: number }) {
  const lossKg = inputKg - outputKg
  const lossPct = inputKg > 0 ? (lossKg / inputKg) * 100 : 0
  const sellablePct = inputKg > 0 ? Math.min(100, (outputKg / inputKg) * 100) : 0
  const aboveNormal = lossPct > NORMAL_LOSS_PCT
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-xs">
        <span className="font-medium">Yield</span>
        <span className="text-muted-foreground tabular-nums">
          {formatNumber(inputKg)} kg in → {formatNumber(outputKg)} kg sellable
        </span>
      </div>
      <div className="flex h-3 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary" style={{ width: `${sellablePct}%` }} />
        {lossKg > 0 && (
          <div className={cn("h-full border-l-2 border-card", aboveNormal ? "bg-status-critical" : "bg-status-warning")} style={{ width: `${100 - sellablePct}%` }} />
        )}
      </div>
      <div className="mt-1.5 text-xs text-muted-foreground tabular-nums">
        {lossKg > 0 ? (
          <>
            <span className={cn("font-medium", aboveNormal ? "text-status-critical" : "text-foreground")}>
              {formatNumber(lossKg)} kg ({lossPct.toFixed(1)}%) recorded as {aboveNormal ? "abnormal" : "normal"} loss
            </span>{" "}
            · normal threshold {NORMAL_LOSS_PCT}% · absorbed into finished cost
          </>
        ) : lossKg < 0 ? (
          <span className="font-medium text-status-critical">Output weight exceeds input weight — check quantities</span>
        ) : (
          "No loss · 100% yield"
        )}
      </div>
    </div>
  )
}
