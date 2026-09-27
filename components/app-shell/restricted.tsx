import Link from "next/link"
import { Lock, Monitor } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function Restricted({ title, description, pos }: { title: string; description: string; pos?: boolean }) {
  return (
    <Card className="mx-auto mt-12 max-w-md text-center">
      <CardHeader className="justify-items-center">
        <Lock className="mb-2 size-8 text-muted-foreground" />
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        {pos && (
          <Link href="/pos" className={buttonVariants({ className: "mt-3" })}>
            <Monitor /> Go to POS
          </Link>
        )}
      </CardHeader>
    </Card>
  )
}
