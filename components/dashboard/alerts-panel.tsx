import { AlertOctagon, AlertTriangle, CircleAlert } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ALERTS, BRANCH_BY_ID, type AlertLevel, type BranchId } from "@/lib/mock-data"

// Status color never carries meaning alone: every alert has an icon and a text label.
const LEVEL: Record<AlertLevel, { icon: typeof AlertOctagon; className: string; label: string }> = {
  critical: { icon: AlertOctagon, className: "text-status-critical", label: "Critical" },
  serious: { icon: AlertTriangle, className: "text-status-serious", label: "Attention" },
  warning: { icon: CircleAlert, className: "text-status-warning", label: "Review" },
}

export function AlertsPanel({ branchIds }: { branchIds: BranchId[] }) {
  const alerts = ALERTS.filter((a) => branchIds.includes(a.branch))

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Alerts</CardTitle>
        <CardDescription>{alerts.length ? `${alerts.length} items need attention` : "All clear"}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {alerts.map((a) => {
            const lvl = LEVEL[a.level]
            return (
              <li key={a.id} className="flex gap-3 py-2.5 first:pt-0 last:pb-0">
                <lvl.icon className={`mt-0.5 size-4 shrink-0 ${lvl.className}`} aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium">{a.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{BRANCH_BY_ID[a.branch].short}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className={`font-medium ${lvl.className}`}>{lvl.label}</span> · {a.kind} · {a.detail}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
