# Hari Works Demo — Presenter Script (≈13 minutes)

All dates in the demo follow the real calendar: the header shows today's date and month-to-date covers the 1st of this month to today. Early in a month, month-to-date figures are naturally smaller.

## Before the meeting

1. Run the production build (faster, no dev badge):
   ```
   npm run build
   npm run start
   ```
2. Open http://localhost:3000 in a full-screen browser window (F11). Laptop width 1366px or wider. Sign in as **owner@hariworks.demo** / **demo123** (or click the Owner card on the login page).
3. Open a second tab at http://localhost:3000/pos so you can switch quickly. Both tabs share the same data.
4. Rehearse once, then click **Reset demo data** (bottom of the sidebar, circular arrow). Entries are saved in the browser, so refreshing no longer resets them.
5. Say up front: **"This is a working prototype with sample data built from your requirements document."** Point at the sidebar: "The bright menus work today; the ones tagged Phase 1–5 are scheduled in my proposal."

Demo PIN for manager approvals: **1234**

---

## 1. Dashboard — the hook (2 min)

**Screen:** Dashboard, "All branches"

- "This is what the owner sees first thing every morning: all 4 branches on one screen."
- Point at: today's sales, month-to-date gross profit, inventory value, receivables and payables.
- Click **Bacolod** in the branch table. "One click to focus on a single branch." Then click **All branches** again.
- Point at the **Alerts**: "Bacolod's POS is offline, GenSan is out of Urea Amigo, the Mindanao cooperative is 47 days overdue. You don't have to look for problems — they come to you."
- Point at **Pending approvals**: "Rebagging, credit overrides, transfers, POs, discounts — all waiting for your decision here."

## 2. Rebagging — proves we understood your business (3 min)

**Click** the RB-2026-0142 link in Pending approvals (or Rebagging in the sidebar).

- "This is your example from the requirements: 100 sacks of Urea Philphos becoming 100 bags of Hari Works Urea."
- Walk the flow boxes left → right: source consumed → bill of materials → finished goods.
- Cost build-up: "₱150,000 raw material, ₱5,000 packaging, ₱2,000 labor, ₱1,000 other — ₱158,000 total, **₱1,580 per sack**. Exactly your numbers, calculated automatically."
- "And it tells you the margin: ₱270 per bag at ₱1,850."
- Point at **Traceability**: "Every finished bag traces back to purchase order PO-2026-0288."
- Note "On hand now: 420 sacks / 64 bags". Click **Approve & post**.
- "Watch: 420 became 320, 64 became 164, and the accounting entry was created by itself." Point at the auto journal entry.
- Optional (30 sec): click **New rebagging**, click **50 × 50 KG → 98 × 25 KG (2% loss)**. "Loss is recorded explicitly, never disappears. Above 2% the system asks for a reason."

## 3. POS — the cashier's day (3 min)

**Click** "Open Hari Works POS" at the bottom of the sidebar.

- "This is what cashiers see. Big buttons, barcode scanning, live stock per branch."
- Point at **UREA AMIGO — Out of stock** (can't be sold) and the Hari Works products.
- Click **Demo: load sample farm order**. Customer switches to **Juan dela Cruz Farm**.
- "Limit ₱100,000, outstanding ₱65,000, available ₱35,000 — your example."
- Optional: click **8%** discount → PIN dialog. "Cashiers can give up to 5%. Above that the manager approves on the spot." Enter 1234.
- Click **Charge**. Change the payment method to **Charge account**.
- "₱47,640 on a ₱35,000 available limit — the system stops the cashier." Click **Request manager override**, enter **1234**.
- Click **Complete sale**. Receipt appears.
- Right side of the receipt: "Stock deducted, the journal entry posted — debit receivables, credit sales, cost of goods sold — and the dashboard updated. Nobody encoded anything."
- Point at the invoice: "VAT-exempt sales, because fertilizer is VAT-exempt."

## 4. Offline mode — handles bad internet (1 min)

- Click **New sale**, then click **Online · synced** in the header → it turns **Offline**.
- Tap any product, **Charge**, **Complete sale**. "Internet is down, the branch keeps selling. The receipt still prints."
- Click **Offline · 1 queued** → it syncs. "Connection's back, everything uploads automatically."

## 5. Back to the Dashboard — the closer (1 min)

**Click** "Back Office" (top right of the POS).

- Point at **Live from branches** and **Today's sales** ("2 new"). "Every number you just saw changed across the whole system."
- Pending approvals: the rebagging request is gone.

## 6. Accounting — for the accountant (2 min)

**Click** Accounting in the sidebar.

- **Income statement:** "Each branch side by side, and consolidated. Revenue, cost of goods sold, gross profit, expenses, branch operating profit."
- **Journal entries** tab: "The newest entries are the ones we just created: the rebagging and the sales. Every entry balances."
- "Owner access is read-only here, as your document requested."

## 7. Audit trail — control over leakage (1 min)

**Click** Audit Trail in the sidebar.

- "Every sensitive action is logged: who, when, which branch, which device, the value before and after, the reason and who approved."
- Point at the top rows marked **New**: "These are the things we just did — the rebagging approval, the credit override with the manager's PIN, the sale, even the invoice print."
- Click **Flagged only**: "The system flags what needs attention — failed logins, cash variances, credit overrides, offline terminals."
- Click **Prices**: "Price changes show the old and new price and why."
- "Nobody can edit or delete these entries, not even the Admin."

## 8. Security in 20 seconds

- Top-right user menu → switch to **Manager**: the dashboard locks to Davao only and Accounting disappears.
- Switch to **Cashier**: Back Office is blocked and sends them to the POS.
- Switch back to **Owner**.
- Each role also has its own login (see the login page), so the client can sign in as any of them.

---

## Closing line

> "Everything you saw follows the flow in your document: purchase → rebagging → transfer → sale → cost of goods sold → profit. The screens and workflows you just saw carry straight into the real build. The next step is to finalize the costing policy with your accountant and start Phase 1."

Then move to the cost proposal.

## Letting the client try it alone

Deploy the app (for example to Vercel) and send them the link with the demo accounts below. Password for all: **demo123**.

| Account | Sees |
|---|---|
| owner@hariworks.demo | All branches, dashboards and financials |
| admin@hariworks.demo | Full administration and approvals |
| manager@hariworks.demo | Davao branch: inventory and rebagging |
| cashier@hariworks.demo | General Santos POS terminal |

What they enter is saved in their own browser only: it survives refreshes, but it is not shared with other devices or people. **Reset demo data** in the sidebar starts over.

## Likely questions

| Question | Answer |
|---|---|
| Is this the real system? | It's a working prototype with sample data. The demo logins and saved entries live only in this browser. The real system adds the server database, secure logins and the remaining modules in the proposal. |
| Can we add a 5th branch? | Yes. Branches are data, not code. Adding one is a setup task, not development. |
| FIFO or weighted average? | Both are supported. Your accountant picks before Phase 2. The demo uses weighted average. |
| What if the internet is down for a whole day? | The POS keeps selling and queues everything; it syncs when the connection returns. |
| BIR compliance? | Invoice numbering, VAT-exempt treatment and sales summaries are designed in. The final setup is validated against BIR rules at deployment. |
| Can we see it on a phone? | The dashboard works on mobile; a dedicated mobile view is in Phase 5. |

## If something goes wrong

- Click **Reset demo data** at the bottom of the sidebar: everything goes back to the starting data.
- Sidebar menus with a **Phase** tag (Sales, Purchasing, Reports…) aren't in the prototype. Clicking one shows which proposal phase delivers it. Say: "That's in Phase 2 of the plan."
