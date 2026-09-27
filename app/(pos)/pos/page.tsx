import type { Metadata } from "next"
import { PosScreen } from "@/components/pos/pos-screen"

export const metadata: Metadata = {
  title: "Hari Works POS",
}

export default function PosPage() {
  return <PosScreen />
}
