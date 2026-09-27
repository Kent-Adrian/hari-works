"use client"

import Link from "next/link"
import { ArrowUpRight, Check, X } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ROLE_USERS, useRole } from "@/components/app-shell/role-context"
import { useDemoStore } from "@/lib/demo-store"
import { BRANCH_BY_ID, formatPeso, type BranchId } from "@/lib/mock-data"

export function ApprovalsPanel({ branchIds, canApprove }: { branchIds: BranchId[]; canApprove: boolean }) {
  const { approvals, approve, reject } = useDemoStore()
  const { role } = useRole()
  const items = approvals.filter((a) => branchIds.includes(a.branch))

  function decide(id: string, approved: boolean) {
    const item = approvals.find((a) => a.id === id)!
    const approver = `${ROLE_USERS[role].name} (${role})`
    const log = "Logged to audit trail with user, time and device."
    if (approved) {
      approve(id, approver)
      toast.success(`${item.ref} approved`, {
        description: item.rebagId ? "Inventory converted and journal entry posted. " + log : log,
      })
    } else {
      reject(id, approver)
      toast.error(`${item.ref} rejected`, { description: log })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending approvals</CardTitle>
        <CardDescription>{items.length ? `${items.length} waiting for you` : "Nothing waiting"}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-2.5 md:grid-cols-2 2xl:grid-cols-3">
          {items.map((a) => (
            <li key={a.id} className="flex flex-col rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{a.type}</Badge>
                {a.rebagId ? (
                  <Link href={`/rebagging?job=${a.rebagId}`} className="inline-flex items-center gap-0.5 font-mono text-xs text-primary hover:underline">
                    {a.ref}
                    <ArrowUpRight className="size-3" />
                  </Link>
                ) : (
                  <span className="font-mono text-xs text-muted-foreground">{a.ref}</span>
                )}
                <span className="ml-auto text-xs text-muted-foreground">{a.age === "just now" ? a.age : `${a.age} ago`}</span>
              </div>
              <p className="mt-1.5 text-sm">{a.summary}</p>
              <div className="mt-auto flex items-center gap-2 pt-2">
                <span className="text-xs text-muted-foreground">
                  {a.requestedBy} · {BRANCH_BY_ID[a.branch].short}
                  {a.amount !== undefined && <span className="font-medium text-foreground"> · {formatPeso(a.amount)}</span>}
                </span>
                {canApprove && (
                  <div className="ml-auto flex gap-1.5">
                    <Button size="xs" variant="outline" onClick={() => decide(a.id, false)}>
                      <X /> Reject
                    </Button>
                    <Button size="xs" onClick={() => decide(a.id, true)}>
                      <Check /> Approve
                    </Button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
