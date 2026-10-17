# StockWise

**Small Business Inventory & Sales Management System** — a lightweight web app for Zambian retailers (mini-supermarkets, grocery shops, cosmetics shops, hardware stores, agricultural suppliers).

StockWise answers five questions a shop owner actually asks:

1. What products do I have in stock?
2. What is each product worth?
3. What have I sold, and how much revenue have I generated?
4. Which products are running low?
5. Which products are selling best?

> **Demo-only.** All data is fictional (Lusaka Mini Mart). No real customer information is stored. Built as a portfolio project and a foundation for a small commercial solution.

---

## Screenshots

| Dashboard                    | Products                    | Sales                    |
| ---------------------------- | --------------------------- | ------------------------ |
| _[screenshot/dashboard.png]_ | _[screenshot/products.png]_ | _[screenshot/sales.png]_ |

| Inventory                    | Reports                    | Settings                    |
| ---------------------------- | -------------------------- | --------------------------- |
| _[screenshot/inventory.png]_ | _[screenshot/reports.png]_ | _[screenshot/settings.png]_ |

> Add screenshots to a `screenshot/` folder and replace the placeholders above once you have them.

---

## Features

Organised into six modules:

### 1. Dashboard

- Total products, units in stock, inventory value, today's revenue, low-stock count
- 7-day revenue bar chart
- Low-stock alerts table
- Recent sales table
- Quick actions to jump straight into Products / Inventory / Sales

### 2. Product Management

- Add, edit, search products by SKU or name
- Enforces unique SKU (case-insensitive), non-negative prices, non-negative integer quantities
- Live **Low** / **OK** badge per product (`quantity ≤ reorderLevel`)

### 3. Inventory Management

- **Receive stock** (positive delta) and **Adjust stock** (signed delta)
- Rejects any change that would push a product below zero
- Full audit trail in _Recent movements_ (opening, stock_in, adjustment, sale)
- Current stock table with cost valuation per product

### 4. Sales Processing

- Multi-line cart with per-line price snapshots
- **Atomic sale creation** — if any line exceeds stock, the whole sale is rejected and no stock is deducted
- Automatic receipt numbers (`SW-00001`, `SW-00002`, …)
- Price and cost are frozen at time of sale so historical reports never change when you update a product later

### 5. Reports

- Date range filter with presets (Today / Last 7 days / Last 30 days / All time)
- Sales summary: Revenue, COGS, Gross profit, Transaction count
- Best-selling products ranked by units sold
- Current inventory valuation (cost value and retail value)
- Low-stock report with shortfall column

### 6. Data Management

- Export **Products**, **Sales**, and **Stock movements** to CSV (Excel/Google Sheets-ready, UTF-8 BOM, RFC 4180 CRLF)
- Reset demo data to the original fictional dataset (with confirmation)

---

## Tech Stack

- **React 19** + **TypeScript** — UI and type safety
- **Vite 8** — dev server and build tooling
- **Tailwind CSS 4** — responsive styling via `@tailwindcss/vite`
- **localStorage** — persistence (Phase 1 only; see Roadmap)

Money is stored as **integer ngwee** (ZMW minor units, `1 ZMW = 100 ngwee`). Financial calculations never use floating-point.

---

## Run Locally

```bash
git clone https://github.com/<your-username>/stockwise.git
cd stockwise
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The app seeds itself with fictional data on first load.

### Other scripts

```bash
npm run build       # production build
npm run typecheck   # TypeScript check without emitting
npm run lint        # ESLint
npm run preview     # serve the production build locally
```

---

## Business Logic

All business rules live in `src/domain/` and are framework-agnostic — they work with or without React.

| Concept            | Formula                                                         |
| ------------------ | --------------------------------------------------------------- |
| Current stock      | `opening stock + stock in − stock out`                          |
| Sales revenue      | `Σ (quantity sold × unit price)`                                |
| Cost of goods sold | `Σ (quantity sold × unit cost at time of sale)`                 |
| Gross profit       | `revenue − COGS` (excludes operating expenses — not net profit) |
| Inventory value    | `Σ (quantity on hand × current cost price)`                     |
| Low stock          | `quantity on hand ≤ reorder level`                              |

Prices and costs are snapshotted into `sale_items` at the moment of sale so historical reports don't drift when a product's price changes.

---

## Project Structure

```
stockwise/
├── src/
│   ├── app/App.tsx                # Shell: header, tab nav, route switch
│   ├── components/                # Reserved for shared UI primitives
│   ├── features/
│   │   ├── dashboard/             # DashboardPage
│   │   ├── products/              # ProductsPage
│   │   ├── inventory/             # InventoryPage
│   │   ├── sales/                 # SalesPage
│   │   ├── reports/               # ReportsPage
│   │   └── settings/              # SettingsPage
│   ├── domain/                    # Business rules — pure TS, no React
│   │   ├── types.ts
│   │   ├── inventory.ts
│   │   ├── sales.ts
│   │   └── reports.ts             # (reserved)
│   ├── data/                      # Fictional seed data
│   │   └── seed.ts
│   ├── services/                  # Persistence + export
│   │   ├── storage.ts
│   │   └── csvExport.ts
│   ├── lib/                       # Money helpers, shared utilities
│   │   └── money.ts
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig*.json
├── vite.config.ts
└── README.md
```

The separation between `domain/` (business rules) and `features/` (UI) means the storage layer can be swapped from `localStorage` to a real backend without touching any component.

---

## What's Built vs. What's Next

**Phase 1 (this repo):** local, single-user, `localStorage`-backed prototype. Complete and demonstrable end-to-end.

**Phase 2 (roadmap):**

- Multiple staff accounts and roles
- **Supabase + PostgreSQL** backend (types are already relational-shaped)
- Server-side transactional sale recording
- Barcode scanning
- Supplier purchase orders
- Receipt printing
- Cloud backup and multi-device access
- Mobile money / payment gateway integration
- Advanced analytics (monthly trends, category performance)

The `storage.ts` module is the only file that needs to change for Phase 2 — every component talks to `AppData`, not to `localStorage`.

---

## Known Limitations

- **Data is local to one browser.** Clearing browser storage, using a different browser, or opening in incognito loses all changes. Use **Settings → Export** to back up your data.
- **No authentication.** Single-user only.
- **Estimated valuation only.** Inventory value is `quantity × current cost price`, not a full accounting valuation (no FIFO/LIFO/weighted average).
- **No concurrency control.** Two tabs editing the same data will overwrite each other's changes on the last write.

These are intentional and matched to the spec's Phase 1 scope.

---

## License

MIT — see `LICENSE` file.

---

## Author

**Musona Mutale** — first portfolio project, targeting Zambian small-business retail.
