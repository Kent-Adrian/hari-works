"use client"

import * as React from "react"
import { toast } from "sonner"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { posDevice } from "@/lib/audit"
import { useDemoStore, type PaymentMethod, type Sale } from "@/lib/demo-store"
import { formatPeso } from "@/lib/mock-data"

// Earlier in the shift (the example from requirements §12)
const OPENING_CASH = 5_000
const EARLIER: Partial<Record<PaymentMethod, number>> = { Cash: 35_000, GCash: 15_000, "Debit card": 10_000 }

export function EndShiftDialog({ open, onClose, sales, shiftId }: { open: boolean; onClose: () => void; sales: Sale[]; shiftId: string }) {
  const [actual, setActual] = React.useState("")
  const { logEvent, posBranch: branch } = useDemoStore()

  const byMethod = new Map<PaymentMethod, number>(Object.entries(EARLIER) as [PaymentMethod, number][])
  for (const s of sales) for (const p of s.payments) byMethod.set(p.method, (byMethod.get(p.method) ?? 0) + p.amount)
  const cashSales = byMethod.get("Cash") ?? 0
  const expected = OPENING_CASH + cashSales
  const counted = actual === "" ? null : Number(actual)
  const variance = counted === null ? null : counted - expected

  function submit() {
    logEvent({
      user: "R. Villanueva (Cashier)",
      branch,
      category: "Shift",
      action: variance ? "Shift closed with variance · sent for manager review" : "Shift closed · balanced",
      ref: shiftId,
      oldValue: `Expected ${formatPeso(expected)}`,
      newValue: `Actual ${formatPeso(counted ?? 0)}${variance ? ` (${variance > 0 ? "+" : "−"}${formatPeso(Math.abs(variance))})` : ""}`,
      device: posDevice(branch),
      flagged: !!variance,
    })
    toast.success(`Shift ${shiftId} closed`, {
      description:
        variance && variance !== 0
          ? `Variance ${variance > 0 ? "+" : "−"}${formatPeso(Math.abs(variance))} sent to M. Santos for review.`
          : "Balanced. End-of-day report sent to the branch manager.",
    })
    setActual("")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>End shift · {shiftId}</DialogTitle>
          <DialogDescription>Count the cash drawer. Variance goes to the manager for approval.</DialogDescription>
        </DialogHeader>

        <table className="w-full text-sm tabular-nums">
          <tbody>
            <tr className="border-b">
              <td className="py-1.5">Opening cash</td>
              <td className="text-right">{formatPeso(OPENING_CASH)}</td>
            </tr>
            {[...byMethod.entries()].map(([m, v]) => (
              <tr key={m} className="border-b border-dashed">
                <td className="py-1.5 text-muted-foreground">{m} sales</td>
                <td className="text-right">{formatPeso(v)}</td>
              </tr>
            ))}
            <tr className="font-semibold">
              <td className="pt-2">Expected cash in drawer</td>
              <td className="pt-2 text-right">{formatPeso(expected)}</td>
            </tr>
          </tbody>
        </table>

        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Actual cash counted (₱)</span>
          <Input type="number" autoFocus value={actual} onChange={(e) => setActual(e.target.value)} placeholder={String(expected - 500)} className="text-right text-lg tabular-nums" />
        </label>

        {variance !== null && (
          <div
            className={cn(
              "flex items-center justify-between rounded-lg p-3 text-sm font-medium",
              variance === 0 ? "bg-status-good/10 text-delta-up" : "bg-status-critical/10 text-status-critical"
            )}
          >
            <span>Cash variance</span>
            <span className="text-lg tabular-nums">
              {variance === 0 ? "Balanced" : `${variance > 0 ? "+" : "−"}${formatPeso(Math.abs(variance))}`}
            </span>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={counted === null}>
            Close shift & submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
