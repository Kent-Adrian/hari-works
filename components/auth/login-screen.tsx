"use client"

import * as React from "react"
import { LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { DEMO_ACCOUNTS, DEMO_PASSWORD, ROLE_USERS, useRole, type Role } from "@/components/app-shell/role-context"

const ROLE_SCOPE: Record<Role, string> = {
  Owner: "All branches, dashboards and financials",
  Admin: "Full administration and approvals",
  Manager: "Davao branch: inventory and rebagging",
  Cashier: "General Santos POS terminal",
}

export function LoginScreen() {
  const { signIn } = useRole()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState("")

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    // On success the auth gate sends the user to their home screen
    if (!signIn(email, password)) setError("Email or password is incorrect. Use one of the demo accounts below.")
  }

  const fill = (r: Role) => {
    setEmail(DEMO_ACCOUNTS[r])
    setPassword(DEMO_PASSWORD)
    setError("")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4 py-10">
      <div className="w-full max-w-md space-y-4">
        <div className="flex items-center justify-center gap-2.5">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">HW</div>
          <div className="leading-tight">
            <div className="font-semibold">Hari Works</div>
            <div className="text-xs text-muted-foreground">Back Office &amp; POS</div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Use a demo account to try the system.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-3">
              <label className="block space-y-1.5 text-sm font-medium">
                <span>Email</span>
                <Input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </label>
              <label className="block space-y-1.5 text-sm font-medium">
                <span>Password</span>
                <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </label>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full">
                <LogIn /> Sign in
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Demo accounts</CardTitle>
            <CardDescription>
              Click one to fill it in. Password for all: <span className="font-mono font-medium text-foreground">{DEMO_PASSWORD}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {(Object.keys(DEMO_ACCOUNTS) as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => fill(r)}
                className="flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left hover:bg-muted"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {ROLE_USERS[r].initials}
                </span>
                <span className="min-w-0 leading-tight">
                  <span className="block text-sm font-medium">
                    {r} · {ROLE_USERS[r].name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">{DEMO_ACCOUNTS[r]}</span>
                  <span className="block truncate text-xs text-muted-foreground">{ROLE_SCOPE[r]}</span>
                </span>
              </button>
            ))}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Prototype with sample data. Your entries are saved in this browser only.
        </p>
      </div>
    </div>
  )
}
