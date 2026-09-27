import type { Metadata } from "next"
import { AuditScreen } from "@/components/audit/audit-screen"

export const metadata: Metadata = {
  title: "Audit Trail · Hari Works Back Office",
}

export default function AuditTrailPage() {
  return <AuditScreen />
}
