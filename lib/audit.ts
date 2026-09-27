import { SHIFT_OPENED, TODAY, YEAR, daysAgo, fmtDate, minutesAgo, mmdd } from "./demo-date"
import type { BranchId } from "./mock-data"

// Audit trail per requirements §19: user, date, time, branch, action, old/new value,
// reason, approver and device. Entries are append-only.

export type AuditCategory =
  | "Approval"
  | "Price change"
  | "Discount"
  | "Credit override"
  | "Void"
  | "Stock adjustment"
  | "Rebagging"
  | "Sale"
  | "Shift"
  | "Security"
  | "Sync"
  | "User & role"

export type AuditEvent = {
  id: string
  date: string
  time: string
  user: string
  branch: BranchId
  category: AuditCategory
  action: string
  ref?: string
  oldValue?: string
  newValue?: string
  reason?: string
  approver?: string
  device: string
  flagged?: boolean
  isNew?: boolean
}

export const BACK_OFFICE_DEVICE = "Back Office · Chrome · 192.168.1.24"
export const posDevice = (b: BranchId) => `POS-${b}-01 · 192.168.${{ DVO: 10, ILO: 20, BCD: 30, GES: 40 }[b]}.21`

const today = fmtDate(TODAY)
const yesterday = fmtDate(daysAgo(1))

// Newest first
export const SEED_AUDIT: AuditEvent[] = [
  { id: "AU-0112", date: today, time: minutesAgo(25), user: "M. Santos (Manager)", branch: "DVO", category: "Rebagging", action: "Rebagging request created", ref: `RB-${YEAR}-0142`, newValue: "100 → 100 bags · ₱158,000", device: BACK_OFFICE_DEVICE },
  { id: "AU-0111", date: today, time: minutesAgo(48), user: "M. Santos (Manager)", branch: "DVO", category: "Stock adjustment", action: "Stock adjustment approved", ref: "ADJ-DVO-0041", oldValue: "14-14-14 SWIRE 50 KG: 123 sacks", newValue: "120 sacks (−3)", reason: "Damaged sacks — torn during unloading", approver: "C. Reyes (Admin)", device: BACK_OFFICE_DEVICE },
  { id: "AU-0110", date: today, time: minutesAgo(66), user: "bcd.cashier2", branch: "BCD", category: "Security", action: "3 failed login attempts · account locked 15 min", device: posDevice("BCD"), flagged: true },
  { id: "AU-0109", date: today, time: minutesAgo(98), user: "J. Lim (Cashier)", branch: "BCD", category: "Void", action: "Sales invoice voided", ref: "SI-BCD-0005118", oldValue: "₱3,860", newValue: "Void", reason: "Wrong product scanned", approver: "M. Cruz (Manager)", device: posDevice("BCD") },
  { id: "AU-0108", date: today, time: minutesAgo(108), user: "System", branch: "BCD", category: "Sync", action: "POS went offline · transactions queued locally", device: posDevice("BCD"), flagged: true },
  { id: "AU-0107", date: today, time: minutesAgo(133), user: "C. Reyes (Admin)", branch: "DVO", category: "Price change", action: "Retail price changed · all branches", ref: "URE-PHP-50", oldValue: "₱1,790", newValue: "₱1,810", reason: "Philphos price increase (supplier memo)", device: BACK_OFFICE_DEVICE },
  { id: "AU-0106", date: today, time: SHIFT_OPENED, user: "R. Villanueva (Cashier)", branch: "GES", category: "Shift", action: "Shift opened", ref: `GES-${mmdd(TODAY)}-1`, newValue: "Opening cash ₱5,000", device: posDevice("GES") },
  { id: "AU-0105", date: yesterday, time: "5:41 PM", user: "A. Gonzaga (Manager)", branch: "ILO", category: "Shift", action: "Shift closed with variance", ref: `ILO-${mmdd(daysAgo(1))}-1`, oldValue: "Expected ₱40,000", newValue: "Actual ₱39,500 (−₱500)", reason: "Under review", device: posDevice("ILO"), flagged: true },
  { id: "AU-0104", date: yesterday, time: "3:15 PM", user: "C. Reyes (Admin)", branch: "GES", category: "User & role", action: "User role changed", ref: "l.tan", oldValue: "Cashier", newValue: "Manager · General Santos", reason: "Promotion effective this month", device: BACK_OFFICE_DEVICE },
  { id: "AU-0103", date: yesterday, time: "11:20 AM", user: "Hari Works Owner", branch: "DVO", category: "Approval", action: "Purchase order approved", ref: `PO-${YEAR}-0305`, newValue: "₱1,284,000 · Philphos", device: "Owner · iPhone · mobile data" },
]
