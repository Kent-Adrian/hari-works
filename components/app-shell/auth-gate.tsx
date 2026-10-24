"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { homeFor, useRole } from "./role-context"

const LOGIN = "/login"

/** Sends signed-out visitors to the login page, and signed-in users away from it */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { role, signedIn } = useRole()
  const onLogin = pathname === LOGIN
  const target = signedIn ? (onLogin ? homeFor(role) : null) : onLogin ? null : LOGIN

  React.useEffect(() => {
    if (target) router.replace(target)
  }, [target, router])

  return target ? null : children
}
