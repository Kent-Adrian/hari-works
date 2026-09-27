"use client"

import * as React from "react"
import { Bell, ChevronDown, Menu, ShieldCheck } from "lucide-react"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "./sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { TODAY, fmtLong } from "@/lib/demo-date"
import { ALERTS, BRANCH_BY_ID } from "@/lib/mock-data"
import { ROLE_USERS, useRole, type Role } from "./role-context"

const ROLE_HINT: Record<Role, string> = {
  Owner: "All branches · read-only financials",
  Admin: "Full administration",
  Manager: "Own branch only",
  Cashier: "POS only",
}

export function Topbar() {
  const { role, setRole } = useRole()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const user = ROLE_USERS[role]

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur sm:px-6">
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu" />}>
          <Menu />
        </SheetTrigger>
        <SheetContent side="left" showCloseButton={false} className="w-64 border-0 p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <Sidebar mobile onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">Hari Works Corporation</div>
        <div className="truncate text-xs text-muted-foreground">{fmtLong(TODAY)}</div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label={`${ALERTS.length} notifications`} className="relative">
          <Bell />
          <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-status-critical text-[10px] font-semibold text-white">
            {ALERTS.length}
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg border px-2 py-1 text-left hover:bg-muted"
              />
            }
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {user.initials}
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-xs font-medium">{user.name}</span>
              <span className="block text-[11px] text-muted-foreground">
                {role}
                {user.branch ? ` · ${BRANCH_BY_ID[user.branch].short}` : ""}
              </span>
            </span>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5" /> Demo: switch role
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup value={role} onValueChange={(v) => setRole(v as Role)}>
                {(Object.keys(ROLE_USERS) as Role[]).map((r) => (
                  <DropdownMenuRadioItem key={r} value={r}>
                    <span className="flex flex-col">
                      <span>{r}</span>
                      <span className="text-xs text-muted-foreground">{ROLE_HINT[r]}</span>
                    </span>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
