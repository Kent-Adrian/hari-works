"use client"

import * as React from "react"
import type { BranchId } from "@/lib/mock-data"

export type Role = "Owner" | "Admin" | "Manager" | "Cashier"

export const ROLE_USERS: Record<Role, { name: string; initials: string; branch?: BranchId }> = {
  Owner: { name: "Hari Works Owner", initials: "HW" },
  Admin: { name: "C. Reyes", initials: "CR" },
  Manager: { name: "M. Santos", initials: "MS", branch: "DVO" },
  Cashier: { name: "R. Villanueva", initials: "RV", branch: "GES" },
}

type RoleContextValue = { role: Role; setRole: (r: Role) => void }

const RoleContext = React.createContext<RoleContextValue | null>(null)

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = React.useState<Role>("Owner")
  return <RoleContext.Provider value={{ role, setRole }}>{children}</RoleContext.Provider>
}

export function useRole() {
  const ctx = React.useContext(RoleContext)
  if (!ctx) throw new Error("useRole must be used within <RoleProvider>")
  return ctx
}
