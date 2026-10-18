// src/features/reports/ReportsPage.tsx

import { useMemo, useState } from "react";
import type { Product, Sale, SaleItem } from "../../domain/types";
import {
  inventoryCostValue,
  inventoryRetailValue,
  lowStockProducts,
} from "../../domain/inventory";
import { grossProfit, totalCOGS, totalRevenue } from "../../domain/sales";
import { formatZMW } from "../../lib/money";

type Preset = "today" | "7d" | "30d" | "all";

interface Props {
  products: Product[];
  sales: Sale[];
}

interface BestSellerRow {
  productId: string;
  name: string;
  sku: string;
  unitsSold: number;
  revenueNgwee: number;
}

/** Local-time YYYY-MM-DD (never use toISOString here — that would be UTC). */
function localDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function ReportsPage({ products, sales }: Props) {
  const today = new Date();
  const todayStr = localDateInputValue(today);
  const [from, setFrom] = useState<string>(todayStr);
  const [to, setTo] = useState<string>(todayStr);
  const [activePreset, setActivePreset] = useState<Preset | null>("today");

  function applyPreset(preset: Preset) {
    setActivePreset(preset);
    const now = new Date();
    if (preset === "today") {
      const t = localDateInputValue(now);
      setFrom(t);
      setTo(t);
    } else if (preset === "7d") {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      setFrom(localDateInputValue(start));
      setTo(localDateInputValue(now));
    } else if (preset === "30d") {
      const start = new Date(now);
      start.setDate(start.getDate() - 29);
      setFrom(localDateInputValue(start));
      setTo(localDateInputValue(now));
    } else {
      setFrom("");
      setTo("");
    }
  }

  const filteredSales = useMemo(() => {
    const fromTs = from ? new Date(`${from}T00:00:00`).getTime() : null;
    const toTs = to ? new Date(`${to}T23:59:59.999`).getTime() : null;
    return sales.filter((s) => {
      if (s.status !== "completed") return false;
      const t = new Date(s.soldAt).getTime();
      if (fromTs !== null && t < fromTs) return false;
      if (toTs !== null && t > toTs) return false;
      return true;
    });
  }, [sales, from, to]);

  const revenueNgwee = useMemo(
    () => totalRevenue(filteredSales),
    [filteredSales],
  );
  const cogsNgwee = useMemo(() => totalCOGS(filteredSales), [filteredSales]);
  const profitNgwee = useMemo(
    () => grossProfit(filteredSales),
    [filteredSales],
  );
  const transactionCount = filteredSales.length;

  const invCostValueNgwee = useMemo(
    () => inventoryCostValue(products),
    [products],
  );
  const invRetailValueNgwee = useMemo(
    () => inventoryRetailValue(products),
    [products],
  );
  const lowList = useMemo(() => lowStockProducts(products), [products]);

  const bestSellers = useMemo<BestSellerRow[]>(() => {
    const map = new Map<string, BestSellerRow>();
    const productMap = new Map<string, Product>();
    for (const p of products) productMap.set(p.id, p);

    const tally = (item: SaleItem) => {
      const existing = map.get(item.productId);
      const p = productMap.get(item.productId);
      if (existing) {
        existing.unitsSold += item.quantity;
        existing.revenueNgwee += item.lineTotalNgwee;
      } else {
        map.set(item.productId, {
          productId: item.productId,
          name: p ? p.name : "Unknown product",
          sku: p ? p.sku : "—",
          unitsSold: item.quantity,
          revenueNgwee: item.lineTotalNgwee,
        });
      }
    };

    for (const s of filteredSales) {
      for (const item of s.items) tally(item);
    }

    return [...map.values()].sort((a, b) => b.unitsSold - a.unitsSold);
  }, [filteredSales, products]);

  const fieldClass =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  const rangeLabel = from || to ? `${from || "…"} → ${to || "…"}` : "All time";

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
        <p className="mt-1 text-sm text-gray-500">
          Filter completed sales by date and review performance.
        </p>
      </header>

      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">Date range</h2>
          <p className="text-xs text-gray-500">{rangeLabel}</p>
        </div>
        <div className="px-4 py-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {(
              [
                { key: "today", label: "Today" },
                { key: "7d", label: "Last 7 days" },
                { key: "30d", label: "Last 30 days" },
                { key: "all", label: "All time" },
              ] as { key: Preset; label: string }[]
            ).map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => applyPreset(p.key)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  activePreset === p.key
                    ? "border border-blue-200 bg-blue-50 text-blue-700"
                    : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="rep-from" className={labelClass}>
                <span>From</span>
              </label>
              <input
                id="rep-from"
                type="date"
                className={fieldClass}
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setActivePreset(null);
                }}
              />
            </div>
            <div>
              <label htmlFor="rep-to" className={labelClass}>
                <span>To</span>
              </label>
              <input
                id="rep-to"
                type="date"
                className={fieldClass}
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setActivePreset(null);
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryStat
          label="Revenue"
          value={formatZMW(revenueNgwee)}
          accent="blue"
        />
        <SummaryStat label="COGS" value={formatZMW(cogsNgwee)} accent="gray" />
        <SummaryStat
          label="Gross profit"
          value={formatZMW(profitNgwee)}
          accent={profitNgwee >= 0 ? "green" : "red"}
        />
        <SummaryStat
          label="Transactions"
          value={String(transactionCount)}
          accent="gray"
        />
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SummaryStat
          label="Inventory value (cost)"
          value={formatZMW(invCostValueNgwee)}
          accent="gray"
          big
        />
        <SummaryStat
          label="Inventory value (retail)"
          value={formatZMW(invRetailValueNgwee)}
          accent="blue"
          big
        />
      </section>

      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">
            Best-selling products
          </h2>
          <p className="text-xs text-gray-500">
            By units sold in the selected range.
          </p>
        </div>
        {bestSellers.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-gray-500">
              No completed sales in this range.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3 text-right">Units sold</th>
                  <th className="px-4 py-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bestSellers.map((row, i) => {
                  const isTop3 = i < 3 && bestSellers.length >= 3;
                  const rankClasses = isTop3
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600";
                  return (
                    <tr
                      key={row.productId}
                      className={isTop3 ? "bg-blue-50/40" : "hover:bg-gray-50"}
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${rankClasses}`}
                        >
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {row.name}
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-600">
                        {row.sku}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900">
                        {row.unitsSold}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {formatZMW(row.revenueNgwee)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">
            Low-stock report
          </h2>
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
              lowList.length > 0
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-green-200 bg-green-50 text-green-700"
            }`}
          >
            {lowList.length} item{lowList.length === 1 ? "" : "s"}
          </span>
        </div>
        {lowList.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-gray-500">
              No products below reorder level.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3 text-right">On hand</th>
                  <th className="px-4 py-3 text-right">Reorder</th>
                  <th className="px-4 py-3 text-right">Shortfall</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lowList.map((p) => {
                  const shortfall = p.reorderLevel - p.quantity;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-gray-700">
                        {p.sku}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {p.name}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900">
                        {p.quantity}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">
                        {p.reorderLevel}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-base font-bold text-amber-700">
                          {shortfall}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryStat(props: {
  label: string;
  value: string;
  accent: "blue" | "gray" | "green" | "red";
  big?: boolean;
}) {
  const { label, value, accent, big } = props;
  const accentMap: Record<"blue" | "gray" | "green" | "red", string> = {
    blue: "text-blue-700",
    gray: "text-gray-900",
    green: "text-green-700",
    red: "text-red-700",
  };
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p
        className={`mt-1.5 font-bold ${accentMap[accent]} ${
          big ? "text-3xl" : "text-2xl"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
