import type { Metadata } from "next"
import { AccountingScreen } from "@/components/accounting/accounting-screen"

export const metadata: Metadata = {
  title: "Accounting · Hari Works Back Office",
}

export default function AccountingPage() {
  return <AccountingScreen />
}
