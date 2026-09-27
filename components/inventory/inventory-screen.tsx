"use client"

import * as React from "react"
import { AlertTriangle, Search } from "lucide-react"
import { cn } from "cn"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Restricted } from "@/components/app-shell/restricted"
import { ROLE_USERS, useRole } from "@/components/app-shell/role-context"
import { PRODUCTS, REORDER_LEVEL } from "@/lib/catalog"
import { useDemoStore } from "@/lib/demo-store"
import { BRANCHES, BRANCH_COLOR, formatNumber, formatPeso } from "@/lib/mock-data"

const FILTERS = ["All", "UREA", "14-14-14", "16-20-0", "21-0-0", "18-46-0", "POTASH", "Hari Works"] as const

export function InventoryScreen() {
  const { role } = useRole()
  const { inventory } = useDemoStore()
  const [query, setQuery] = React.useState("")
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]>("All")

  if (role === "Cashier") {
    return <Restricted pos title="Inventory is restricted" description="Cashiers see stock availability inside the POS only." />
  }

  // Managers see their own branch; cross-branch visibility needs authorization
  const branches = role === "Manager" ? BRANCHES.filter((b) => b.id === ROLE_USERS.Manager.branch) : BRANCHES

  const rows = PRODUCTS.filter((p) => {
    if (filter === "Hari Works" && !p.privateLabel) return false
    if (filter !== "All" && filter !== "Hari Works" && p.formulation !== filter) return false
    const q = query.trim().toLowerCase()
    return !q || `${p.formulation} ${p.brand} ${p.sku}`.toLowerCase().includes(q)
  }).map((p) => {
    const qty = branches.map((b) => inventory[b.id][p.sku].qty)
    const value = branches.reduce((a, b) => a + inventory[b.id][p.sku].qty * inventory[b.id][p.sku].avgCost, 0)
    const total = qty.reduce((a, v) => a + v, 0)
    return { p, qty, total, kg: total * p.packKg, value }
  })

  const totals = {
    qty: branches.map((_, i) => rows.reduce((a, r) => a + r.qty[i], 0)),
    total: rows.reduce((a, r) => a + r.total, 0),
    kg: rows.reduce((a, r) => a + r.kg, 0),
    value: rows.reduce((a, r) => a + r.value, 0),
  }
  const low = rows.reduce((a, r) => a + r.qty.filter((q) => q < REORDER_LEVEL).length, 0)

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Inventory</h1>
        <p className="text-sm text-muted-foreground">Stock by branch in sacks and kilograms, valued at weighted average cost</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="gap-1 px-4">
          <div className="text-xs font-medium text-muted-foreground">Inventory value</div>
          <div className="text-2xl font-semibold tracking-tight">{formatPeso(totals.value)}</div>
        </Card>
        <Card className="gap-1 px-4">
          <div className="text-xs font-medium text-muted-foreground">Stock on hand</div>
          <div className="text-2xl font-semibold tracking-tight">
            {formatNumber(totals.total)} <span className="text-base font-normal text-muted-foreground">sacks · {formatNumber(totals.kg / 1000)} t</span>
          </div>
        </Card>
        <Card className={cn("gap-1 px-4", low > 0 && "ring-status-serious/50")}>
          <div className="text-xs font-medium text-muted-foreground">Below reorder level ({REORDER_LEVEL} sacks)</div>
          <div className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            {low > 0 && <AlertTriangle className="size-5 text-status-serious" />}
            {low} <span className="text-base font-normal text-muted-foreground">product-branch pairs</span>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock by branch</CardTitle>
          <CardDescription>Updates live from POS sales, rebagging and transfers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 px-0">
          <div className="flex flex-wrap items-center gap-2 px-4">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search product or SKU" className="pl-8" />
            </div>
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn("rounded-full border px-3 py-0.5 text-sm", filter === f ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}
              >
                {f}
              </button>
            ))}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Product</TableHead>
                <TableHead>SKU</TableHead>
                {branches.map((b) => (
                  <TableHead key={b.id} className="text-right">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2 rounded-[2px]" style={{ background: BRANCH_COLOR[b.id] }} />
                      {b.short}
                    </span>
                  </TableHead>
                ))}
                <TableHead className="text-right">Total sacks</TableHead>
                <TableHead className="text-right">Total kg</TableHead>
                <TableHead className="pr-4 text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="tabular-nums">
              {rows.map((r) => (
                <TableRow key={r.p.sku}>
                  <TableCell className="pl-4">
                    <span className="font-medium">
                      {r.p.formulation} {r.p.brand}
                    </span>{" "}
                    <span className="text-muted-foreground">{r.p.packKg} KG</span>
                    {r.p.privateLabel && (
                      <Badge variant="secondary" className="ml-2">
                        Rebagged
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{r.p.sku}</TableCell>
                  {r.qty.map((q, i) => (
                    <TableCell key={i} className={cn("text-right", q === 0 ? "font-medium text-status-critical" : q < REORDER_LEVEL && "font-medium text-status-serious")}>
                      {q < REORDER_LEVEL && <AlertTriangle className="mr-1 inline size-3" />}
                      {q === 0 ? "Out" : formatNumber(q)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-medium">{formatNumber(r.total)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{formatNumber(r.kg)}</TableCell>
                  <TableCell className="pr-4 text-right">{formatPeso(r.value)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter className="tabular-nums">
              <TableRow>
                <TableCell className="pl-4 font-semibold" colSpan={2}>
                  Total
                </TableCell>
                {totals.qty.map((q, i) => (
                  <TableCell key={i} className="text-right">
                    {formatNumber(q)}
                  </TableCell>
                ))}
                <TableCell className="text-right">{formatNumber(totals.total)}</TableCell>
                <TableCell className="text-right">{formatNumber(totals.kg)}</TableCell>
                <TableCell className="pr-4 text-right">{formatPeso(totals.value)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
