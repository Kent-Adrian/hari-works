// Mock data for the demo. Values are realistic for a PH fertilizer distributor
// and reuse the examples from Hari Works' own requirements document.

import { DAY_OF_MONTH, LAST_MONTH_START, PREV_MTD_DAYS, TODAY, YEAR, daysAgo, fmtShort, mmdd } from "./demo-date"

export type BranchId = "DVO" | "ILO" | "BCD" | "GES"

export type Branch = {
  id: BranchId
  name: string
  short: string
  isMain?: boolean
  online: boolean
  lastSync: string
  queuedTx: number
}

export const BRANCHES: Branch[] = [
  { id: "DVO", name: "Davao – Main", short: "Davao", isMain: true, online: true, lastSync: "just now", queuedTx: 0 },
  { id: "ILO", name: "Iloilo", short: "Iloilo", online: true, lastSync: "1 min ago", queuedTx: 0 },
  { id: "BCD", name: "Bacolod", short: "Bacolod", online: false, lastSync: "18 min ago", queuedTx: 3 },
  { id: "GES", name: "General Santos", short: "GenSan", online: true, lastSync: "just now", queuedTx: 0 },
]

export const BRANCH_BY_ID = Object.fromEntries(BRANCHES.map((b) => [b.id, b])) as Record<BranchId, Branch>

// Chart colors follow the branch (entity), never its rank. Validated categorical order.
export const BRANCH_COLOR: Record<BranchId, string> = {
  DVO: "var(--series-1)",
  ILO: "var(--series-2)",
  BCD: "var(--series-3)",
  GES: "var(--series-4)",
}

export type BranchKpis = {
  todaySales: number
  todayTx: number
  mtdSales: number
  mtdGrossProfit: number
  lastMonthSameDaySales: number
  inventoryValue: number
  receivables: number
  payables: number
  cash: number
}

// Per-branch profile; period figures are derived from daily sales relative to today
const PROFILE: Record<BranchId, { avgDaily: number; margin: number; todaySales: number; todayTx: number; receivables: number; payables: number; cash: number }> = {
  DVO: { avgDaily: 423_000, margin: 0.13, todaySales: 486_350, todayTx: 64, receivables: 2_315_000, payables: 1_840_200, cash: 1_126_750 },
  ILO: { avgDaily: 183_200, margin: 0.134, todaySales: 214_800, todayTx: 31, receivables: 948_200, payables: 412_500, cash: 438_900 },
  BCD: { avgDaily: 151_300, margin: 0.13, todaySales: 176_450, todayTx: 26, receivables: 1_102_400, payables: 325_800, cash: 352_100 },
  GES: { avgDaily: 203_000, margin: 0.134, todaySales: 231_900, todayTx: 35, receivables: 873_600, payables: 390_400, cash: 497_300 },
}

// Deterministic pseudo-random sales for any branch and date
function dailySales(branch: BranchId, date: Date) {
  const idx = BRANCHES.findIndex((b) => b.id === branch)
  let h = (date.getFullYear() * 400 + date.getMonth() * 32 + date.getDate()) * 2654435761 + idx * 97
  h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0
  const r = (h % 10_000) / 10_000
  const sunday = date.getDay() === 0 ? 0.45 : 1
  return Math.round(PROFILE[branch].avgDaily * sunday * (0.8 + r * 0.4))
}

function sumDays(branch: BranchId, start: Date, days: number) {
  let total = 0
  for (let i = 0; i < days; i++) total += dailySales(branch, new Date(start.getFullYear(), start.getMonth(), start.getDate() + i))
  return total
}

export const KPIS: Record<BranchId, BranchKpis> = Object.fromEntries(
  BRANCHES.map((b) => {
    const p = PROFILE[b.id]
    const monthStart = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1)
    // Earlier days this month + today's sales so far
    const mtdSales = sumDays(b.id, monthStart, DAY_OF_MONTH - 1) + p.todaySales
    // Same days last month, with this season running ahead of last month
    const lastMonthSameDaySales = Math.round(sumDays(b.id, LAST_MONTH_START, PREV_MTD_DAYS) * (b.id === "BCD" ? 1.03 : 0.93))
    const kpis: BranchKpis = {
      todaySales: p.todaySales,
      todayTx: p.todayTx,
      mtdSales,
      mtdGrossProfit: Math.round(mtdSales * p.margin),
      lastMonthSameDaySales,
      inventoryValue: 0, // derived from the stock ledger in demo-store
      receivables: p.receivables,
      payables: p.payables,
      cash: p.cash,
    }
    return [b.id, kpis]
  })
) as Record<BranchId, BranchKpis>

// ---------- Daily sales trend: last 28 days up to today ----------
const TREND_DAYS = 28

export type TrendPoint = { day: string } & Record<BranchId, number>

export const DAILY_SALES: TrendPoint[] = Array.from({ length: TREND_DAYS }, (_, i) => {
  const date = daysAgo(TREND_DAYS - 1 - i)
  const isToday = i === TREND_DAYS - 1
  const point = { day: fmtShort(date) } as TrendPoint
  for (const b of BRANCHES) point[b.id] = isToday ? PROFILE[b.id].todaySales : dailySales(b.id, date)
  return point
})

/** Month-to-date sales relative to the 28-day base the SKU figures were written for */
export const MTD_SCALE = Object.values(KPIS).reduce((a, k) => a + k.mtdSales, 0) / 26_892_500

// ---------- Sales by formulation (share of branch MTD) ----------
export const FORMULATIONS = ["UREA", "14-14-14", "16-20-0", "21-0-0", "18-46-0", "POTASH"] as const

const FORMULATION_SHARE: Record<BranchId, number[]> = {
  DVO: [0.31, 0.24, 0.16, 0.12, 0.1, 0.07],
  ILO: [0.36, 0.2, 0.14, 0.15, 0.09, 0.06],
  BCD: [0.29, 0.26, 0.18, 0.11, 0.09, 0.07],
  GES: [0.33, 0.22, 0.17, 0.1, 0.11, 0.07],
}

export function salesByFormulation(ids: BranchId[]) {
  return FORMULATIONS.map((f, i) => ({
    formulation: f,
    sales: ids.reduce((acc, id) => acc + Math.round(KPIS[id].mtdSales * FORMULATION_SHARE[id][i]), 0),
  }))
}

// ---------- Top SKUs (month to date) ----------
export type SkuRow = {
  sku: string
  formulation: string
  brand: string
  packaging: string
  sacks: number
  sales: number
  avgCost: number
  price: number
  rebagged?: boolean
}

export const TOP_SKUS: SkuRow[] = [
  { sku: "URE-PHP-50", formulation: "UREA", brand: "PHILPHOS", packaging: "50 KG", sacks: 3_420, sales: 6_190_200, avgCost: 1_500, price: 1_810 },
  { sku: "URE-HWC-50", formulation: "UREA", brand: "HARI WORKS", packaging: "50 KG", sacks: 1_180, sales: 2_183_000, avgCost: 1_580, price: 1_850, rebagged: true },
  { sku: "141-PHP-50", formulation: "14-14-14", brand: "PHILPHOS", packaging: "50 KG", sacks: 2_060, sales: 3_975_800, avgCost: 1_690, price: 1_930 },
  { sku: "162-UHI-50", formulation: "16-20-0", brand: "UHI", packaging: "50 KG", sacks: 1_540, sales: 2_525_600, avgCost: 1_420, price: 1_640 },
  { sku: "210-PHP-50", formulation: "21-0-0", brand: "PHILPHOS", packaging: "50 KG", sacks: 1_870, sales: 1_963_500, avgCost: 905, price: 1_050 },
  { sku: "184-PHP-50", formulation: "18-46-0", brand: "PHILPHOS", packaging: "50 KG", sacks: 790, sales: 1_998_700, avgCost: 2_180, price: 2_530 },
]

// ---------- Alerts ----------
export type AlertLevel = "critical" | "serious" | "warning"
export type Alert = {
  id: string
  level: AlertLevel
  kind: "Out of stock" | "Low stock" | "Overdue receivable" | "Non-moving stock" | "Branch offline" | "Cash variance"
  title: string
  detail: string
  branch: BranchId
}

export const ALERTS: Alert[] = [
  { id: "a1", level: "critical", kind: "Out of stock", title: "UREA AMIGO 50 KG", detail: "0 sacks on hand · reorder level 60", branch: "GES" },
  { id: "a2", level: "critical", kind: "Branch offline", title: "Bacolod POS offline", detail: "3 transactions queued · last sync 18 min ago", branch: "BCD" },
  { id: "a3", level: "serious", kind: "Overdue receivable", title: "Mindanao Farmers Cooperative", detail: "₱185,000 · 47 days overdue", branch: "DVO" },
  { id: "a4", level: "serious", kind: "Low stock", title: "14-14-14 SWIRE 50 KG", detail: "12 sacks left · reorder level 40", branch: "BCD" },
  { id: "a5", level: "warning", kind: "Cash variance", title: `Shift #ILO-${mmdd(daysAgo(1))}-1 closed short`, detail: "Expected ₱40,000 · actual ₱39,500 · −₱500", branch: "ILO" },
  { id: "a6", level: "warning", kind: "Non-moving stock", title: "POTASH PHILPHOS 50 KG", detail: "86 sacks · no movement in 94 days", branch: "ILO" },
]

// ---------- Pending approvals ----------
export type Approval = {
  id: string
  type: "Rebagging" | "Stock transfer" | "Purchase order" | "Credit override" | "Discount"
  ref: string
  summary: string
  amount?: number
  requestedBy: string
  branch: BranchId
  age: string
}

export const APPROVALS: Approval[] = [
  { id: "p1", type: "Rebagging", ref: `RB-${YEAR}-0142`, summary: "100 sacks UREA PHILPHOS → 100 × HARI WORKS UREA 50 KG · ₱1,580/sack", amount: 158_000, requestedBy: "M. Santos (Manager)", branch: "DVO", age: "25 min" },
  { id: "p2", type: "Credit override", ref: "SI-GES-08841", summary: "Juan dela Cruz Farm · limit ₱100,000 · outstanding ₱65,000 · new sale ₱50,000", amount: 50_000, requestedBy: "R. Villanueva (Cashier)", branch: "GES", age: "8 min" },
  { id: "p3", type: "Stock transfer", ref: `TR-${YEAR}-0087`, summary: "150 sacks 16-20-0 UHI 50 KG · Davao → Iloilo", requestedBy: "A. Gonzaga (Manager)", branch: "ILO", age: "1 hr" },
  { id: "p4", type: "Purchase order", ref: `PO-${YEAR}-0311`, summary: "Philphos · 800 sacks UREA + 400 sacks 18-46-0", amount: 2_120_000, requestedBy: "M. Santos (Manager)", branch: "DVO", age: "2 hr" },
  { id: "p5", type: "Discount", ref: "SI-BCD-05120", summary: "8% dealer discount on 40 sacks 14-14-14 (limit 5%)", amount: 6_176, requestedBy: "J. Lim (Cashier)", branch: "BCD", age: "3 hr" },
]

// ---------- Formatting ----------
const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 })
export const formatPeso = (n: number) => peso.format(n)

export function formatPesoCompact(n: number) {
  if (Math.abs(n) >= 1_000_000) return `₱${(n / 1_000_000).toFixed(2)}M`
  if (Math.abs(n) >= 1_000) return `₱${Math.round(n / 1_000)}K`
  return `₱${n}`
}

export const formatNumber = (n: number) => n.toLocaleString("en-PH")
