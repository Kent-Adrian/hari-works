import { toast } from "sonner"

/** For features outside the prototype: names the proposal phase that delivers them */
export function showPlanned(feature: string, phase: number, scope: string) {
  toast.info(`${feature} · Phase ${phase}`, {
    description: `${scope} Included in the full system, not in this prototype.`,
  })
}

export const EXPORT_SCOPE = "Export any report to PDF, Excel or CSV, or print it."
