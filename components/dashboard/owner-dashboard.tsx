"use client"

import * as React from "react"
import { Download, Lock } from "lucide-react"
import { cn } from "cn"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EXPORT_SCOPE, showPlanned } from "@/components/app-shell/planned"
import { Restricted } from "@/components/app-shell/restricted"
import { ROLE_USERS, useRole } from "@/components/app-shell/role-context"
import { BRANCH_BY_ID, BRANCHES, formatPeso, type BranchId } from "@/lib/mock-data"
import { MTD_LABEL } from "@/lib/demo-date"
import { sumStoreKpis, useDemoStore } from "@/lib/demo-store"
import { AlertsPanel } from "./alerts-panel"
import { ApprovalsPanel } from "./approvals-panel"
import { BranchTable } from "./branch-table"
import { FormulationChart } from "./formulation-chart"
import { KpiTiles } from "./kpi-tiles"
import { SalesTrendChart } from "./sales-trend-chart"
import { TopSkus } from "./top-skus"

const ALL_IDS = BRANCHES.map((b) => b.id)

export function OwnerDashboard() {
  const { role } = useRole()
  const store = useDemoStore()
  const [filter, setFilter] = React.useState<BranchId | "ALL">("ALL")

  if (role === "Cashier") {
    return (
      <Restricted
        pos
        title="Back Office is restricted"
        description="Cashiers work in Hari Works POS. They cannot view costs, inventory valuation or financial statements."
      />
    )
  }

  // Managers only see their own branch; Owner and Admin see everything
  const lockedBranch = role === "Manager" ? ROLE_USERS.Manager.branch! : null
  const active: BranchId | "ALL" = lockedBranch ?? filter
  const branchIds = active === "ALL" ? ALL_IDS : [active]
  const kpis = sumStoreKpis(store.kpis, branchIds)
  const newSales = store.sales.filter((s) => branchIds.includes(s.branch))

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {active === "ALL" ? "Corporate overview" : `${BRANCH_BY_ID[active].name} overview`}
          </h1>
          <p className="text-sm text-muted-foreground">
            {active === "ALL" ? "Consolidated across all 4 branches" : "Branch-level figures"} · updated just now
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => showPlanned("Dashboard export", 3, EXPORT_SCOPE)}>
          <Download /> Export
        </Button>
      </div>

      {/* Filters sit in one row above everything they control */}
      <div className="flex flex-wrap items-center gap-2">
        {lockedBranch ? (
          <Badge variant="secondary" className="h-7 gap-1.5 px-3">
            <Lock /> {BRANCH_BY_ID[lockedBranch].name} only · Manager access
          </Badge>
        ) : (
          <div role="tablist" aria-label="Branch" className="inline-flex flex-wrap rounded-lg border bg-background p-0.5">
            {(["ALL", ...ALL_IDS] as const).map((id) => (
              <button
                key={id}
                role="tab"
                aria-selected={filter === id}
                type="button"
                onClick={() => setFilter(id)}
                className={cn(
                  "rounded-md px-3 py-1 text-sm transition-colors",
                  filter === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {id === "ALL" ? "All branches" : BRANCH_BY_ID[id].short}
              </button>
            ))}
          </div>
        )}
        <span className="text-xs text-muted-foreground">Month to date: {MTD_LABEL}</span>
      </div>

      {newSales.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-primary" />
          </span>
          <span className="font-medium">Live from branches</span>
          {newSales.slice(0, 3).map((s) => (
            <span key={s.id} className="text-muted-foreground">
              <span className="font-mono text-xs">{s.id}</span> · {BRANCH_BY_ID[s.branch].short} ·{" "}
              <span className="font-medium text-foreground">{formatPeso(s.total)}</span> · {s.time}
            </span>
          ))}
        </div>
      )}

      <KpiTiles kpis={kpis} showPayables={role !== "Manager"} newSales={newSales.length} />

      <div className="grid gap-4 *:min-w-0 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <SalesTrendChart branchIds={branchIds} />
        </div>
        <AlertsPanel branchIds={branchIds} />
      </div>

      <ApprovalsPanel branchIds={branchIds} canApprove />

      <BranchTable
        branchIds={branchIds}
        kpis={store.kpis}
        offlineBranch={store.posOffline ? { id: store.posBranch, queued: store.offlineQueue.length } : null}
        selected={active}
        onSelect={lockedBranch ? undefined : setFilter}
      />

      <div className="grid gap-4 *:min-w-0 xl:grid-cols-3">
        <FormulationChart branchIds={branchIds} />
        <div className="min-w-0 xl:col-span-2">
          <TopSkus branchIds={branchIds} />
        </div>
      </div>
    </div>
  )
}
