import type { Metadata } from "next"
import { RebaggingScreen } from "@/components/rebagging/rebagging-screen"

export const metadata: Metadata = {
  title: "Rebagging · Hari Works Back Office",
}

export default async function RebaggingPage(props: PageProps<"/rebagging">) {
  const { job } = await props.searchParams
  return <RebaggingScreen key={typeof job === "string" ? job : "default"} initialJob={typeof job === "string" ? job : undefined} />
}
