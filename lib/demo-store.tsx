"use client"

// Demo state shared by every screen, so an action on one screen
// (approve a rebag, ring up a sale) changes the numbers on the others.
// It is saved in this browser's localStorage, so it survives a refresh and
// stays in sync across open tabs; "Reset demo data" restores the seed data.

import * as React from "react"
import {
  ACCOUNTS,
  CUSTOMERS,
  INITIAL_INVENTORY,
  PRODUCT_BY_SKU,
  bomCosts,
  type Customer,
  type Inventory,
} from "./catalog"
import { BACK_OFFICE_DEVICE, SEED_AUDIT, posDevice, type AuditEvent } from "./audit"
import { TODAY, YEAR, daysAgo, fmtDate, fmtShort, ymd } from "./demo-date"
import { APPROVALS, KPIS, type Approval, type BranchId, type BranchKpis } from "./mock-data"

// ---------- Types ----------
export type PaymentMethod = "Cash" | "GCash" | "Maya" | "Debit card" | "Credit card" | "Bank transfer" | "Check" | "Charge account"
export type Payment = { method: PaymentMethod; amount: number }
export type SaleLine = { sku: string; qty: number; price: number }

export type Sale = {
  id: string
  branch: BranchId
  time: string
  customerId: string
  cashier: string
  lines: SaleLine[]
  subtotal: number
  discountPct: number
  discount: number
  total: number
  payments: Payment[]
  cogs: number
  approvals: string[]
  offline?: boolean
}

export type RebagStatus = "Pending approval" | "Posted" | "Rejected"
export type RebagJob = {
  id: string
  date: string
  branch: BranchId
  sourceSku: string
  sourceQty: number
  sourceLot: string
  finishedSku: string
  outputQty: number
  finishedLot: string
  rawCost: number
  packaging: number
  labor: number
  other: number
  status: RebagStatus
  requestedBy: string
  approvedBy?: string
}

export type JournalLine = { account: string; debit?: number; credit?: number }
export type JournalEntry = {
  id: string
  date: string
  ref: string
  source: "POS sale" | "Rebagging" | "Purchase receiving" | "Collection"
  branch: BranchId
  memo: string
  lines: JournalLine[]
  isNew?: boolean
}

export const rebagTotal = (j: Pick<RebagJob, "rawCost" | "packaging" | "labor" | "other">) =>
  j.rawCost + j.packaging + j.labor + j.other

// ---------- Seed data ----------
const seedJob = (j: Omit<RebagJob, "packaging" | "labor" | "other">): RebagJob => ({ ...j, ...bomCosts(j.finishedSku, j.outputQty) })

const D = { today: TODAY, d1: daysAgo(1), d7: daysAgo(7), d14: daysAgo(14), d16: daysAgo(16), d20: daysAgo(20), d26: daysAgo(26) }
export const RB_PENDING = `RB-${YEAR}-0142`
export const PO_SOURCE = `PO-${YEAR}-0288`
export const PO_SOURCE_LOT = `${PO_SOURCE} · Philphos · received ${fmtShort(D.d16)}`

const SEED_REBAGS: RebagJob[] = [
  seedJob({ id: RB_PENDING, date: fmtDate(D.today), branch: "DVO", sourceSku: "URE-PHP-50", sourceQty: 100, sourceLot: PO_SOURCE_LOT, finishedSku: "URE-HWC-50", outputQty: 100, finishedLot: `HW-URE50-${ymd(D.today)}-01`, rawCost: 150_000, status: "Pending approval", requestedBy: "M. Santos (Manager)" }),
  seedJob({ id: `RB-${YEAR}-0139`, date: fmtDate(D.d7), branch: "GES", sourceSku: "141-PHP-50", sourceQty: 100, sourceLot: `PO-${YEAR}-0271 · Philphos · received ${fmtShort(D.d20)}`, finishedSku: "141-HWC-25", outputQty: 200, finishedLot: `HW-141-25-${ymd(D.d7)}-01`, rawCost: 169_000, status: "Posted", requestedBy: "L. Tan (Manager)", approvedBy: "C. Reyes (Admin)" }),
  seedJob({ id: `RB-${YEAR}-0136`, date: fmtDate(D.d14), branch: "DVO", sourceSku: "URE-PHP-50", sourceQty: 50, sourceLot: `PO-${YEAR}-0259 · Philphos · received ${fmtShort(D.d26)}`, finishedSku: "URE-HWC-25", outputQty: 98, finishedLot: `HW-URE25-${ymd(D.d14)}-01`, rawCost: 75_000, status: "Posted", requestedBy: "M. Santos (Manager)", approvedBy: "Hari Works Owner" }),
]

const SEED_JOURNAL: JournalEntry[] = [
  {
    id: `JE-${ymd(D.today)}-0012`, date: fmtDate(D.today), ref: "SI-DVO-0015521", source: "POS sale", branch: "DVO",
    memo: "Cash sale · 6 sacks 21-0-0 PHILPHOS + 2 sacks 16-20-0 UHI",
    lines: [
      { account: ACCOUNTS.cash, debit: 10_000 },
      { account: ACCOUNTS.sales, credit: 10_000 },
      { account: ACCOUNTS.cogs, debit: 7_000 },
      { account: ACCOUNTS.invMerch, credit: 7_000 },
    ],
  },
  {
    id: `JE-${ymd(D.d1)}-0031`, date: fmtDate(D.d1), ref: "OR-DVO-004410", source: "Collection", branch: "DVO",
    memo: "Collection from South Cotabato Agri Dealers · check",
    lines: [
      { account: ACCOUNTS.bank, debit: 50_000 },
      { account: ACCOUNTS.ar, credit: 50_000 },
    ],
  },
  {
    id: `JE-${ymd(D.d7)}-0008`, date: fmtDate(D.d7), ref: `RB-${YEAR}-0139`, source: "Rebagging", branch: "GES",
    memo: "100 × 14-14-14 PHILPHOS 50 KG → 200 × 14-14-14 HARI WORKS 25 KG",
    lines: [
      { account: ACCOUNTS.invFinished, debit: 178_400 },
      { account: ACCOUNTS.invMerch, credit: 169_000 },
      { account: ACCOUNTS.packaging, credit: 6_000 },
      { account: ACCOUNTS.accrued, credit: 3_400 },
    ],
  },
  {
    id: `JE-${ymd(D.d16)}-0004`, date: fmtDate(D.d16), ref: PO_SOURCE, source: "Purchase receiving", branch: "DVO",
    memo: "Received 100 sacks UREA PHILPHOS 50 KG @ ₱1,500 · Philphos",
    lines: [
      { account: ACCOUNTS.invMerch, debit: 150_000 },
      { account: ACCOUNTS.ap, credit: 150_000 },
    ],
  },
]

const SEED_INVOICE_SEQ: Record<BranchId, number> = { DVO: 15_588, ILO: 6_204, BCD: 5_121, GES: 8_842 }

// ---------- State ----------
type State = {
  kpis: Record<BranchId, BranchKpis>
  inventory: Inventory
  rebags: RebagJob[]
  approvals: (Approval & { rebagId?: string })[]
  journal: JournalEntry[]
  sales: Sale[]
  customers: Customer[]
  invoiceSeq: Record<BranchId, number>
  posOffline: boolean
  posBranch: BranchId
  offlineQueue: Sale[]
  audit: AuditEvent[]
}

export type NewAuditEvent = Omit<AuditEvent, "id" | "date" | "time" | "isNew">

// Inventory value on the dashboard is derived from the stock ledger so every screen agrees
function valueOf(inv: Inventory, b: BranchId) {
  return Object.values(inv[b]).reduce((a, l) => a + l.qty * l.avgCost, 0)
}

const initialKpis = () => {
  const k = structuredClone(KPIS)
  for (const b of Object.keys(k) as BranchId[]) k[b].inventoryValue = valueOf(INITIAL_INVENTORY, b)
  return k
}

const initialState = (): State => ({
  kpis: initialKpis(),
  inventory: structuredClone(INITIAL_INVENTORY),
  rebags: structuredClone(SEED_REBAGS),
  approvals: APPROVALS.map((a) => (a.ref === RB_PENDING ? { ...a, rebagId: a.ref } : a)),
  journal: structuredClone(SEED_JOURNAL),
  sales: [],
  customers: structuredClone(CUSTOMERS),
  invoiceSeq: { ...SEED_INVOICE_SEQ },
  posOffline: false,
  posBranch: "GES",
  offlineQueue: [],
  audit: structuredClone(SEED_AUDIT),
})

// Bump the version when State changes shape so old saved data is ignored
const STORAGE_KEY = "hari-works-demo-state-v1"

function loadState(): State {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return { ...initialState(), ...JSON.parse(saved) }
  } catch {}
  return initialState()
}

function saveState(s: State) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch {}
}

const nowTime = () => new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
const jeId = (n: number) => `JE-${ymd(TODAY)}-${String(100 + n).padStart(4, "0")}`
const TODAY_LABEL = fmtDate(TODAY)

// Append-only: entries are only ever added, never edited or removed
function log(s: State, e: NewAuditEvent): State {
  const n = 113 + s.audit.length - SEED_AUDIT.length
  return { ...s, audit: [{ ...e, id: `AU-${String(n).padStart(4, "0")}`, date: TODAY_LABEL, time: nowTime(), isNew: true }, ...s.audit] }
}

// ---------- Pure state transitions ----------
function postRebag(s: State, id: string, approver: string): State {
  const job = s.rebags.find((j) => j.id === id)
  if (!job || job.status !== "Pending approval") return s
  const inv = structuredClone(s.inventory)
  const src = inv[job.branch][job.sourceSku]
  const fin = inv[job.branch][job.finishedSku]
  const total = rebagTotal(job)
  src.qty -= job.sourceQty
  // Weighted average cost of the finished SKU absorbs the new production cost
  fin.avgCost = Math.round((fin.qty * fin.avgCost + total) / (fin.qty + job.outputQty))
  fin.qty += job.outputQty

  const kpis = structuredClone(s.kpis)
  // Raw material moves between inventory accounts; only conversion costs add value
  kpis[job.branch].inventoryValue += job.packaging + job.labor + job.other

  const src_p = PRODUCT_BY_SKU[job.sourceSku]
  const fin_p = PRODUCT_BY_SKU[job.finishedSku]
  const entry: JournalEntry = {
    id: jeId(s.journal.length),
    date: TODAY_LABEL,
    ref: job.id,
    source: "Rebagging",
    branch: job.branch,
    memo: `${job.sourceQty} × ${src_p.formulation} ${src_p.brand} ${src_p.packKg} KG → ${job.outputQty} × ${fin_p.formulation} ${fin_p.brand} ${fin_p.packKg} KG`,
    isNew: true,
    lines: [
      { account: ACCOUNTS.invFinished, debit: total },
      { account: ACCOUNTS.invMerch, credit: job.rawCost },
      { account: ACCOUNTS.packaging, credit: job.packaging },
      { account: ACCOUNTS.accrued, credit: job.labor + job.other },
    ],
  }

  const posted: State = {
    ...s,
    inventory: inv,
    kpis,
    rebags: s.rebags.map((j) => (j.id === id ? { ...j, status: "Posted", approvedBy: approver } : j)),
    journal: [entry, ...s.journal],
  }
  return log(posted, {
    user: approver,
    branch: job.branch,
    category: "Rebagging",
    action: "Rebagging approved & inventory converted",
    ref: job.id,
    oldValue: `${src_p.sku}: ${src.qty + job.sourceQty} · ${fin_p.sku}: ${fin.qty - job.outputQty}`,
    newValue: `${src_p.sku}: ${src.qty} · ${fin_p.sku}: ${fin.qty} · ${entry.id}`,
    device: BACK_OFFICE_DEVICE,
  })
}

function applySale(s: State, sale: Sale): State {
  const inv = structuredClone(s.inventory)
  for (const l of sale.lines) inv[sale.branch][l.sku].qty -= l.qty

  const sumBy = (methods: PaymentMethod[]) =>
    sale.payments.filter((p) => methods.includes(p.method)).reduce((a, p) => a + p.amount, 0)
  const cash = sumBy(["Cash"])
  const ewallet = sumBy(["GCash", "Maya"])
  const bank = sumBy(["Debit card", "Credit card", "Bank transfer", "Check"])
  const charge = sumBy(["Charge account"])

  const kpis = structuredClone(s.kpis)
  const k = kpis[sale.branch]
  k.todaySales += sale.total
  k.todayTx += 1
  k.mtdSales += sale.total
  k.mtdGrossProfit += sale.total - sale.cogs
  k.inventoryValue -= sale.cogs
  k.cash += cash + ewallet + bank
  k.receivables += charge

  const privateLabelCogs = sale.lines
    .filter((l) => PRODUCT_BY_SKU[l.sku].privateLabel)
    .reduce((a, l) => a + l.qty * s.inventory[sale.branch][l.sku].avgCost, 0)

  const lines: JournalLine[] = [
    cash && { account: ACCOUNTS.cash, debit: cash },
    ewallet && { account: ACCOUNTS.ewallet, debit: ewallet },
    bank && { account: ACCOUNTS.bank, debit: bank },
    charge && { account: ACCOUNTS.ar, debit: charge },
    { account: ACCOUNTS.sales, credit: sale.total },
    { account: ACCOUNTS.cogs, debit: sale.cogs },
    sale.cogs - privateLabelCogs && { account: ACCOUNTS.invMerch, credit: sale.cogs - privateLabelCogs },
    privateLabelCogs && { account: ACCOUNTS.invFinished, credit: privateLabelCogs },
  ].filter(Boolean) as JournalLine[]

  const customer = s.customers.find((c) => c.id === sale.customerId)
  const entry: JournalEntry = {
    id: jeId(s.journal.length),
    date: TODAY_LABEL,
    ref: sale.id,
    source: "POS sale",
    branch: sale.branch,
    memo: `${customer?.name ?? "Customer"} · ${sale.lines.reduce((a, l) => a + l.qty, 0)} sacks · ${sale.payments.map((p) => p.method).join(" + ")}`,
    isNew: true,
    lines,
  }

  let next: State = {
    ...s,
    inventory: inv,
    kpis,
    sales: [sale, ...s.sales],
    journal: [entry, ...s.journal],
    customers: s.customers.map((c) => (c.id === sale.customerId ? { ...c, outstanding: c.outstanding + charge } : c)),
  }

  const cashier = `${sale.cashier} (Cashier)`
  const device = posDevice(sale.branch)
  for (const approval of sale.approvals) {
    const credit = approval.startsWith("Credit")
    next = log(next, {
      user: cashier,
      branch: sale.branch,
      category: credit ? "Credit override" : "Discount",
      action: credit ? "Credit limit exceeded · override approved" : "Discount above cashier limit approved",
      ref: sale.id,
      oldValue: credit && customer ? `Available credit ₱${(customer.creditLimit - customer.outstanding).toLocaleString("en-PH")}` : "Cashier limit 5%",
      newValue: credit ? `Charged ₱${charge.toLocaleString("en-PH")} · ${customer?.name}` : `${sale.discountPct}% · −₱${sale.discount.toLocaleString("en-PH")}`,
      approver: "M. Santos (Manager) · PIN",
      device,
      flagged: credit,
    })
  }
  return log(next, {
    user: cashier,
    branch: sale.branch,
    category: "Sale",
    action: sale.offline ? "Sale completed offline · synced to server" : "Sale completed",
    ref: sale.id,
    newValue: `₱${sale.total.toLocaleString("en-PH")} · ${sale.payments.map((p) => p.method).join(" + ")}`,
    device,
  })
}

// ---------- Context ----------
type NewRebag = Omit<RebagJob, "id" | "date" | "status" | "finishedLot">
type NewSale = Omit<Sale, "id" | "time" | "cogs" | "offline">

type Store = State & {
  submitRebag: (job: NewRebag) => RebagJob
  approve: (approvalId: string, approver: string) => void
  reject: (approvalId: string, approver: string) => void
  logEvent: (e: NewAuditEvent) => void
  approveRebag: (rebagId: string, approver: string) => void
  recordSale: (sale: NewSale) => Sale
  setPosOffline: (offline: boolean) => number
  setPosBranch: (b: BranchId) => void
  reset: () => void
}

const StoreContext = React.createContext<Store | null>(null)

export function DemoStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<State>(loadState)
  const ref = React.useRef(state)
  const fromOtherTab = React.useRef(false)
  React.useEffect(() => {
    ref.current = state
    // Don't echo back a change that another tab just saved
    if (fromOtherTab.current) fromOtherTab.current = false
    else saveState(state)
  }, [state])

  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return
      try {
        const next = { ...initialState(), ...JSON.parse(e.newValue) }
        fromOtherTab.current = true
        setState(next)
      } catch {}
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const store = React.useMemo<Store>(() => {
    const removeApprovalFor = (s: State, rebagId: string) => s.approvals.filter((a) => a.rebagId !== rebagId)

    return {
      ...state,
      submitRebag(input) {
        const s = ref.current
        const n = 143 + s.rebags.filter((j) => j.id >= `RB-${YEAR}-0143`).length
        const fin = PRODUCT_BY_SKU[input.finishedSku]
        const job: RebagJob = {
          ...input,
          id: `RB-${YEAR}-${String(n).padStart(4, "0")}`,
          date: TODAY_LABEL,
          status: "Pending approval",
          finishedLot: `HW-${fin.sku}-${ymd(TODAY)}-${String(n - 141).padStart(2, "0")}`,
        }
        const src = PRODUCT_BY_SKU[input.sourceSku]
        const approval: Approval & { rebagId: string } = {
          id: `ap-${job.id}`,
          type: "Rebagging",
          ref: job.id,
          rebagId: job.id,
          summary: `${job.sourceQty} sacks ${src.formulation} ${src.brand} → ${job.outputQty} × ${fin.formulation} ${fin.brand} ${fin.packKg} KG · ₱${Math.round(rebagTotal(job) / job.outputQty).toLocaleString("en-PH")}/bag`,
          amount: rebagTotal(job),
          requestedBy: input.requestedBy,
          branch: input.branch,
          age: "just now",
        }
        setState((st) =>
          log(
            { ...st, rebags: [job, ...st.rebags], approvals: [approval, ...st.approvals] },
            {
              user: input.requestedBy,
              branch: input.branch,
              category: "Rebagging",
              action: "Rebagging request created",
              ref: job.id,
              newValue: `${job.sourceQty} → ${job.outputQty} bags · ₱${rebagTotal(job).toLocaleString("en-PH")}`,
              device: BACK_OFFICE_DEVICE,
            }
          )
        )
        return job
      },
      approve(approvalId, approver) {
        setState((st) => {
          const a = st.approvals.find((x) => x.id === approvalId)
          if (!a) return st
          const next = a.rebagId
            ? postRebag(st, a.rebagId, approver)
            : log(st, {
                user: approver,
                branch: a.branch,
                category: a.type === "Credit override" ? "Credit override" : a.type === "Discount" ? "Discount" : "Approval",
                action: `${a.type} approved`,
                ref: a.ref,
                newValue: a.amount !== undefined ? `₱${a.amount.toLocaleString("en-PH")}` : a.summary,
                reason: `Requested by ${a.requestedBy}`,
                device: BACK_OFFICE_DEVICE,
              })
          return { ...next, approvals: next.approvals.filter((x) => x.id !== approvalId) }
        })
      },
      reject(approvalId, approver) {
        setState((st) => {
          const a = st.approvals.find((x) => x.id === approvalId)
          if (!a) return st
          const next: State = {
            ...st,
            approvals: st.approvals.filter((x) => x.id !== approvalId),
            rebags: a.rebagId ? st.rebags.map((j) => (j.id === a.rebagId ? { ...j, status: "Rejected" } : j)) : st.rebags,
          }
          return log(next, {
            user: approver,
            branch: a.branch,
            category: a.rebagId ? "Rebagging" : "Approval",
            action: `${a.type} rejected`,
            ref: a.ref,
            reason: `Requested by ${a.requestedBy}`,
            device: BACK_OFFICE_DEVICE,
            flagged: true,
          })
        })
      },
      logEvent(e) {
        setState((st) => log(st, e))
      },
      approveRebag(rebagId, approver) {
        setState((st) => ({ ...postRebag(st, rebagId, approver), approvals: removeApprovalFor(st, rebagId) }))
      },
      recordSale(input) {
        const s = ref.current
        const seq = s.invoiceSeq[input.branch] + 1
        const cogs = input.lines.reduce((a, l) => a + l.qty * s.inventory[input.branch][l.sku].avgCost, 0)
        const sale: Sale = {
          ...input,
          id: `SI-${input.branch}-${String(seq).padStart(7, "0")}`,
          time: nowTime(),
          cogs,
          offline: s.posOffline,
        }
        ref.current = { ...s, invoiceSeq: { ...s.invoiceSeq, [input.branch]: seq } }
        setState((st) => {
          const withSeq = { ...st, invoiceSeq: { ...st.invoiceSeq, [input.branch]: seq } }
          // Offline sales stay in the terminal's queue until connectivity returns
          return st.posOffline ? { ...withSeq, offlineQueue: [...st.offlineQueue, sale] } : applySale(withSeq, sale)
        })
        return sale
      },
      setPosOffline(offline) {
        const queued = ref.current.offlineQueue.length
        setState((st) => {
          const base = { user: "System", branch: st.posBranch, category: "Sync" as const, device: posDevice(st.posBranch) }
          if (offline) return log({ ...st, posOffline: true }, { ...base, action: "POS went offline · selling continues, transactions queued locally", flagged: true })
          const back = log({ ...st, posOffline: false }, { ...base, action: `Connection restored · ${st.offlineQueue.length} queued transaction(s) synced` })
          return { ...st.offlineQueue.reduce(applySale, back), offlineQueue: [] }
        })
        return offline ? 0 : queued
      },
      setPosBranch(b) {
        setState((st) => ({ ...st, posBranch: b }))
      },
      reset() {
        setState(initialState())
      },
    }
  }, [state])

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export function useDemoStore() {
  const ctx = React.useContext(StoreContext)
  if (!ctx) throw new Error("useDemoStore must be used within <DemoStoreProvider>")
  return ctx
}

export function sumStoreKpis(kpis: Record<BranchId, BranchKpis>, ids: BranchId[]): BranchKpis {
  return ids.reduce<BranchKpis>(
    (acc, id) => {
      for (const key of Object.keys(acc) as (keyof BranchKpis)[]) acc[key] += kpis[id][key]
      return acc
    },
    { todaySales: 0, todayTx: 0, mtdSales: 0, mtdGrossProfit: 0, lastMonthSameDaySales: 0, inventoryValue: 0, receivables: 0, payables: 0, cash: 0 }
  )
}
