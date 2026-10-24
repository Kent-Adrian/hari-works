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

// Demo sign-in only: there is no server, so these are checked in the browser
export const DEMO_PASSWORD = "demo123"
export const DEMO_ACCOUNTS: Record<Role, string> = {
  Owner: "owner@hariworks.demo",
  Admin: "admin@hariworks.demo",
  Manager: "manager@hariworks.demo",
  Cashier: "cashier@hariworks.demo",
}

export const homeFor = (role: Role) => (role === "Cashier" ? "/pos" : "/dashboard")

const SESSION_KEY = "hari-works-demo-session"

function loadSession(): Role | null {
  try {
    const r = localStorage.getItem(SESSION_KEY)
    return r && r in ROLE_USERS ? (r as Role) : null
  } catch {
    return null
  }
}

function saveSession(role: Role | null) {
  try {
    if (role) localStorage.setItem(SESSION_KEY, role)
    else localStorage.removeItem(SESSION_KEY)
  } catch {}
}

type RoleContextValue = {
  /** Signed-in role; screens only render once someone is signed in */
  role: Role
  signedIn: boolean
  setRole: (r: Role) => void
  signIn: (email: string, password: string) => Role | null
  signOut: () => void
}

const RoleContext = React.createContext<RoleContextValue | null>(null)

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Role | null>(loadSession)

  const value = React.useMemo<RoleContextValue>(() => {
    const set = (r: Role | null) => {
      saveSession(r)
      setSession(r)
    }
    return {
      role: session ?? "Owner",
      signedIn: session !== null,
      setRole: set,
      signIn(email, password) {
        const role = (Object.keys(DEMO_ACCOUNTS) as Role[]).find((r) => DEMO_ACCOUNTS[r] === email.trim().toLowerCase())
        if (!role || password !== DEMO_PASSWORD) return null
        set(role)
        return role
      },
      signOut: () => set(null),
    }
  }, [session])

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
}

export function useRole() {
  const ctx = React.useContext(RoleContext)
  if (!ctx) throw new Error("useRole must be used within <RoleProvider>")
  return ctx
}
