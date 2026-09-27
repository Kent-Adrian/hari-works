"use client"

import * as React from "react"
import Link from "next/link"
import { AlertTriangle, ArrowLeft, Barcode, CloudOff, LogOut, Minus, Plus, RefreshCw, Search, ShoppingBasket, Trash2, Wifi } from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { PRODUCTS, PRODUCT_BY_SKU, REORDER_LEVEL, toKg, type Product } from "@/lib/catalog"
import { useDemoStore, type Payment, type Sale, type SaleLine } from "@/lib/demo-store"
import { SHIFT_OPENED, TODAY, mmdd } from "@/lib/demo-date"
import { BRANCHES, BRANCH_BY_ID, formatNumber, formatPeso, type BranchId } from "@/lib/mock-data"
import { CheckoutDialog } from "./checkout-dialog"
import { EndShiftDialog } from "./end-shift-dialog"
import { DEMO_MANAGER, ManagerPinDialog, type PinRequest } from "./manager-pin-dialog"
import { ReceiptDialog } from "./receipt-dialog"

const CASHIER = "R. Villanueva"
const CASHIER_DISCOUNT_LIMIT = 5
const DISCOUNTS = [0, 2, 5, 8, 10]
const FILTERS = ["All", "UREA", "14-14-14", "16-20-0", "21-0-0", "18-46-0", "POTASH", "Hari Works"] as const

// A ready-made order for the credit-limit part of the demo (≈ ₱47,600 on a ₱35,000 available limit)
const SAMPLE_ORDER: SaleLine[] = [
  { sku: "URE-HWC-50", qty: 10, price: PRODUCT_BY_SKU["URE-HWC-50"].price },
  { sku: "141-PHP-50", qty: 10, price: PRODUCT_BY_SKU["141-PHP-50"].price },
  { sku: "162-UHI-50", qty: 6, price: PRODUCT_BY_SKU["162-UHI-50"].price },
]

export function PosScreen() {
  const store = useDemoStore()
  const { posBranch: branch, posOffline, offlineQueue, inventory, customers } = store
  const [query, setQuery] = React.useState("")
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]>("All")
  const [cart, setCart] = React.useState<SaleLine[]>([])
  const [customerId, setCustomerId] = React.useState("C-0000")
  const [discountPct, setDiscountPct] = React.useState(0)
  const [discountApproval, setDiscountApproval] = React.useState<string | null>(null)
  const [pin, setPin] = React.useState<PinRequest | null>(null)
  const [checkout, setCheckout] = React.useState(false)
  const [receipt, setReceipt] = React.useState<Sale | null>(null)
  const [endShift, setEndShift] = React.useState(false)
  const [syncing, setSyncing] = React.useState(false)
  const searchRef = React.useRef<HTMLInputElement>(null)

  const stock = inventory[branch]
  const customer = customers.find((c) => c.id === customerId)!
  const shiftId = `${branch}-${mmdd(TODAY)}-1`

  const products = PRODUCTS.filter((p) => {
    if (filter === "Hari Works" && !p.privateLabel) return false
    if (filter !== "All" && filter !== "Hari Works" && p.formulation !== filter) return false
    const q = query.trim().toLowerCase()
    return !q || `${p.formulation} ${p.brand} ${p.sku} ${p.barcode} ${p.packKg}kg`.toLowerCase().includes(q)
  })

  const subtotal = cart.reduce((a, l) => a + l.qty * l.price, 0)
  const discount = Math.round((subtotal * discountPct) / 100)
  const total = subtotal - discount
  const totalKg = cart.reduce((a, l) => a + toKg(l.sku, l.qty), 0)
  const sacks = cart.reduce((a, l) => a + l.qty, 0)

  function add(p: Product, qty = 1) {
    const inCart = cart.find((l) => l.sku === p.sku)?.qty ?? 0
    if (inCart + qty > stock[p.sku].qty) {
      toast.error(`Only ${stock[p.sku].qty} sacks of ${p.formulation} ${p.brand} on hand`)
      return
    }
    setCart((c) => (inCart ? c.map((l) => (l.sku === p.sku ? { ...l, qty: l.qty + qty } : l)) : [...c, { sku: p.sku, qty, price: p.price }]))
  }

  function setQty(sku: string, qty: number) {
    if (qty > stock[sku].qty) return toast.error(`Only ${stock[sku].qty} sacks on hand`)
    setCart((c) => (qty <= 0 ? c.filter((l) => l.sku !== sku) : c.map((l) => (l.sku === sku ? { ...l, qty } : l))))
  }

  function onSearchKey(e: React.KeyboardEvent<HTMLInputElement>) {
    // Barcode scanners type the code and press Enter
    if (e.key !== "Enter") return
    const hit = PRODUCTS.find((p) => p.barcode === query.trim() || p.sku.toLowerCase() === query.trim().toLowerCase()) ?? (products.length === 1 ? products[0] : null)
    if (hit) {
      add(hit)
      setQuery("")
    }
  }

  function chooseDiscount(pct: number) {
    if (pct <= CASHIER_DISCOUNT_LIMIT) {
      setDiscountPct(pct)
      setDiscountApproval(null)
      return
    }
    setPin({
      title: `Approve ${pct}% discount`,
      reason: `Cashier limit is ${CASHIER_DISCOUNT_LIMIT}%. Discount of ${formatPeso(Math.round((subtotal * pct) / 100))} on this sale.`,
      onApproved: () => {
        setDiscountPct(pct)
        setDiscountApproval(`${pct}% discount approved by ${DEMO_MANAGER}`)
        toast.success(`${pct}% discount approved`, { description: `By ${DEMO_MANAGER} · logged to audit trail` })
      },
    })
  }

  function complete(payments: Payment[], approvals: string[]) {
    const sale = store.recordSale({
      branch,
      customerId,
      cashier: CASHIER,
      lines: cart,
      subtotal,
      discountPct,
      discount,
      total,
      payments,
      approvals: [...(discountApproval ? [discountApproval] : []), ...approvals],
    })
    setCheckout(false)
    setReceipt(sale)
    setCart([])
    setDiscountPct(0)
    setDiscountApproval(null)
    setCustomerId("C-0000")
  }

  function toggleOnline() {
    if (!posOffline) {
      store.setPosOffline(true)
      toast.warning("Connection lost", { description: "POS keeps selling. Transactions are queued on this terminal." })
      return
    }
    setSyncing(true)
    setTimeout(() => {
      const n = store.setPosOffline(false)
      setSyncing(false)
      toast.success("Back online", { description: n ? `${n} queued transaction${n > 1 ? "s" : ""} synced to the central server.` : "Nothing to sync." })
    }, 1200)
  }

  const shiftSales = [...store.sales.filter((s) => s.branch === branch), ...offlineQueue.filter((s) => s.branch === branch)]

  return (
    <div className="flex h-screen flex-col bg-page">
      {/* Terminal header */}
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-sidebar px-4 py-2.5 text-sidebar-foreground">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">HW</div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Hari Works POS</div>
            <div className="text-[11px] text-sidebar-foreground/60">Terminal POS-{branch}-01</div>
          </div>
        </div>

        <NativeSelect
          aria-label="Branch"
          value={branch}
          onChange={(e) => {
            store.setPosBranch(e.target.value as BranchId)
            setCart([])
          }}
          className="w-44 [&_select]:border-sidebar-border [&_select]:bg-sidebar-accent [&_select]:text-sidebar-foreground"
        >
          {BRANCHES.map((b) => (
            <option key={b.id} value={b.id} className="text-foreground">
              {b.name}
            </option>
          ))}
        </NativeSelect>

        <div className="text-xs text-sidebar-foreground/70">
          Cashier <span className="font-medium text-sidebar-foreground">{CASHIER}</span> · Shift {shiftId} · opened {SHIFT_OPENED}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={toggleOnline}
            title="Demo: simulate an internet outage"
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
              posOffline ? "bg-status-warning text-neutral-900" : "bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/70"
            )}
          >
            {syncing ? <RefreshCw className="size-3.5 animate-spin" /> : posOffline ? <CloudOff className="size-3.5" /> : <Wifi className="size-3.5 text-status-good" />}
            {syncing ? "Syncing…" : posOffline ? `Offline · ${offlineQueue.length} queued` : "Online · synced"}
          </button>
          <Button size="sm" variant="ghost" className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground" onClick={() => setEndShift(true)}>
            <LogOut /> End shift
          </Button>
          <Link href="/dashboard" className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground">
            <ArrowLeft className="size-3.5" /> Back Office
          </Link>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Products */}
        <section className="flex min-h-0 flex-1 flex-col p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onSearchKey}
              placeholder="Scan barcode or search formulation, brand, SKU…"
              className="h-11 bg-background pl-9 text-base"
            />
            <Barcode className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-muted-foreground" />
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm transition-colors",
                  filter === f ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="mt-3 grid min-h-0 flex-1 auto-rows-min grid-cols-2 gap-2.5 overflow-y-auto pb-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {products.map((p) => {
              const qty = stock[p.sku].qty
              const out = qty <= 0
              return (
                <button
                  key={p.sku}
                  type="button"
                  disabled={out}
                  onClick={() => add(p)}
                  className={cn(
                    "flex flex-col rounded-xl border bg-card p-3 text-left transition hover:border-primary hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
                    p.privateLabel && "border-primary/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-lg leading-tight font-semibold">{p.formulation}</span>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium">{p.packKg} KG</span>
                  </div>
                  <span className={cn("text-xs font-medium", p.privateLabel ? "text-primary" : "text-muted-foreground")}>{p.brand}</span>
                  <span className="mt-2 text-base font-semibold tabular-nums">{formatPeso(p.price)}</span>
                  <span
                    className={cn(
                      "mt-0.5 flex items-center gap-1 text-xs tabular-nums",
                      out ? "text-status-critical" : qty < REORDER_LEVEL ? "text-status-serious" : "text-muted-foreground"
                    )}
                  >
                    {(out || qty < REORDER_LEVEL) && <AlertTriangle className="size-3" />}
                    {out ? "Out of stock" : `${formatNumber(qty)} in stock${qty < REORDER_LEVEL ? " · low" : ""}`}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {/* Cart */}
        <aside className="flex max-h-[60vh] w-full shrink-0 flex-col border-t bg-card lg:max-h-none lg:w-[420px] lg:border-t-0 lg:border-l">
          <div className="space-y-2 border-b p-4">
            <label className="grid gap-1">
              <span className="text-xs font-medium text-muted-foreground">Customer</span>
              <NativeSelect
                value={customerId}
                onChange={(e) => {
                  setCustomerId(e.target.value)
                }}
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.type !== "Walk-in" ? `· ${c.type}` : ""}
                  </option>
                ))}
              </NativeSelect>
            </label>
            {customer.creditLimit > 0 && (
              <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted px-3 py-2 text-xs tabular-nums">
                <div>
                  <div className="text-muted-foreground">Limit</div>
                  <div className="font-medium">{formatPeso(customer.creditLimit)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Outstanding</div>
                  <div className="font-medium">{formatPeso(customer.outstanding)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Available</div>
                  <div className="font-medium">{formatPeso(customer.creditLimit - customer.outstanding)}</div>
                </div>
              </div>
            )}
            {customer.overdue && (
              <div className="flex items-center gap-2 rounded-lg bg-status-critical/10 px-3 py-2 text-xs font-medium text-status-critical">
                <AlertTriangle className="size-4 shrink-0" />
                Overdue {formatPeso(customer.overdue.amount)} · {customer.overdue.days} days. Credit sales need manager approval.
              </div>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 py-8 text-center text-sm text-muted-foreground">
                <ShoppingBasket className="size-10 opacity-40" />
                Scan or tap a product to start a sale
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCart(SAMPLE_ORDER.filter((l) => stock[l.sku].qty >= l.qty))
                    setCustomerId("C-1042")
                  }}
                >
                  Demo: load sample farm order
                </Button>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {cart.map((l) => {
                  const p = PRODUCT_BY_SKU[l.sku]
                  return (
                    <li key={l.sku} className="rounded-lg border p-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-medium">
                            {p.formulation} {p.brand} {p.packKg} KG
                          </div>
                          <div className="text-xs text-muted-foreground tabular-nums">
                            {formatPeso(l.price)} / sack · {formatNumber(toKg(l.sku, l.qty))} kg
                          </div>
                        </div>
                        <div className="text-sm font-semibold tabular-nums">{formatPeso(l.qty * l.price)}</div>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5">
                        <Button variant="outline" size="icon-sm" aria-label="Decrease" onClick={() => setQty(l.sku, l.qty - 1)}>
                          <Minus />
                        </Button>
                        <Input
                          type="number"
                          value={l.qty}
                          onChange={(e) => setQty(l.sku, Math.max(0, Number(e.target.value) || 0))}
                          className="h-7 w-16 text-center tabular-nums"
                          aria-label="Quantity"
                        />
                        <Button variant="outline" size="icon-sm" aria-label="Increase" onClick={() => setQty(l.sku, l.qty + 1)}>
                          <Plus />
                        </Button>
                        <span className="text-xs text-muted-foreground">sacks</span>
                        <Button variant="ghost" size="icon-sm" className="ml-auto" aria-label="Remove" onClick={() => setQty(l.sku, 0)}>
                          <Trash2 />
                        </Button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="space-y-3 border-t p-4">
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground">Discount</span>
                <span className="text-muted-foreground">Cashier limit {CASHIER_DISCOUNT_LIMIT}% · above needs manager</span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {DISCOUNTS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    disabled={cart.length === 0}
                    onClick={() => chooseDiscount(d)}
                    className={cn(
                      "rounded-md border py-1 text-sm tabular-nums transition-colors disabled:opacity-50",
                      discountPct === d ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
                      d > CASHIER_DISCOUNT_LIMIT && discountPct !== d && "border-dashed"
                    )}
                  >
                    {d}%
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1 text-sm tabular-nums">
              <div className="flex justify-between text-muted-foreground">
                <span>
                  Subtotal · {sacks} sacks · {formatNumber(totalKg)} kg
                </span>
                <span>{formatPeso(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Discount {discountPct}%</span>
                  <span>−{formatPeso(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>VAT-exempt (fertilizer)</span>
                <span>₱0 VAT</span>
              </div>
            </div>

            <Button size="lg" className="h-12 w-full text-base" disabled={cart.length === 0} onClick={() => setCheckout(true)}>
              Charge {formatPeso(total)}
            </Button>
          </div>
        </aside>
      </div>

      {checkout && (
        <CheckoutDialog
          open
          total={total}
          customer={customer}
          onClose={() => setCheckout(false)}
          onComplete={complete}
          requestPin={setPin}
        />
      )}
      <ReceiptDialog
        sale={receipt}
        onClose={() => {
          setReceipt(null)
          searchRef.current?.focus()
        }}
      />
      <EndShiftDialog open={endShift} onClose={() => setEndShift(false)} sales={shiftSales} shiftId={shiftId} />
      <ManagerPinDialog request={pin} onClose={() => setPin(null)} />
      <span className="sr-only">{BRANCH_BY_ID[branch].name}</span>
    </div>
  )
}
