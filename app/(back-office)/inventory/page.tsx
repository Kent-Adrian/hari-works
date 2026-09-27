import type { Metadata } from "next"
import { InventoryScreen } from "@/components/inventory/inventory-screen"

export const metadata: Metadata = {
  title: "Inventory · Hari Works Back Office",
}

export default function InventoryPage() {
  return <InventoryScreen />
}
