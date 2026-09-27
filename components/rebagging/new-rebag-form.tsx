"use client"

import * as React from "react"
import { AlertTriangle, Send } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Field, NativeSelect } from "@/components/ui/native-select"
import { ROLE_USERS, useRole } from "@/components/app-shell/role-context"
import { PRODUCTS, PRODUCT_BY_SKU, bomCosts, productName, toKg } from "@/lib/catalog"
import { PO_SOURCE_LOT, useDemoStore, type RebagJob } from "@/lib/demo-store"
import { BRANCHES, formatNumber, formatPeso, type BranchId } from "@/lib/mock-data"
import { CostBreakdown, NORMAL_LOSS_PCT, computeRebag } from "./cost-breakdown"

const SOURCES = PRODUCTS.filter((p) => !p.privateLabel)
const FINISHED = PRODUCTS.filter((p) => p.privateLabel)

// Conversion examples from requirements §6.2
const PRESETS = [
  { label: "100 sacks → 100 sacks", sourceSku: "URE-PHP-50", sourceQty: 100, finishedSku: "URE-HWC-50", outputQty: 100 },
  { label: "100 × 50 KG → 200 × 25 KG", sourceSku: "URE-PHP-50", sourceQty: 100, finishedSku: "URE-HWC-25", outputQty: 200 },
  { label: "50 × 50 KG → 98 × 25 KG (2% loss)", sourceSku: "URE-PHP-50", sourceQty: 50, finishedSku: "URE-HWC-25", outputQty: 98 },
]

type Form = { branch: BranchId; sourceSku: string; sourceQty: number; finishedSku: string; outputQty: number; packaging: number; labor: number; other: number }

function withBom(f: Omit<Form, "packaging" | "labor" | "other">): Form {
  return { ...f, ...bomCosts(f.finishedSku, f.outputQty) }
}

export function NewRebagForm({ onSubmitted, onCancel }: { onSubmitted: (job: RebagJob) => void; onCancel: () => void }) {
  const { role } = useRole()
  const { inventory, submitRebag } = useDemoStore()
  const [form, setForm] = React.useState<Form>(() => withBom({ branch: "DVO", ...PRESETS[0] }))
  const [costsEdited, setCostsEdited] = React.useState(false)
  const [lossReason, setLossReason] = React.useState("")

  const stock = inventory[form.branch][form.sourceSku]
  const rawCost = form.sourceQty * stock.avgCost
  const input = { ...form, rawCost }
  const r = computeRebag(input)
  const aboveNormal = r.lossPct > NORMAL_LOSS_PCT
  const errors = [
    form.sourceQty <= 0 && "Enter a source quantity.",
    form.outputQty <= 0 && "Enter an output quantity.",
    form.sourceQty > stock.qty && `Only ${formatNumber(stock.qty)} sacks on hand at this branch.`,
    r.lossKg < 0 && "Output weight is more than input weight.",
    aboveNormal && !lossReason.trim() && `Loss above ${NORMAL_LOSS_PCT}% needs a reason.`,
  ].filter(Boolean) as string[]

  // Changing quantities or the finished SKU re-applies BOM costs unless the user typed their own
  function update(patch: Partial<Form>) {
    setForm((f) => {
      const next = { ...f, ...patch }
      const touchesBom = "outputQty" in patch || "finishedSku" in patch
      return touchesBom && !costsEdited ? { ...next, ...bomCosts(next.finishedSku, next.outputQty) } : next
    })
  }

  function suggestOutput(sourceSku: string, sourceQty: number, finishedSku: string) {
    return Math.floor(toKg(sourceSku, sourceQty) / PRODUCT_BY_SKU[finishedSku].packKg)
  }

  function submit() {
    const job = submitRebag({
      branch: form.branch,
      sourceSku: form.sourceSku,
      sourceQty: form.sourceQty,
      sourceLot: form.sourceSku === "URE-PHP-50" ? PO_SOURCE_LOT : "FIFO lots · see stock card",
      finishedSku: form.finishedSku,
      outputQty: form.outputQty,
      rawCost,
      packaging: form.packaging,
      labor: form.labor,
      other: form.other,
      requestedBy: `${ROLE_USERS[role].name} (${role})`,
    })
    toast.success(`${job.id} submitted for approval`, { description: "Owner / Admin notified. Inventory moves only after approval." })
    onSubmitted(job)
  }

  const num = (v: string) => Math.max(0, Number(v) || 0)

  return (
    <div className="grid gap-4 xl:grid-cols-5">
      <Card className="xl:col-span-3">
        <CardHeader>
          <CardTitle>New rebagging request</CardTitle>
          <CardDescription>Costs update live. Nothing moves in inventory until the request is approved.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <div className="mb-1.5 text-xs font-medium text-muted-foreground">Quick examples</div>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <Button
                  key={p.label}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCostsEdited(false)
                    setForm((f) => withBom({ branch: f.branch, sourceSku: p.sourceSku, sourceQty: p.sourceQty, finishedSku: p.finishedSku, outputQty: p.outputQty }))
                  }}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Branch / warehouse">
              <NativeSelect value={form.branch} onChange={(e) => update({ branch: e.target.value as BranchId })}>
                {BRANCHES.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <div />
          </div>

          <fieldset className="grid gap-4 rounded-lg border p-3 sm:grid-cols-[1fr_140px]">
            <legend className="px-1 text-xs font-medium">Source product (consumed)</legend>
            <Field label="Product" hint={`On hand: ${formatNumber(stock.qty)} sacks · avg cost ${formatPeso(stock.avgCost)}/sack`}>
              <NativeSelect value={form.sourceSku} onChange={(e) => update({ sourceSku: e.target.value })}>
                {SOURCES.map((p) => (
                  <option key={p.sku} value={p.sku}>
                    {productName(p)} · {p.sku}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Quantity (sacks)" hint={`= ${formatNumber(r.inputKg)} kg`}>
              <Input
                type="number"
                min={1}
                value={form.sourceQty}
                onChange={(e) => {
                  const q = num(e.target.value)
                  update({ sourceQty: q, outputQty: suggestOutput(form.sourceSku, q, form.finishedSku) })
                }}
              />
            </Field>
          </fieldset>

          <fieldset className="grid gap-4 rounded-lg border p-3 sm:grid-cols-[1fr_140px]">
            <legend className="px-1 text-xs font-medium">Finished product (produced)</legend>
            <Field label="Hari Works private label" hint={`Selling price ${formatPeso(PRODUCT_BY_SKU[form.finishedSku].price)}`}>
              <NativeSelect
                value={form.finishedSku}
                onChange={(e) => update({ finishedSku: e.target.value, outputQty: suggestOutput(form.sourceSku, form.sourceQty, e.target.value) })}
              >
                {FINISHED.map((p) => (
                  <option key={p.sku} value={p.sku}>
                    {productName(p)} · {p.sku}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Output (bags)" hint={`= ${formatNumber(r.outputKg)} kg`}>
              <Input type="number" min={1} value={form.outputQty} onChange={(e) => update({ outputQty: num(e.target.value) })} />
            </Field>
          </fieldset>

          <fieldset className="grid gap-4 rounded-lg border p-3 sm:grid-cols-3">
            <legend className="px-1 text-xs font-medium">
              Direct costs {costsEdited ? "(edited)" : "(from bill of materials)"}
            </legend>
            {(["packaging", "labor", "other"] as const).map((k) => (
              <Field key={k} label={k === "packaging" ? "Packaging (₱)" : k === "labor" ? "Rebagging labor (₱)" : "Other direct (₱)"}>
                <Input
                  type="number"
                  min={0}
                  value={form[k]}
                  onChange={(e) => {
                    setCostsEdited(true)
                    setForm((f) => ({ ...f, [k]: num(e.target.value) }))
                  }}
                />
              </Field>
            ))}
          </fieldset>

          {aboveNormal && (
            <Field label={`Reason for loss above ${NORMAL_LOSS_PCT}%`}>
              <Input value={lossReason} onChange={(e) => setLossReason(e.target.value)} placeholder="e.g. torn source sacks, moisture" />
            </Field>
          )}

          {errors.length > 0 && (
            <ul className="space-y-1 rounded-lg bg-status-critical/10 p-3 text-sm text-status-critical">
              {errors.map((e) => (
                <li key={e} className="flex items-center gap-2">
                  <AlertTriangle className="size-4 shrink-0" /> {e}
                </li>
              ))}
            </ul>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={errors.length > 0}>
              <Send /> Submit for approval
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="h-fit xl:sticky xl:top-20 xl:col-span-2">
        <CardHeader>
          <CardTitle>Finished-goods cost</CardTitle>
          <CardDescription>
            {form.sourceQty} × {productName(PRODUCT_BY_SKU[form.sourceSku])} → {form.outputQty} × {productName(PRODUCT_BY_SKU[form.finishedSku])}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CostBreakdown input={input} />
        </CardContent>
      </Card>
    </div>
  )
}
