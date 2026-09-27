// The demo runs "as of today" so it never looks out of date when presented.
// Evaluated in the browser: the app renders client-side only (see components/providers.tsx).

export const TODAY = new Date()
TODAY.setHours(0, 0, 0, 0)

export const YEAR = TODAY.getFullYear()
export const DAY_OF_MONTH = TODAY.getDate()

export function daysAgo(n: number) {
  const d = new Date(TODAY)
  d.setDate(d.getDate() - n)
  return d
}

/** "Sep 28, 2026" */
export const fmtDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
/** "Sep 28" */
export const fmtShort = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
/** "Monday, September 28, 2026" */
export const fmtLong = (d: Date) => d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
/** "260928" — used inside document numbers */
export const ymd = (d: Date) => `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`
/** "0928" */
export const mmdd = (d: Date) => ymd(d).slice(2)

const monthShort = (d: Date) => d.toLocaleDateString("en-US", { month: "short" })

/** "Sep 1–28, 2026" */
export const MTD_LABEL = `${monthShort(TODAY)} 1–${DAY_OF_MONTH}, ${YEAR}`
/** "September 2026" */
export const MONTH_LABEL = TODAY.toLocaleDateString("en-US", { month: "long", year: "numeric" })

const lastMonth = new Date(TODAY.getFullYear(), TODAY.getMonth() - 1, 1)
const lastMonthDays = new Date(TODAY.getFullYear(), TODAY.getMonth(), 0).getDate()
/** "Aug 1–28" — same days last month */
export const PREV_MTD_LABEL = `${monthShort(lastMonth)} 1–${Math.min(DAY_OF_MONTH, lastMonthDays)}`
export const PREV_MTD_DAYS = Math.min(DAY_OF_MONTH, lastMonthDays)
export const LAST_MONTH_START = lastMonth

/** Clock time N minutes before the page was opened, e.g. "9:42 AM" (never before 12:05 AM today) */
export function minutesAgo(n: number) {
  const now = new Date()
  const t = new Date(Math.max(now.getTime() - n * 60_000, TODAY.getTime() + 5 * 60_000))
  return t.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
}

/** When today's cashier shifts opened */
export const SHIFT_OPENED = minutesAgo(150)

export const QUARTER_LABEL = `Q${Math.floor(TODAY.getMonth() / 3) + 1} ${YEAR}`
