"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Restricted } from "@/components/app-shell/restricted"
import { useRole } from "@/components/app-shell/role-context"
import { PRODUCT_BY_SKU, productName } from "@/lib/catalog"
import { rebagTotal, useDemoStore } from "@/lib/demo-store"
import { BRANCH_BY_ID, formatNumber, formatPeso } from "@/lib/mock-data"
import { JobDetail, StatusBadge } from "./job-detail"
import { NewRebagForm } from "./new-rebag-form"

export function RebaggingScreen({ initialJob }: { initialJob?: string }) {
  const { role } = useRole()
  const { rebags } = useDemoStore()
  const [selectedId, setSelectedId] = React.useState(initialJob ?? rebags[0]?.id)
  const [creating, setCreating] = React.useState(false)

  if (role === "Cashier") {
    return <Restricted pos title="Rebagging is restricted" description="Production and inventory conversion are handled by managers and approved by the Owner or Admin." />
  }

  const selected = rebags.find((j) => j.id === selectedId) ?? rebags[0]
  const posted = rebags.filter((j) => j.status === "Posted")
  const bags = posted.reduce((a, j) => a + j.outputQty, 0)
  const conversion = posted.reduce((a, j) => a + j.packaging + j.labor + j.other, 0)
  const pending = rebags.filter((j) => j.status === "Pending approval").length

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Rebagging / Production</h1>
          <p className="text-sm text-muted-foreground">
            Purchase → raw material → rebagging → Hari Works finished goods, with full cost and traceability
          </p>
        </div>
        {!creating && (
          <Button onClick={() => setCreating(true)}>
            <Plus /> New rebagging
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Bags produced this month" value={formatNumber(bags)} foot={`${posted.length} posted jobs`} />
        <Stat label="Conversion cost this month" value={formatPeso(conversion)} foot={`${formatPeso(bags ? Math.round(conversion / bags) : 0)} per bag (packaging + labor + other)`} />
        <Stat label="Rebagged product margin" value="14.6%" foot="HARI WORKS UREA 50 KG at ₱1,850" />
        <Stat label="Waiting for approval" value={String(pending)} foot={pending ? "Inventory moves only after approval" : "All clear"} highlight={pending > 0} />
      </div>

      {creating ? (
        <NewRebagForm
          onCancel={() => setCreating(false)}
          onSubmitted={(job) => {
            setCreating(false)
            setSelectedId(job.id)
          }}
        />
      ) : (
        <>
          {selected && <JobDetail job={selected} />}

          <Card>
            <CardHeader>
              <CardTitle>Production history</CardTitle>
              <CardDescription>Click a job to see its cost build-up and traceability</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Job</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Conversion</TableHead>
                    <TableHead className="text-right">Total cost</TableHead>
                    <TableHead className="text-right">Unit cost</TableHead>
                    <TableHead className="pr-4">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="tabular-nums">
                  {rebags.map((j) => (
                    <TableRow
                      key={j.id}
                      onClick={() => setSelectedId(j.id)}
                      className={cn("cursor-pointer", selected?.id === j.id && "bg-muted")}
                    >
                      <TableCell className="pl-4 font-mono text-xs">{j.id}</TableCell>
                      <TableCell>{j.date}</TableCell>
                      <TableCell>{BRANCH_BY_ID[j.branch].short}</TableCell>
                      <TableCell>
                        {j.sourceQty} × {productName(PRODUCT_BY_SKU[j.sourceSku])} → {j.outputQty} × {productName(PRODUCT_BY_SKU[j.finishedSku])}
                      </TableCell>
                      <TableCell className="text-right">{formatPeso(rebagTotal(j))}</TableCell>
                      <TableCell className="text-right font-medium">{formatPeso(Math.round(rebagTotal(j) / j.outputQty))}</TableCell>
                      <TableCell className="pr-4">
                        <StatusBadge status={j.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function Stat({ label, value, foot, highlight }: { label: string; value: string; foot: string; highlight?: boolean }) {
  return (
    <Card className={cn("gap-1 px-4", highlight && "ring-status-warning/60")}>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
      <div className="text-xs text-muted-foreground">{foot}</div>
    </Card>
  )
}
