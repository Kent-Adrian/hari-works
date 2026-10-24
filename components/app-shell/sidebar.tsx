"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { toast } from "sonner"
import { cn } from "cn"
import {
  BarChart3,
  Bell,
  BookOpenText,
  Building2,
  ClipboardList,
  FileBarChart,
  LayoutDashboard,
  Monitor,
  Package,
  Receipt,
  Repeat2,
  RotateCcw,
  ScrollText,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  UserCog,
  Wallet,
} from "lucide-react"
import { useDemoStore } from "@/lib/demo-store"
import { showPlanned } from "./planned"
import { useRole, type Role } from "./role-context"

type NavItem = {
  label: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
  roles?: Role[]
  /** Not in the prototype: the proposal phase that delivers it and what it does */
  planned?: { phase: number; scope: string }
}

// Menu follows section 24 of the Hari Works requirements; phases follow the cost proposal
const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "Overview",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
      { label: "Notifications", icon: Bell, planned: { phase: 5, scope: "Alert center for low stock, overdue accounts, cash variances, failed syncs and pending approvals, with SMS/email options." } },
    ],
  },
  {
    group: "Operations",
    items: [
      { label: "Sales", icon: BarChart3, planned: { phase: 1, scope: "Sales history by branch, cashier and customer, with returns, voids and invoice reprints." } },
      { label: "Inventory", icon: Package, href: "/inventory" },
      { label: "Rebagging / Production", icon: Repeat2, href: "/rebagging" },
      { label: "Purchasing", icon: ShoppingCart, planned: { phase: 2, scope: "Purchase order → approval → receiving (with shortages) → inventory update → accounts payable." } },
      { label: "Customers", icon: Users, planned: { phase: 1, scope: "Customer records, credit limits and terms, collections and receivables aging." } },
      { label: "Suppliers", icon: Truck, planned: { phase: 2, scope: "Supplier records, price history and comparison, outstanding POs and payables." } },
    ],
  },
  {
    group: "Finance",
    items: [
      { label: "Accounting", icon: BookOpenText, href: "/accounting", roles: ["Owner", "Admin"] },
      { label: "Expenses", icon: Wallet, roles: ["Owner", "Admin", "Manager"], planned: { phase: 4, scope: "Branch expense recording with approvals, posted automatically to the general ledger." } },
      { label: "Reports", icon: FileBarChart, planned: { phase: 3, scope: "Report builder with filters by date, branch, product, customer and cashier. Export to PDF, Excel or CSV." } },
    ],
  },
  {
    group: "Administration",
    items: [
      { label: "Branches", icon: Building2, roles: ["Owner", "Admin"], planned: { phase: 3, scope: "Branch setup and settings. New branches are added here without redevelopment." } },
      { label: "Users", icon: UserCog, roles: ["Admin"], planned: { phase: 3, scope: "User accounts, roles and permissions, cashier PINs, device registration and 2FA." } },
      { label: "Audit Trail", icon: ScrollText, href: "/audit-trail", roles: ["Owner", "Admin"] },
      { label: "Settings", icon: Settings, roles: ["Admin"], planned: { phase: 3, scope: "Company, tax and invoice settings, approval limits, and stock and costing policies." } },
    ],
  },
]

export function Sidebar({ mobile, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname()
  const { role } = useRole()
  const { reset } = useDemoStore()

  return (
    <aside
      onClick={(e) => {
        if (onNavigate && (e.target as HTMLElement).closest("a")) onNavigate()
      }}
      className={cn(
        "shrink-0 flex-col bg-sidebar text-sidebar-foreground",
        mobile ? "flex h-full w-full" : "sticky top-0 hidden h-screen w-60 lg:flex"
      )}
    >
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary font-bold text-sidebar-primary-foreground">
          HW
        </div>
        <div className="leading-tight">
          <div className="font-semibold">Hari Works</div>
          <div className="text-xs text-sidebar-foreground/60">Back Office</div>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {NAV.map((section) => {
          const items = section.items.filter((i) => !i.roles || i.roles.includes(role))
          if (!items.length) return null
          return (
            <div key={section.group}>
              <div className="px-2 pb-1.5 text-[11px] font-medium tracking-wider text-sidebar-foreground/50 uppercase">
                {section.group}
              </div>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active = item.href && pathname.startsWith(item.href)
                  const className = cn(
                    "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                      : item.planned
                        ? "text-sidebar-foreground/50 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground/80"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                  )
                  const content = (
                    <>
                      <item.icon className="size-4 shrink-0" />
                      {item.label}
                      {item.planned && (
                        <span className="ml-auto shrink-0 rounded-full border border-sidebar-foreground/20 px-1.5 text-[10px] leading-4 font-medium text-sidebar-foreground/60">
                          Phase {item.planned.phase}
                        </span>
                      )}
                    </>
                  )
                  return (
                    <li key={item.label}>
                      {item.href ? (
                        <Link href={item.href} className={className}>
                          {content}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className={className}
                          onClick={() => item.planned && showPlanned(item.label, item.planned.phase, item.planned.scope)}
                        >
                          {content}
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <Link
          href="/pos"
          className="flex w-full items-center gap-2.5 rounded-md bg-sidebar-primary px-2 py-2 text-sm font-medium text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
        >
          <Monitor className="size-4" />
          Open Hari Works POS
          <Receipt className="ml-auto size-3.5 opacity-70" />
        </Link>
        <button
          type="button"
          onClick={() => {
            if (!window.confirm("Reset all demo data? Sales, rebagging jobs and other entries made in this browser will be cleared.")) return
            reset()
            toast.success("Demo data reset")
          }}
          className="mt-2 flex w-full items-center gap-2 rounded-md px-2 py-1 text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground"
        >
          <ClipboardList className="size-3.5" />
          Prototype · Reset demo data
          <RotateCcw className="ml-auto size-3.5" />
        </button>
      </div>
    </aside>
  )
}
