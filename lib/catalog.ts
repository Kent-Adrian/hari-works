import type { BranchId } from "./mock-data"

// ---------- Products ----------
// Formulation, brand, packaging, unit and SKU are separate fields (requirements §4)
export type Product = {
  sku: string
  barcode: string
  formulation: string
  brand: string
  packKg: number
  price: number
  /** Private-label product produced by rebagging */
  privateLabel?: boolean
}

export const PRODUCTS: Product[] = [
  { sku: "URE-PHP-50", barcode: "4801234500011", formulation: "UREA", brand: "PHILPHOS", packKg: 50, price: 1810 },
  { sku: "URE-AMG-50", barcode: "4801234500028", formulation: "UREA", brand: "AMIGO", packKg: 50, price: 1780 },
  { sku: "210-PHP-50", barcode: "4801234500035", formulation: "21-0-0", brand: "PHILPHOS", packKg: 50, price: 1050 },
  { sku: "210-UHI-50", barcode: "4801234500042", formulation: "21-0-0", brand: "UHI", packKg: 50, price: 1020 },
  { sku: "162-UHI-50", barcode: "4801234500059", formulation: "16-20-0", brand: "UHI", packKg: 50, price: 1640 },
  { sku: "162-SWR-50", barcode: "4801234500066", formulation: "16-20-0", brand: "SWIRE", packKg: 50, price: 1660 },
  { sku: "162-PHP-50", barcode: "4801234500073", formulation: "16-20-0", brand: "PHILPHOS", packKg: 50, price: 1680 },
  { sku: "141-PHP-50", barcode: "4801234500080", formulation: "14-14-14", brand: "PHILPHOS", packKg: 50, price: 1930 },
  { sku: "141-SWR-50", barcode: "4801234500097", formulation: "14-14-14", brand: "SWIRE", packKg: 50, price: 1900 },
  { sku: "141-AMG-50", barcode: "4801234500103", formulation: "14-14-14", brand: "AMIGO", packKg: 50, price: 1880 },
  { sku: "141-UHI-50", barcode: "4801234500110", formulation: "14-14-14", brand: "UHI", packKg: 50, price: 1870 },
  { sku: "POT-PHP-50", barcode: "4801234500127", formulation: "POTASH", brand: "PHILPHOS", packKg: 50, price: 2050 },
  { sku: "184-PHP-50", barcode: "4801234500134", formulation: "18-46-0", brand: "PHILPHOS", packKg: 50, price: 2530 },
  { sku: "URE-HWC-50", barcode: "4801234500141", formulation: "UREA", brand: "HARI WORKS", packKg: 50, price: 1850, privateLabel: true },
  { sku: "URE-HWC-25", barcode: "4801234500158", formulation: "UREA", brand: "HARI WORKS", packKg: 25, price: 960, privateLabel: true },
  { sku: "141-HWC-25", barcode: "4801234500165", formulation: "14-14-14", brand: "HARI WORKS", packKg: 25, price: 1010, privateLabel: true },
]

export const PRODUCT_BY_SKU = Object.fromEntries(PRODUCTS.map((p) => [p.sku, p])) as Record<string, Product>

export const productName = (p: Product) => `${p.formulation} ${p.brand} ${p.packKg} KG`

// Unit conversion: 1 sack = packKg kilograms (requirements §4)
export const toKg = (sku: string, sacks: number) => sacks * PRODUCT_BY_SKU[sku].packKg

// ---------- Bill of materials per finished bag (requirements §6.3) ----------
// With these rates, 100 × 50 KG bags cost ₱5,000 packaging + ₱2,000 labor + ₱1,000 other,
// which reproduces the ₱158,000 / ₱1,580 per sack example in the requirements.
export type BomLine = { item: string; qty: number; unitCost: number; bucket: "packaging" | "labor" | "other" }

export function bomFor(sku: string): BomLine[] {
  const big = PRODUCT_BY_SKU[sku]?.packKg === 50
  return [
    { item: big ? "Woven PP bag, 50 KG, Hari Works print" : "Woven PP bag, 25 KG, Hari Works print", qty: 1, unitCost: big ? 35 : 22, bucket: "packaging" },
    { item: "Product label & lot sticker", qty: 1, unitCost: big ? 15 : 8, bucket: "packaging" },
    { item: "Rebagging labor", qty: 1, unitCost: big ? 20 : 12, bucket: "labor" },
    { item: "Sealing thread & power", qty: 1, unitCost: big ? 10 : 5, bucket: "other" },
  ]
}

export function bomCosts(sku: string, outputQty: number) {
  const lines = bomFor(sku)
  const sum = (b: BomLine["bucket"]) =>
    lines.filter((l) => l.bucket === b).reduce((a, l) => a + l.qty * l.unitCost * outputQty, 0)
  return { packaging: sum("packaging"), labor: sum("labor"), other: sum("other") }
}

// ---------- Starting inventory (sacks on hand, weighted average cost) ----------
export type StockLine = { qty: number; avgCost: number }
export type Inventory = Record<BranchId, Record<string, StockLine>>

const BASE_COST: Record<string, number> = {
  "URE-PHP-50": 1500, "URE-AMG-50": 1490, "210-PHP-50": 905, "210-UHI-50": 880,
  "162-UHI-50": 1420, "162-SWR-50": 1440, "162-PHP-50": 1455, "141-PHP-50": 1690,
  "141-SWR-50": 1665, "141-AMG-50": 1650, "141-UHI-50": 1640, "POT-PHP-50": 1780,
  "184-PHP-50": 2180, "URE-HWC-50": 1580, "URE-HWC-25": 812, "141-HWC-25": 892,
}

const QTY: Record<BranchId, number[]> = {
  //      URE-PHP URE-AMG 210-PHP 210-UHI 162-UHI 162-SWR 162-PHP 141-PHP 141-SWR 141-AMG 141-UHI POT-PHP 184-PHP HWC-50 HWC-25 141HWC25
  DVO: [420, 180, 260, 140, 310, 90, 150, 380, 120, 110, 160, 95, 210, 64, 138, 120],
  ILO: [210, 95, 160, 80, 140, 45, 60, 170, 55, 40, 70, 86, 90, 30, 60, 0],
  BCD: [160, 70, 110, 50, 120, 40, 55, 140, 12, 35, 60, 45, 75, 25, 40, 0],
  GES: [240, 0, 150, 90, 160, 60, 70, 190, 65, 50, 80, 55, 110, 40, 70, 196],
}

export const INITIAL_INVENTORY: Inventory = Object.fromEntries(
  (Object.keys(QTY) as BranchId[]).map((b) => [
    b,
    Object.fromEntries(PRODUCTS.map((p, i) => [p.sku, { qty: QTY[b][i], avgCost: BASE_COST[p.sku] }])),
  ])
) as Inventory

export const REORDER_LEVEL = 40

// ---------- Customers (requirements §11) ----------
export type Customer = {
  id: string
  name: string
  type: "Walk-in" | "Farmer" | "Farm" | "Dealer" | "Cooperative" | "Government"
  creditLimit: number
  outstanding: number
  overdue?: { amount: number; days: number }
  terms?: string
}

export const CUSTOMERS: Customer[] = [
  { id: "C-0000", name: "Walk-in customer", type: "Walk-in", creditLimit: 0, outstanding: 0 },
  { id: "C-1042", name: "Juan dela Cruz Farm", type: "Farm", creditLimit: 100_000, outstanding: 65_000, terms: "30 days" },
  { id: "C-1107", name: "South Cotabato Agri Dealers", type: "Dealer", creditLimit: 300_000, outstanding: 120_400, terms: "45 days" },
  { id: "C-0981", name: "Mindanao Farmers Cooperative", type: "Cooperative", creditLimit: 500_000, outstanding: 412_000, overdue: { amount: 185_000, days: 47 }, terms: "30 days" },
  { id: "C-1150", name: "Pedro Ramos (Rice farmer)", type: "Farmer", creditLimit: 25_000, outstanding: 0, terms: "Harvest terms" },
]

// ---------- Operating expenses, month to date (for the income statement) ----------
export const OPEX_LINES = ["Salaries & wages", "Rent", "Utilities", "Transportation & delivery", "Repairs & maintenance", "Depreciation"] as const

export const OPEX: Record<BranchId, number[]> = {
  DVO: [412_000, 85_000, 46_300, 138_500, 18_200, 42_000],
  ILO: [186_000, 55_000, 21_400, 64_800, 7_900, 18_500],
  BCD: [171_000, 48_000, 19_800, 58_300, 12_400, 16_000],
  GES: [194_000, 52_000, 23_100, 71_900, 6_300, 19_000],
}

// ---------- Chart of accounts used by the demo (requirements §13.1) ----------
export const ACCOUNTS = {
  cash: "1010 Cash on Hand",
  ewallet: "1020 Cash in Bank – GCash / Maya",
  bank: "1030 Cash in Bank",
  ar: "1100 Accounts Receivable",
  invMerch: "1210 Inventory – Merchandise",
  invFinished: "1220 Inventory – Finished Goods (Rebagged)",
  packaging: "1230 Packaging Supplies",
  ap: "2010 Accounts Payable",
  accrued: "2110 Accrued Expenses",
  sales: "4010 Sales Revenue – VAT Exempt",
  cogs: "5010 Cost of Goods Sold",
} as const
