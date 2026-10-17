import { useMemo, useState } from "react";
import type { Product, Sale } from "../../domain/types";
import {
  inventoryCostValue,
  inventoryRetailValue,
  lowStockProducts,
} from "../../domain/inventory";
import { grossProfit, totalCOGS, totalRevenue } from "../../domain/sales";
import { formatZMW } from "../../lib/money";

interface Props {
  products: Product[];
  sales: Sale[];
}

const inputCls = "border rounded px-2 py-1 text-sm";

function toDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dayStart(dateInput: string): string {
  return new Date(`${dateInput}T00:00:00`).toISOString();
}

function dayEnd(dateInput: string): string {
  return new Date(`${dateInput}T23:59:59.999`).toISOString();
}

function saleInRange(s: Sale, fromIso?: string, toIso?: string): boolean {
  if (s.status !== "completed") return false;
  if (fromIso && s.soldAt < fromIso) return false;
  if (toIso && s.soldAt > toIso) return false;
  return true;
}

interface BestSeller {
  productId: string;
  quantity: number;
  revenueNgwee: number;
}

function bestSellers(sales: Sale[]): BestSeller[] {
  const map = new Map<string, BestSeller>();
  for (const s of sales) {
    for (const item of s.items) {
      const current = map.get(item.productId) ?? {
        productId: item.productId,
        quantity: 0,
        revenueNgwee: 0,
      };
      current.quantity += item.quantity;
      current.revenueNgwee += item.lineTotalNgwee;
      map.set(item.productId, current);
    }
  }
  return Array.from(map.values()).sort((a, b) => b.quantity - a.quantity);
}

export function ReportsPage({ products, sales }: Props) {
  const today = new Date();
  const defaultFrom = new Date();
  defaultFrom.setDate(defaultFrom.getDate() - 29);

  const [fromInput, setFromInput] = useState(toDateInput(defaultFrom));
  const [toInput, setToInput] = useState(toDateInput(today));

  const fromIso = fromInput ? dayStart(fromInput) : undefined;
  const toIso = toInput ? dayEnd(toInput) : undefined;

  const filteredSales = useMemo(
    () => sales.filter((s) => saleInRange(s, fromIso, toIso)),
    [sales, fromIso, toIso],
  );

  const revenue = totalRevenue(filteredSales);
  const cogs = totalCOGS(filteredSales);
  const profit = grossProfit(filteredSales);
  const transactionCount = filteredSales.length;

  const best = useMemo(() => bestSellers(filteredSales), [filteredSales]);
  const productMap = new Map(products.map((p) => [p.id, p]));

  const inventoryCost = inventoryCostValue(products);
  const inventoryRetail = inventoryRetailValue(products);
  const lowStock = lowStockProducts(products);

  function setPreset(preset: "today" | "7d" | "30d" | "all") {
    if (preset === "all") {
      setFromInput("");
      setToInput("");
      return;
    }
    const days = preset === "today" ? 1 : preset === "7d" ? 7 : 30;
    const t = new Date();
    const f = new Date();
    f.setDate(f.getDate() - (days - 1));
    setFromInput(toDateInput(f));
    setToInput(toDateInput(t));
  }

  return (
    <div className="space-y-6">
      {/* Date range */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-700">From</span>
            <input
              type="date"
              className={inputCls}
              value={fromInput}
              onChange={(e) => setFromInput(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-700">To</span>
            <input
              type="date"
              className={inputCls}
              value={toInput}
              onChange={(e) => setToInput(e.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              className="border rounded px-3 py-1 text-sm"
              onClick={() => setPreset("today")}
            >
              Today
            </button>
            <button
              className="border rounded px-3 py-1 text-sm"
              onClick={() => setPreset("7d")}
            >
              Last 7 days
            </button>
            <button
              className="border rounded px-3 py-1 text-sm"
              onClick={() => setPreset("30d")}
            >
              Last 30 days
            </button>
            <button
              className="border rounded px-3 py-1 text-sm"
              onClick={() => setPreset("all")}
            >
              All time
            </button>
          </div>
        </div>
      </div>

      {/* Sales summary */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">
          Sales summary{" "}
          {fromInput || toInput ? "(selected range)" : "(all time)"}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card label="Revenue" value={formatZMW(revenue)} />
          <Card label="Cost of goods sold" value={formatZMW(cogs)} />
          <Card label="Gross profit" value={formatZMW(profit)} />
          <Card label="Transactions" value={String(transactionCount)} />
        </div>
      </div>

      {/* Best sellers */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">
          Best-selling products
        </h2>
        <div className="overflow-x-auto bg-white rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2 text-right">Units sold</th>
                <th className="px-3 py-2 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {best.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-6 text-center text-gray-500"
                  >
                    No sales in the selected range.
                  </td>
                </tr>
              )}
              {best.map((b, idx) => {
                const p = productMap.get(b.productId);
                return (
                  <tr key={b.productId} className="border-t">
                    <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                    <td className="px-3 py-2 font-mono">{p ? p.sku : "—"}</td>
                    <td className="px-3 py-2">
                      {p ? p.name : "(removed product)"}
                    </td>
                    <td className="px-3 py-2 text-right">{b.quantity}</td>
                    <td className="px-3 py-2 text-right">
                      {formatZMW(b.revenueNgwee)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Current inventory valuation */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">
          Current inventory valuation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card
            label="Cost value (stock on hand × cost)"
            value={formatZMW(inventoryCost)}
          />
          <Card
            label="Retail value (stock on hand × selling)"
            value={formatZMW(inventoryRetail)}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Estimate using current recorded cost price — not a full accounting
          valuation.
        </p>
      </div>

      {/* Low stock */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">
          Low-stock report ({lowStock.length})
        </h2>
        <div className="overflow-x-auto bg-white rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2 text-right">On hand</th>
                <th className="px-3 py-2 text-right">Reorder</th>
                <th className="px-3 py-2 text-right">Shortfall</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-6 text-center text-gray-500"
                  >
                    All products above reorder level.
                  </td>
                </tr>
              )}
              {lowStock.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-3 py-2 font-mono">{p.sku}</td>
                  <td className="px-3 py-2">{p.name}</td>
                  <td className="px-3 py-2 text-right text-amber-700 font-semibold">
                    {p.quantity}
                  </td>
                  <td className="px-3 py-2 text-right">{p.reorderLevel}</td>
                  <td className="px-3 py-2 text-right">
                    {p.reorderLevel - p.quantity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg border p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}
