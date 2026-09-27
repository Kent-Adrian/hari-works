"use client"

import * as React from "react"
import { AlertTriangle, CheckCircle2, Plus, ShieldCheck, Trash2 } from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import type { Customer } from "@/lib/catalog"
import type { Payment, PaymentMethod } from "@/lib/demo-store"
import { formatPeso } from "@/lib/mock-data"
import { DEMO_MANAGER, type PinRequest } from "./manager-pin-dialog"

const METHODS: PaymentMethod[] = ["Cash", "GCash", "Maya", "Debit card", "Credit card", "Bank transfer", "Check", "Charge account"]

export function CheckoutDialog({
  open,
  total,
  customer,
  onClose,
  onComplete,
  requestPin,
}: {
  open: boolean
  total: number
  customer: Customer
  onClose: () => void
  onComplete: (payments: Payment[], approvals: string[]) => void
  requestPin: (r: PinRequest) => void
}) {
  const [rows, setRows] = React.useState<Payment[]>([{ method: "Cash", amount: total }])
  const [creditApproved, setCreditApproved] = React.useState(false)

  const methods = customer.creditLimit > 0 ? METHODS : METHODS.filter((m) => m !== "Charge account")
  const nonCash = rows.filter((r) => r.method !== "Cash").reduce((a, r) => a + r.amount, 0)
  const cash = rows.filter((r) => r.method === "Cash").reduce((a, r) => a + r.amount, 0)
  const paid = nonCash + cash
  const remaining = Math.max(0, total - paid)
  const change = Math.max(0, paid - total)
  const charge = rows.filter((r) => r.method === "Charge account").reduce((a, r) => a + r.amount, 0)
  const available = customer.creditLimit - customer.outstanding
  const overLimit = charge > available
  const overpaidNonCash = nonCash > total

  const canComplete = remaining === 0 && !overpaidNonCash && (!overLimit || creditApproved)

  function setRow(i: number, patch: Partial<Payment>) {
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)))
    if (patch.method || patch.amount !== undefined) setCreditApproved(false)
  }

  function addRow() {
    setRows((rs) => [...rs, { method: rs.some((r) => r.method === "GCash") ? "Maya" : "GCash", amount: remaining }])
  }

  function finish() {
    // Cash row is recorded net of change given back
    const net = rows
      .filter((r) => r.amount > 0)
      .map((r) => (r.method === "Cash" ? { ...r, amount: r.amount - change } : r))
      .filter((r) => r.amount > 0)
    onComplete(net, creditApproved ? [`Credit limit override approved by ${DEMO_MANAGER}`] : [])
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Payment</DialogTitle>
          <DialogDescription>
            {customer.name} · split across any payment methods
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg bg-muted p-3 text-center">
          <div className="text-xs text-muted-foreground">Amount due</div>
          <div className="text-3xl font-semibold tracking-tight tabular-nums">{formatPeso(total)}</div>
        </div>

        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="flex gap-2">
              <NativeSelect className="w-44 shrink-0" value={r.method} onChange={(e) => setRow(i, { method: e.target.value as PaymentMethod })}>
                {methods.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </NativeSelect>
              <Input
                type="number"
                min={0}
                value={r.amount}
                onChange={(e) => setRow(i, { amount: Math.max(0, Number(e.target.value) || 0) })}
                className="text-right tabular-nums"
              />
              {rows.length > 1 && (
                <Button variant="ghost" size="icon" aria-label="Remove payment" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}>
                  <Trash2 />
                </Button>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addRow} disabled={remaining === 0}>
            <Plus /> Split payment
          </Button>
        </div>

        {charge > 0 && (
          <div className={cn("rounded-lg p-3 text-sm", overLimit && !creditApproved ? "bg-status-critical/10" : "bg-muted")}>
            <div className="grid grid-cols-3 gap-2 text-xs tabular-nums">
              <div>
                <div className="text-muted-foreground">Credit limit</div>
                <div className="font-medium">{formatPeso(customer.creditLimit)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Outstanding</div>
                <div className="font-medium">{formatPeso(customer.outstanding)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Available</div>
                <div className="font-medium">{formatPeso(available)}</div>
              </div>
            </div>
            {overLimit && !creditApproved && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <AlertTriangle className="size-4 text-status-critical" />
                <span className="font-medium text-status-critical">
                  Credit limit exceeded by {formatPeso(charge - available)}
                </span>
                <Button
                  size="sm"
                  className="ml-auto"
                  onClick={() =>
                    requestPin({
                      title: "Credit limit override",
                      reason: (
                        <>
                          {customer.name}: new balance would be <strong>{formatPeso(customer.outstanding + charge)}</strong> against a{" "}
                          {formatPeso(customer.creditLimit)} limit.
                        </>
                      ),
                      onApproved: () => setCreditApproved(true),
                    })
                  }
                >
                  <ShieldCheck /> Request manager override
                </Button>
              </div>
            )}
            {overLimit && creditApproved && (
              <div className="mt-3 flex items-center gap-2 text-delta-up">
                <CheckCircle2 className="size-4" /> Override approved by {DEMO_MANAGER} · logged to audit trail
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between text-sm tabular-nums">
          <span className="text-muted-foreground">{remaining > 0 ? "Remaining" : "Change"}</span>
          <span className={cn("text-lg font-semibold", remaining > 0 && "text-status-critical")}>
            {formatPeso(remaining > 0 ? remaining : change)}
          </span>
        </div>
        {overpaidNonCash && <p className="text-xs text-status-critical">Non-cash payments cannot exceed the amount due.</p>}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Back
          </Button>
          <Button size="lg" onClick={finish} disabled={!canComplete}>
            Complete sale
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
