"use client"

import { CloudOff, LayoutDashboard, Printer } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { cn } from "cn"
import { Button, buttonVariants } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PRODUCT_BY_SKU, productName } from "@/lib/catalog"
import { useDemoStore, type Sale } from "@/lib/demo-store"
import { posDevice } from "@/lib/audit"
import { TODAY, fmtDate } from "@/lib/demo-date"
import { BRANCH_BY_ID, formatPeso } from "@/lib/mock-data"

const money = (n: number) => n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function ReceiptDialog({ sale, onClose }: { sale: Sale | null; onClose: () => void }) {
  const { journal, customers, inventory, logEvent } = useDemoStore()
  if (!sale) return null
  const customer = customers.find((c) => c.id === sale.customerId)
  const entry = journal.find((j) => j.ref === sale.id)
  const branch = BRANCH_BY_ID[sale.branch]

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Sale completed · {sale.id}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Printed sales invoice (sample layout) */}
          <div className="rounded-md border bg-white p-4 font-mono text-[11px] leading-relaxed text-neutral-900 shadow-sm">
            <div className="text-center">
              <div className="text-xs font-bold">HARI WORKS CORPORATION</div>
              <div>{branch.name} Branch</div>
              <div>VAT-Exempt Reg. TIN 000-000-000-00000 (sample)</div>
              <div className="mt-1 font-bold">SALES INVOICE</div>
              <div>No. {sale.id}</div>
            </div>
            <div className="my-2 border-t border-dashed border-neutral-400" />
            <div>
              Date: {fmtDate(TODAY)} {sale.time}
            </div>
            <div>Cashier: {sale.cashier}</div>
            <div>Sold to: {customer?.name}</div>
            <div className="my-2 border-t border-dashed border-neutral-400" />
            {sale.lines.map((l) => (
              <div key={l.sku}>
                <div>{productName(PRODUCT_BY_SKU[l.sku])}</div>
                <div className="flex justify-between">
                  <span>
                    {l.qty} sack × {money(l.price)}
                  </span>
                  <span>{money(l.qty * l.price)}</span>
                </div>
              </div>
            ))}
            <div className="my-2 border-t border-dashed border-neutral-400" />
            <Row label="Subtotal" value={money(sale.subtotal)} />
            {sale.discount > 0 && <Row label={`Discount ${sale.discountPct}%`} value={`-${money(sale.discount)}`} />}
            <Row label="TOTAL" value={money(sale.total)} bold />
            <div className="my-2 border-t border-dashed border-neutral-400" />
            <Row label="VAT-Exempt Sales" value={money(sale.total)} />
            <Row label="VATable Sales" value="0.00" />
            <Row label="VAT (12%)" value="0.00" />
            <div className="my-2 border-t border-dashed border-neutral-400" />
            {sale.payments.map((p) => (
              <Row key={p.method} label={p.method} value={money(p.amount)} />
            ))}
            <div className="mt-3 text-center">Fertilizer is VAT-exempt under Sec. 109 of the NIRC.</div>
            <div className="text-center">Sample invoice for demonstration only.</div>
          </div>

          {/* What the back office did automatically */}
          <div className="space-y-3 text-sm">
            <div className="font-medium">What happened automatically</div>
            {sale.offline ? (
              <div className="flex gap-2 rounded-lg bg-status-warning/15 p-3">
                <CloudOff className="mt-0.5 size-4 shrink-0" />
                <div>
                  <div className="font-medium">Saved offline on this terminal</div>
                  <div className="text-xs text-muted-foreground">
                    Receipt printed. Inventory, journal entry and dashboard update as soon as the connection returns.
                  </div>
                </div>
              </div>
            ) : (
              <ol className="space-y-3">
                <li>
                  <div className="font-medium">1 · Inventory deducted at {branch.name}</div>
                  <ul className="mt-1 text-xs text-muted-foreground">
                    {sale.lines.map((l) => (
                      <li key={l.sku}>
                        {productName(PRODUCT_BY_SKU[l.sku])}: −{l.qty} → {inventory[sale.branch][l.sku].qty} left
                      </li>
                    ))}
                  </ul>
                </li>
                <li>
                  <div className="font-medium">2 · Journal entry posted {entry && <span className="font-mono text-xs text-muted-foreground">{entry.id}</span>}</div>
                  {entry && (
                    <table className="mt-1 w-full text-xs tabular-nums">
                      <thead className="text-muted-foreground">
                        <tr>
                          <th className="text-left font-normal">Account</th>
                          <th className="text-right font-normal">Debit</th>
                          <th className="text-right font-normal">Credit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entry.lines.map((l) => (
                          <tr key={l.account}>
                            <td className={cn("py-0.5", l.credit && "pl-3")}>{l.account}</td>
                            <td className="text-right">{l.debit ? formatPeso(l.debit) : ""}</td>
                            <td className="text-right">{l.credit ? formatPeso(l.credit) : ""}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </li>
                <li>
                  <div className="font-medium">3 · Owner dashboard updated</div>
                  <div className="text-xs text-muted-foreground">
                    Sales {formatPeso(sale.total)} · gross profit {formatPeso(sale.total - sale.cogs)} (
                    {(((sale.total - sale.cogs) / sale.total) * 100).toFixed(1)}%)
                  </div>
                </li>
                {sale.approvals.map((a) => (
                  <li key={a} className="text-xs text-muted-foreground">
                    ✓ {a}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        <DialogFooter>
          <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
            <LayoutDashboard /> View dashboard
          </Link>
          <Button
            variant="outline"
            onClick={() => {
              logEvent({ user: `${sale.cashier} (Cashier)`, branch: sale.branch, category: "Sale", action: "Invoice printed", ref: sale.id, device: posDevice(sale.branch) })
              toast.success("Sent to receipt printer", { description: "Every print and reprint is logged in the audit trail." })
            }}
          >
            <Printer /> Print
          </Button>
          <Button onClick={onClose}>New sale</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={cn("flex justify-between", bold && "text-xs font-bold")}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}
