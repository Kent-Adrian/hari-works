"use client"

import * as React from "react"
import { ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

export const DEMO_MANAGER = "M. Santos"
const DEMO_PIN = "1234"

export type PinRequest = { title: string; reason: React.ReactNode; onApproved: () => void }

export function ManagerPinDialog({ request, onClose }: { request: PinRequest | null; onClose: () => void }) {
  const [pin, setPin] = React.useState("")
  const [error, setError] = React.useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (pin !== DEMO_PIN) {
      setError(true)
      return
    }
    request?.onApproved()
    close()
  }

  function close() {
    setPin("")
    setError(false)
    onClose()
  }

  return (
    <Dialog open={!!request} onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" /> {request?.title}
            </DialogTitle>
            <DialogDescription render={<div />}>{request?.reason}</DialogDescription>
          </DialogHeader>
          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Manager PIN · {DEMO_MANAGER}</span>
            <Input
              autoFocus
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              aria-invalid={error}
              onChange={(e) => {
                setPin(e.target.value)
                setError(false)
              }}
              className="text-center text-lg tracking-[0.5em]"
            />
            <span className="text-xs text-muted-foreground">{error ? <span className="text-status-critical">Incorrect PIN.</span> : "Demo PIN: 1234"}</span>
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button type="submit">Approve</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
