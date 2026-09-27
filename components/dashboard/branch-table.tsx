"use client"

import { CloudOff, Wifi } from "lucide-react"
import { cn } from "cn"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BRANCH_COLOR, BRANCHES, formatPeso, type BranchId, type BranchKpis } from "@/lib/mock-data"
import { sumStoreKpis } from "@/lib/demo-store"

export function BranchTable({
  branchIds,
  kpis,
  offlineBranch,
  selected,
  onSelect,
}: {
  branchIds: BranchId[]
  kpis: Record<BranchId, BranchKpis>
  /** A POS terminal simulating an outage in the demo */
  offlineBranch: { id: BranchId; queued: number } | null
  selected: BranchId | "ALL"
  onSelect?: (id: BranchId) => void
}) {
  const rows = BRANCHES.filter((b) => branchIds.includes(b.id)).map((b) =>
    offlineBranch?.id === b.id ? { ...b, online: false, queuedTx: offlineBranch.queued } : b
  )
  const total = sumStoreKpis(kpis, branchIds)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branch performance</CardTitle>
        <CardDescription>
          Month to date · inter-branch transfers excluded from sales
          {onSelect && " · click a branch to focus"}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Branch</TableHead>
              <TableHead>Sync</TableHead>
              <TableHead className="text-right">Today</TableHead>
              <TableHead className="text-right">MTD sales</TableHead>
              <TableHead className="text-right">Gross profit</TableHead>
              <TableHead className="text-right">Margin</TableHead>
              <TableHead className="text-right">Inventory</TableHead>
              <TableHead className="pr-4 text-right">Receivables</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="tabular-nums">
            {rows.map((b) => {
              const k = kpis[b.id]
              return (
                <TableRow
                  key={b.id}
                  onClick={onSelect ? () => onSelect(b.id) : undefined}
                  className={cn(onSelect && "cursor-pointer", selected === b.id && "bg-muted")}
                >
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-2 font-medium">
                      <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: BRANCH_COLOR[b.id] }} />
                      {b.name}
                      {b.isMain && <Badge variant="secondary">Main</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {b.online ? (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Wifi className="size-3.5 text-status-good" /> Online
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-status-critical">
                        <CloudOff className="size-3.5" /> Offline · {b.queuedTx} queued
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{formatPeso(k.todaySales)}</TableCell>
                  <TableCell className="text-right">{formatPeso(k.mtdSales)}</TableCell>
                  <TableCell className="text-right">{formatPeso(k.mtdGrossProfit)}</TableCell>
                  <TableCell className="text-right">{((k.mtdGrossProfit / k.mtdSales) * 100).toFixed(1)}%</TableCell>
                  <TableCell className="text-right">{formatPeso(k.inventoryValue)}</TableCell>
                  <TableCell className="pr-4 text-right">{formatPeso(k.receivables)}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
          {rows.length > 1 && (
            <TableFooter className="tabular-nums">
              <TableRow>
                <TableCell className="pl-4 font-semibold" colSpan={2}>
                  Consolidated
                </TableCell>
                <TableCell className="text-right">{formatPeso(total.todaySales)}</TableCell>
                <TableCell className="text-right">{formatPeso(total.mtdSales)}</TableCell>
                <TableCell className="text-right">{formatPeso(total.mtdGrossProfit)}</TableCell>
                <TableCell className="text-right">{((total.mtdGrossProfit / total.mtdSales) * 100).toFixed(1)}%</TableCell>
                <TableCell className="text-right">{formatPeso(total.inventoryValue)}</TableCell>
                <TableCell className="pr-4 text-right">{formatPeso(total.receivables)}</TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </CardContent>
    </Card>
  )
}
