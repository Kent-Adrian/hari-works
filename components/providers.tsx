"use client"

import * as React from "react"
import { AuthGate } from "@/components/app-shell/auth-gate"
import { RoleProvider } from "@/components/app-shell/role-context"
import { DemoStoreProvider } from "@/lib/demo-store"

const subscribe = () => () => {}

export function Providers({ children }: { children: React.ReactNode }) {
  // The demo is dated "today" in the viewer's browser, so render only on the client;
  // otherwise the build-time date baked into the HTML would mismatch on hydration.
  const isClient = React.useSyncExternalStore(subscribe, () => true, () => false)
  if (!isClient) return null

  return (
    <DemoStoreProvider>
      <RoleProvider>
        <AuthGate>{children}</AuthGate>
      </RoleProvider>
    </DemoStoreProvider>
  )
}
