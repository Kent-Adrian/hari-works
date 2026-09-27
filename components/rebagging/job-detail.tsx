"use client"

import { ArrowRight, Check, CircleCheck, CircleDashed, CircleX, Package, PackageCheck, Truck, X } from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ROLE_USERS, useRole } from "@/components/app-shell/role-context"
import { PRODUCT_BY_SKU, bomFor, productName, toKg } from "@/lib/catalog"
import { useDemoStore, type RebagJob } from "@/lib/demo-store"
import { BRANCH_BY_ID, formatNumber, formatPeso } from "@/lib/mock-data"
import { CostBreakdown } from "./cost-breakdown"

export function StatusBadge({ status }: { status: RebagJob["status"] }) {
  const Icon = status === "Posted" ? CircleCheck : status === "Rejected" ? CircleX : CircleDashed
  return (
    <Badge
      variant="outline"
      className={cn(
        status === "Posted" && "border-status-good/40 text-delta-up",
        status === "Rejected" && "border-status-critical/40 text-status-critical",
        status === "Pending approval" && "border-status-warning/60"
      )}
    >
      <Icon /> {status}
    </Badge>
  )
}

export function JobDetail({ job }: { job: RebagJob }) {
  const { role } = useRole()
  const { approveRebag, approvals, reject, inventory, journal } = useDemoStore()
  const src = PRODUCT_BY_SKU[job.sourceSku]
  const fin = PRODUCT_BY_SKU[job.finishedSku]
  const canApprove = role === "Owner" || role === "Admin"
  const entry = journal.find((j) => j.ref === job.id)
  const stock = inventory[job.branch]

  function onApprove() {
    approveRebag(job.id, `${ROLE_USERS[role].name} (${role})`)
    toast.success(`${job.id} approved and posted`, {
      description: `${job.sourceQty} sacks consumed, ${job.outputQty} bags added to ${BRANCH_BY_ID[job.branch].name} stock. Journal entry created.`,
    })
  }

  function onReject() {
    const a = approvals.find((x) => x.rebagId === job.id)
    if (a) reject(a.id, `${ROLE_USERS[role].name} (${role})`)
    toast.error(`${job.id} rejected`, { description: "Logged to audit trail." })
  }

  const steps = [
    { icon: Truck, title: "Raw material received", detail: job.sourceLot, done: true },
    { icon: Package, title: "Rebagging requested", detail: `${job.date} · ${job.requestedBy}`, done: true },
    {
      icon: Check,
      title: job.status === "Rejected" ? "Rejected" : "Approved & posted",
      detail: job.approvedBy ? `${job.approvedBy}${entry ? ` · ${entry.id}` : ""}` : job.status === "Rejected" ? "No inventory movement" : "Waiting for Owner / Admin",
      done: job.status === "Posted",
    },
    {
      icon: PackageCheck,
      title: "Finished lot available for sale",
      detail: job.status === "Posted" ? `Lot ${job.finishedLot} · ${BRANCH_BY_ID[job.branch].name}` : `Lot ${job.finishedLot} (reserved)`,
      done: job.status === "Posted",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <span className="font-mono">{job.id}</span>
          <StatusBadge status={job.status} />
        </CardTitle>
        <CardDescription>
          {BRANCH_BY_ID[job.branch].name} · {job.date} · requested by {job.requestedBy}
        </CardDescription>
        {job.status === "Pending approval" && (
          <CardAction className="flex gap-2">
            {canApprove ? (
              <>
                <Button variant="outline" size="sm" onClick={onReject}>
                  <X /> Reject
                </Button>
                <Button size="sm" onClick={onApprove}>
                  <Check /> Approve & post
                </Button>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">Needs Owner or Admin approval</span>
            )}
          </CardAction>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Conversion flow: source → process → finished */}
        <div className="grid items-stretch gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
          <FlowBox label="Source (consumed)" title={productName(src)} qty={`${formatNumber(job.sourceQty)} sacks`} kg={toKg(job.sourceSku, job.sourceQty)} foot={`On hand now: ${formatNumber(stock[job.sourceSku].qty)} sacks`} />
          <ArrowRight className="mx-auto size-5 rotate-90 self-center text-muted-foreground md:rotate-0" />
          <div className="rounded-lg border border-dashed p-3 text-sm">
            <div className="text-xs font-medium text-muted-foreground">Rebagging (BOM per bag)</div>
            <ul className="mt-1.5 space-y-0.5 text-xs">
              {bomFor(job.finishedSku).map((b) => (
                <li key={b.item} className="flex justify-between gap-2">
                  <span className="truncate">{b.item}</span>
                  <span className="tabular-nums">{formatPeso(b.unitCost)}</span>
                </li>
              ))}
            </ul>
          </div>
          <ArrowRight className="mx-auto size-5 rotate-90 self-center text-muted-foreground md:rotate-0" />
          <FlowBox
            highlight
            label="Finished goods (produced)"
            title={productName(fin)}
            qty={`${formatNumber(job.outputQty)} bags`}
            kg={toKg(job.finishedSku, job.outputQty)}
            foot={`On hand now: ${formatNumber(stock[job.finishedSku].qty)} bags · avg cost ${formatPeso(stock[job.finishedSku].avgCost)}`}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-medium">Cost build-up</h3>
            <CostBreakdown input={job} />
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium">Traceability</h3>
            <ol className="relative space-y-4 border-l pl-5">
              {steps.map((s) => (
                <li key={s.title} className="relative">
                  <span
                    className={cn(
                      "absolute top-0 -left-[31px] flex size-5 items-center justify-center rounded-full ring-4 ring-card",
                      s.done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}
                  >
                    <s.icon className="size-3" />
                  </span>
                  <div className={cn("text-sm font-medium", !s.done && "text-muted-foreground")}>{s.title}</div>
                  <div className="text-xs text-muted-foreground">{s.detail}</div>
                </li>
              ))}
            </ol>

            {entry && (
              <div className="mt-5 rounded-lg border bg-muted/40 p-3">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-medium">Auto journal entry</span>
                  <span className="font-mono text-muted-foreground">{entry.id}</span>
                </div>
                <table className="w-full text-xs tabular-nums">
                  <tbody>
                    {entry.lines.map((l) => (
                      <tr key={l.account}>
                        <td className={cn("py-0.5", l.credit && "pl-4")}>{l.account}</td>
                        <td className="py-0.5 text-right">{l.debit ? formatPeso(l.debit) : ""}</td>
                        <td className="w-24 py-0.5 text-right">{l.credit ? formatPeso(l.credit) : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function FlowBox({ label, title, qty, kg, foot, highlight }: { label: string; title: string; qty: string; kg: number; foot: string; highlight?: boolean }) {
  return (
    <div className={cn("rounded-lg border p-3", highlight && "border-primary/40 bg-primary/5")}>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{title}</div>
      <div className="text-lg font-semibold tabular-nums">
        {qty} <span className="text-sm font-normal text-muted-foreground">· {formatNumber(kg)} kg</span>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{foot}</div>
    </div>
  )
}
