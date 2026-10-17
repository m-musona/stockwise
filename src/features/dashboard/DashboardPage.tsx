import type { Product, Sale } from "../../domain/types";
import {
  inventoryCostValue,
  lowStockProducts,
  totalUnitsInStock,
} from "../../domain/inventory";
import { totalRevenue } from "../../domain/sales";
import { formatZMW } from "../../lib/money";

interface Props {
  products: Product[];
  sales: Sale[];
  onNavigate: (tab: "products" | "inventory" | "sales") => void;
}

export function DashboardPage({ products, sales, onNavigate }: Props) {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const todayRevenue = totalRevenue(
    sales,
    startOfDay.toISOString(),
    endOfDay.toISOString(),
  );

  const totalProducts = products.filter((p) => p.active).length;
  const unitsInStock = totalUnitsInStock(products);
  const inventoryValue = inventoryCostValue(products);
  const lowStock = lowStockProducts(products);

  // Revenue for the last 7 days (oldest → newest)
  const chartDays = Array.from({ length: 7 }, (_, i) => {
    const dayStart = new Date(now);
    dayStart.setDate(dayStart.getDate() - (6 - i));
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    const revenue = totalRevenue(
      sales,
      dayStart.toISOString(),
      dayEnd.toISOString(),
    );
    return {
      label: dayStart.toLocaleDateString(undefined, { weekday: "short" }),
      dateLabel: dayStart.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      revenue,
    };
  });
  const maxRevenue = Math.max(...chartDays.map((d) => d.revenue), 1);

  const recentSales = [...sales]
    .sort((a, b) => b.soldAt.localeCompare(a.soldAt))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onNavigate("products")}
          className="bg-blue-600 text-white rounded px-3 py-2 text-sm"
        >
          + Add product
        </button>
        <button
          onClick={() => onNavigate("inventory")}
          className="border rounded px-3 py-2 text-sm"
        >
          Receive stock
        </button>
        <button
          onClick={() => onNavigate("sales")}
          className="border rounded px-3 py-2 text-sm"
        >
          Record sale
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card label="Total products" value={String(totalProducts)} />
        <Card label="Units in stock" value={String(unitsInStock)} />
        <Card label="Inventory value" value={formatZMW(inventoryValue)} />
        <Card label="Today's revenue" value={formatZMW(todayRevenue)} />
        <Card
          label="Low-stock items"
          value={String(lowStock.length)}
          tone={lowStock.length > 0 ? "warn" : "ok"}
        />
      </div>

      {/* 7-day revenue chart */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">
            Revenue — last 7 days
          </h2>
          <span className="text-xs text-gray-500">
            Peak: {formatZMW(maxRevenue)}
          </span>
        </div>
        <div className="flex items-end gap-2 h-40">
          {chartDays.map((d) => {
            const heightPct = Math.round((d.revenue / maxRevenue) * 100);
            return (
              <div
                key={d.dateLabel}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div className="text-xs text-gray-700">
                  {d.revenue > 0 ? formatZMW(d.revenue) : "—"}
                </div>
                <div className="w-full flex items-end h-24 bg-gray-100 rounded">
                  <div
                    className="w-full bg-blue-500 rounded"
                    style={{
                      height: `${Math.max(heightPct, d.revenue > 0 ? 4 : 0)}%`,
                    }}
                  />
                </div>
                <div className="text-xs text-gray-500">{d.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Low-stock table */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">
          Low-stock alerts ({lowStock.length})
        </h2>
        <div className="overflow-x-auto bg-white rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2 text-right">On hand</th>
                <th className="px-3 py-2 text-right">Reorder</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
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
                  <td className="px-3 py-2 text-right text-gray-600">
                    {p.reorderLevel}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent sales */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">
          Recent sales
        </h2>
        <div className="overflow-x-auto bg-white rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-3 py-2">Receipt</th>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2 text-right">Items</th>
                <th className="px-3 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-6 text-center text-gray-500"
                  >
                    No sales yet.
                  </td>
                </tr>
              )}
              {recentSales.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="px-3 py-2 font-mono">{s.receiptNumber}</td>
                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                    {new Date(s.soldAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {s.items.reduce((n, i) => n + i.quantity, 0)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatZMW(s.totalNgwee)}
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

function Card({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "warn" | "ok";
}) {
  const toneCls =
    tone === "warn"
      ? "text-amber-700"
      : tone === "ok"
        ? "text-green-700"
        : "text-gray-900";
  return (
    <div className="bg-white rounded-lg border p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-xl font-semibold ${toneCls}`}>{value}</div>
    </div>
  );
}
