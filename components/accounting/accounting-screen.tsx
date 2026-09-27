"use client"

import * as React from "react"
import { CheckCircle2, Download, Eye, FileSpreadsheet } from "lucide-react"
import { cn } from "cn"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { NativeSelect } from "@/components/ui/native-select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EXPORT_SCOPE, showPlanned } from "@/components/app-shell/planned"
import { Restricted } from "@/components/app-shell/restricted"
import { useRole } from "@/components/app-shell/role-context"
import { OPEX, OPEX_LINES } from "@/lib/catalog"
import { DAY_OF_MONTH, MONTH_LABEL, MTD_LABEL, QUARTER_LABEL, YEAR } from "@/lib/demo-date"
import { useDemoStore, type JournalEntry } from "@/lib/demo-store"
import { BRANCHES, BRANCH_BY_ID, formatPeso, type BranchId } from "@/lib/mock-data"

const IDS = BRANCHES.map((b) => b.id)

export function AccountingScreen() {
  const { role } = useRole()

  if (role === "Cashier" || role === "Manager") {
    return (
      <Restricted
        pos={role === "Cashier"}
        title="Accounting is restricted"
        description="Financial statements and the general ledger are available to the Owner and Admin only."
      />
    )
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            Accounting
            {role === "Owner" && (
              <Badge variant="secondary">
                <Eye /> Read-only for Owner
              </Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            Every POS sale, purchase, collection and rebagging posts its own journal entry. No manual encoding.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => showPlanned("Export to Excel", 3, EXPORT_SCOPE)}>
            <FileSpreadsheet /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => showPlanned("Export to PDF", 3, EXPORT_SCOPE)}>
            <Download /> PDF
          </Button>
        </div>
      </div>

      <Tabs defaultValue="is">
        <TabsList>
          <TabsTrigger value="is">Income statement</TabsTrigger>
          <TabsTrigger value="je">Journal entries</TabsTrigger>
        </TabsList>
        <TabsContent value="is" className="mt-3">
          <IncomeStatement />
        </TabsContent>
        <TabsContent value="je" className="mt-3">
          <Journal />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function IncomeStatement() {
  const { kpis } = useDemoStore()
  const [period, setPeriod] = React.useState("mtd")

  const col = (id: BranchId) => {
    const revenue = kpis[id].mtdSales
    const gross = kpis[id].mtdGrossProfit
    // OPEX figures are for a 28-day base; prorate to the days elapsed this month
    const opex = OPEX[id].map((v) => Math.round((v * DAY_OF_MONTH) / 28))
    const totalOpex = opex.reduce((a, v) => a + v, 0)
    return { revenue, cogs: revenue - gross, gross, opex, totalOpex, net: gross - totalOpex }
  }
  const cols = IDS.map(col)
  const cons = {
    revenue: cols.reduce((a, c) => a + c.revenue, 0),
    cogs: cols.reduce((a, c) => a + c.cogs, 0),
    gross: cols.reduce((a, c) => a + c.gross, 0),
    opex: OPEX_LINES.map((_, i) => cols.reduce((a, c) => a + c.opex[i], 0)),
    totalOpex: cols.reduce((a, c) => a + c.totalOpex, 0),
    net: cols.reduce((a, c) => a + c.net, 0),
  }
  const all = [...cols, cons]

  const line = (label: string, values: number[], opts: { bold?: boolean; indent?: boolean; negative?: boolean; top?: boolean; pct?: boolean } = {}) => (
    <TableRow key={label} className={cn(opts.top && "border-t-2 border-t-foreground/70", opts.bold && "font-semibold")}>
      <TableCell className={cn("pl-4", opts.indent && "pl-8 text-muted-foreground")}>{label}</TableCell>
      {values.map((v, i) => (
        <TableCell key={i} className={cn("text-right", i === values.length - 1 && "bg-muted/60 pr-4")}>
          {opts.pct ? `${v.toFixed(1)}%` : opts.negative ? `(${formatPeso(v)})` : formatPeso(v)}
        </TableCell>
      ))}
    </TableRow>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statement of income · by branch and consolidated</CardTitle>
        <CardDescription>Built from posted journal entries · inter-branch transfers eliminated from revenue</CardDescription>
        <CardAction>
          <NativeSelect
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value)
              if (e.target.value !== "mtd") {
                showPlanned("Reporting periods", 4, `Daily, weekly, monthly, quarterly, annual and custom ranges, by branch and consolidated. This prototype shows ${MONTH_LABEL} month to date.`)
                setPeriod("mtd")
              }
            }}
            className="w-64"
          >
            <option value="mtd">{MONTH_LABEL} · month to date</option>
            <option value="q">{QUARTER_LABEL}</option>
            <option value="ytd">Year to date {YEAR}</option>
            <option value="custom">Custom range…</option>
          </NativeSelect>
        </CardAction>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">₱ · {MTD_LABEL}</TableHead>
              {IDS.map((id) => (
                <TableHead key={id} className="text-right">
                  {BRANCH_BY_ID[id].name}
                </TableHead>
              ))}
              <TableHead className="bg-muted/60 pr-4 text-right">Consolidated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="tabular-nums">
            {line("Sales revenue (VAT-exempt)", all.map((c) => c.revenue), { bold: true })}
            {line("Cost of goods sold", all.map((c) => c.cogs), { negative: true })}
            {line("Gross profit", all.map((c) => c.gross), { bold: true, top: true })}
            {line("Gross margin", all.map((c) => (c.gross / c.revenue) * 100), { pct: true, indent: true })}
            <TableRow>
              <TableCell className="pt-4 pl-4 text-xs font-medium tracking-wide text-muted-foreground uppercase" colSpan={6}>
                Operating expenses
              </TableCell>
            </TableRow>
            {OPEX_LINES.map((label, i) => line(label, all.map((c) => c.opex[i]), { indent: true }))}
            {line("Total operating expenses", all.map((c) => c.totalOpex), { negative: true, top: true })}
            {line("Branch operating profit", all.map((c) => c.net), { bold: true, top: true })}
            {line("Operating margin", all.map((c) => (c.net / c.revenue) * 100), { pct: true, indent: true })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

const SOURCE_STYLE: Record<JournalEntry["source"], string> = {
  "POS sale": "border-series-1/40",
  Rebagging: "border-primary/40 text-primary",
  "Purchase receiving": "",
  Collection: "",
}

function Journal() {
  const { journal } = useDemoStore()
  return (
    <Card>
      <CardHeader>
        <CardTitle>General journal</CardTitle>
        <CardDescription>Auto-generated from transactions · newest first · every entry balances</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {journal.map((e) => {
          const dr = e.lines.reduce((a, l) => a + (l.debit ?? 0), 0)
          const cr = e.lines.reduce((a, l) => a + (l.credit ?? 0), 0)
          return (
            <div key={e.id} className={cn("rounded-lg border", e.isNew && "border-primary/50 ring-2 ring-primary/15")}>
              <div className="flex flex-wrap items-center gap-2 border-b bg-muted/40 px-3 py-2 text-xs">
                <span className="font-mono font-medium">{e.id}</span>
                <span className="text-muted-foreground">{e.date}</span>
                <Badge variant="outline" className={SOURCE_STYLE[e.source]}>
                  {e.source}
                </Badge>
                <span className="font-mono text-muted-foreground">{e.ref}</span>
                <span className="text-muted-foreground">· {BRANCH_BY_ID[e.branch].name}</span>
                {e.isNew && <Badge>New</Badge>}
                <span className="ml-auto flex items-center gap-1 text-delta-up">
                  <CheckCircle2 className="size-3.5" /> Balanced
                </span>
              </div>
              <div className="px-3 pt-2 text-xs text-muted-foreground">{e.memo}</div>
              <Table>
                <TableBody className="tabular-nums">
                  {e.lines.map((l) => (
                    <TableRow key={l.account} className="border-0 hover:bg-transparent">
                      <TableCell className={cn("py-1 pl-3", l.credit && "pl-10")}>{l.account}</TableCell>
                      <TableCell className="w-32 py-1 text-right">{l.debit ? formatPeso(l.debit) : ""}</TableCell>
                      <TableCell className="w-32 py-1 pr-3 text-right">{l.credit ? formatPeso(l.credit) : ""}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t font-medium hover:bg-transparent">
                    <TableCell className="py-1 pl-3 text-xs text-muted-foreground">Total</TableCell>
                    <TableCell className="py-1 text-right">{formatPeso(dr)}</TableCell>
                    <TableCell className="py-1 pr-3 text-right">{formatPeso(cr)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
