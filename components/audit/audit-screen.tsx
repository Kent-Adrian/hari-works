"use client"

import * as React from "react"
import { ArrowRight, Download, Flag, Lock, Search } from "lucide-react"
import { cn } from "cn"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EXPORT_SCOPE, showPlanned } from "@/components/app-shell/planned"
import { Restricted } from "@/components/app-shell/restricted"
import { useRole } from "@/components/app-shell/role-context"
import type { AuditCategory } from "@/lib/audit"
import { TODAY, fmtDate } from "@/lib/demo-date"
import { useDemoStore } from "@/lib/demo-store"
import { BRANCHES, BRANCH_BY_ID, type BranchId } from "@/lib/mock-data"

// Filter groups match the sensitive actions listed in requirements §19
const GROUPS: { label: string; categories?: AuditCategory[] }[] = [
  { label: "All" },
  { label: "Approvals", categories: ["Approval", "Rebagging"] },
  { label: "Prices", categories: ["Price change"] },
  { label: "Discounts & credit", categories: ["Discount", "Credit override"] },
  { label: "Voids & returns", categories: ["Void"] },
  { label: "Stock", categories: ["Stock adjustment"] },
  { label: "Sales", categories: ["Sale"] },
  { label: "Shifts & cash", categories: ["Shift"] },
  { label: "Security & sync", categories: ["Security", "Sync"] },
  { label: "Users & roles", categories: ["User & role"] },
]

export function AuditScreen() {
  const { role } = useRole()
  const { audit } = useDemoStore()
  const [group, setGroup] = React.useState("All")
  const [branch, setBranch] = React.useState<BranchId | "ALL">("ALL")
  const [flaggedOnly, setFlaggedOnly] = React.useState(false)
  const [query, setQuery] = React.useState("")

  if (role === "Cashier" || role === "Manager") {
    return <Restricted pos={role === "Cashier"} title="Audit trail is restricted" description="Only the Owner and Admin can review the audit trail. Nobody can edit or delete entries." />
  }

  const cats = GROUPS.find((g) => g.label === group)?.categories
  const q = query.trim().toLowerCase()
  const rows = audit.filter(
    (e) =>
      (!cats || cats.includes(e.category)) &&
      (branch === "ALL" || e.branch === branch) &&
      (!flaggedOnly || e.flagged) &&
      (!q || [e.user, e.action, e.ref, e.oldValue, e.newValue, e.reason, e.approver].some((v) => v?.toLowerCase().includes(q)))
  )

  const todayLabel = fmtDate(TODAY)
  const todays = audit.filter((e) => e.date === todayLabel)
  const overrides = audit.filter((e) => e.category === "Discount" || e.category === "Credit override").length

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex flex-wrap items-center gap-2 text-xl font-semibold tracking-tight">
            Audit trail
            <Badge variant="secondary">
              <Lock /> Append-only · cannot be edited or deleted
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground">Who did what, when, where, on which device, with the value before and after</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => showPlanned("Audit log export", 3, `${EXPORT_SCOPE} Every export is itself logged.`)}>
          <Download /> Export
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Events today" value={todays.length} />
        <Stat label="Flagged for review" value={audit.filter((e) => e.flagged).length} warn />
        <Stat label="Approvals & rejections" value={audit.filter((e) => e.category === "Approval" || e.action.includes("approved") || e.action.includes("rejected")).length} />
        <Stat label="Discount & credit overrides" value={overrides} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity log</CardTitle>
          <CardDescription>
            Showing {rows.length} of {audit.length} entries · newest first
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 px-0">
          <div className="flex flex-wrap items-center gap-2 px-4">
            <div className="relative w-full sm:w-60">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search user, reference, value…" className="pl-8" />
            </div>
            <NativeSelect value={branch} onChange={(e) => setBranch(e.target.value as BranchId | "ALL")} className="w-44">
              <option value="ALL">All branches</option>
              {BRANCHES.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </NativeSelect>
            <button
              type="button"
              onClick={() => setFlaggedOnly((f) => !f)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm",
                flaggedOnly ? "border-status-serious bg-status-serious/10 font-medium" : "hover:bg-muted"
              )}
            >
              <Flag className="size-3.5 text-status-serious" /> Flagged only
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 px-4">
            {GROUPS.map((g) => (
              <button
                key={g.label}
                type="button"
                onClick={() => setGroup(g.label)}
                className={cn("rounded-full border px-3 py-0.5 text-sm", group === g.label ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}
              >
                {g.label}
              </button>
            ))}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">When</TableHead>
                <TableHead>User · branch</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Before → after</TableHead>
                <TableHead>Reason · approver</TableHead>
                <TableHead className="pr-4">Device</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((e) => (
                <TableRow key={e.id} className={cn("align-top", e.isNew && "bg-primary/5")}>
                  <TableCell className="pl-4 align-top">
                    <div className="font-medium tabular-nums">{e.time}</div>
                    <div className="text-xs text-muted-foreground">{e.date === todayLabel ? "Today" : e.date}</div>
                  </TableCell>
                  <TableCell className="align-top">
                    <div>{e.user}</div>
                    <div className="text-xs text-muted-foreground">{BRANCH_BY_ID[e.branch].name}</div>
                  </TableCell>
                  <TableCell className="max-w-72 align-top whitespace-normal">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {e.flagged && <Flag className="size-3.5 shrink-0 text-status-serious" aria-label="Flagged" />}
                      <span className="font-medium">{e.action}</span>
                      {e.isNew && <Badge>New</Badge>}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <Badge variant="outline">{e.category}</Badge>
                      {e.ref && <span className="font-mono">{e.ref}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-72 align-top text-xs whitespace-normal">
                    {e.oldValue || e.newValue ? (
                      <div className="flex flex-wrap items-center gap-1">
                        {e.oldValue && <span className="text-muted-foreground line-through decoration-muted-foreground/50">{e.oldValue}</span>}
                        {e.oldValue && e.newValue && <ArrowRight className="size-3 shrink-0 text-muted-foreground" />}
                        {e.newValue && <span className="font-medium">{e.newValue}</span>}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-64 align-top text-xs whitespace-normal">
                    {e.reason && <div>{e.reason}</div>}
                    {e.approver && <div className="text-muted-foreground">Approved by {e.approver}</div>}
                    {!e.reason && !e.approver && <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="pr-4 align-top text-xs text-muted-foreground">{e.device}</TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No entries match these filters
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function Stat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <Card className={cn("gap-1 px-4", warn && value > 0 && "ring-status-serious/50")}>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
        {warn && value > 0 && <Flag className="size-5 text-status-serious" />}
        {value}
      </div>
    </Card>
  )
}
