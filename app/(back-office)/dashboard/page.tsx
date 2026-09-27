import type { Metadata } from "next"
import { OwnerDashboard } from "@/components/dashboard/owner-dashboard"

export const metadata: Metadata = {
  title: "Dashboard · Hari Works Back Office",
}

export default function DashboardPage() {
  return <OwnerDashboard />
}
