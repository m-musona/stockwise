// src/features/dashboard/DashboardPage.tsx

import { useMemo } from "react";
import type { ReactNode } from "react";
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
  const activeProducts = useMemo(
    () => products.filter((p) => p.active),
    [products],
  );
  const unitsInStock = useMemo(() => totalUnitsInStock(products), [products]);
  const inventoryValueNgwee = useMemo(
    () => inventoryCostValue(products),
    [products],
  );
  const lowList = useMemo(() => lowStockProducts(products), [products]);
  const lowCount = lowList.length;

  const { todayRevenueNgwee, dailyBuckets } = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );
    const todayRevenue = totalRevenue(
      sales,
      startOfDay.toISOString(),
      endOfDay.toISOString(),
    );

    const buckets: { label: string; date: Date; revenueNgwee: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - i,
        0,
        0,
        0,
        0,
      );
      const dStart = new Date(day);
      const dEnd = new Date(
        day.getFullYear(),
        day.getMonth(),
        day.getDate(),
        23,
        59,
        59,
        999,
      );
      const rev = totalRevenue(sales, dStart.toISOString(), dEnd.toISOString());
      buckets.push({
        label: day.toLocaleDateString(undefined, { weekday: "short" }),
        date: day,
        revenueNgwee: rev,
      });
    }
    return { todayRevenueNgwee: todayRevenue, dailyBuckets: buckets };
  }, [sales]);

  const recentSales = useMemo(() => {
    return [...sales]
      .sort((a, b) => (a.soldAt < b.soldAt ? 1 : -1))
      .slice(0, 5);
  }, [sales]);

  const maxBarNgwee = Math.max(1, ...dailyBuckets.map((b) => b.revenueNgwee));
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">{todayLabel}</p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <SummaryCard
          label="Today's revenue"
          value={formatZMW(todayRevenueNgwee)}
          accent="blue"
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
        <SummaryCard
          label="Products (active)"
          value={String(activeProducts.length)}
          accent="gray"
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.91 8.84 8.56 2.23a1.93 1.93 0 0 0-1.66 0L2.6 4.45a1.93 1.93 0 0 0 0 3.42l12.35 6.61a1.93 1.93 0 0 0 1.66 0l4.3-2.22a1.93 1.93 0 0 0 0-3.42Z" />
              <path d="m22 8.86-7.54 4.04a1.93 1.93 0 0 1-1.66 0L2 8.86" />
              <path d="m22 11.86-9.54 4.84a1.93 1.93 0 0 1-1.66 0L2 11.86" />
              <path d="M13 22V8" />
            </svg>
          }
        />
        <SummaryCard
          label="Units in stock"
          value={String(unitsInStock)}
          accent="gray"
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              <path d="M3.27 6.96 12 12.01l8.73-5.05" />
              <path d="M12 22.08V12" />
            </svg>
          }
        />
        <SummaryCard
          label="Inventory value"
          value={formatZMW(inventoryValueNgwee)}
          accent="gray"
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 3v18h18" />
              <path d="M7 14l3-3 3 3 4-4" />
            </svg>
          }
        />
        <SummaryCard
          label="Low stock"
          value={String(lowCount)}
          accent={lowCount > 0 ? "amber" : "green"}
          icon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          }
        />
      </section>

      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">
            Revenue — last 7 days
          </h2>
        </div>
        <div className="px-4 py-5">
          <div className="flex items-end justify-between gap-2 h-48">
            {dailyBuckets.map((b, i) => {
              const heightPct = (b.revenueNgwee / maxBarNgwee) * 100;
              const isToday = i === dailyBuckets.length - 1;
              return (
                <div
                  key={i}
                  className="group relative flex flex-1 flex-col items-center justify-end h-full"
                >
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs font-medium text-white shadow">
                    {formatZMW(b.revenueNgwee)}
                  </div>
                  <span className="mb-1 text-[11px] font-medium text-gray-500">
                    {b.revenueNgwee > 0 ? formatZMW(b.revenueNgwee) : "—"}
                  </span>
                  <div
                    className={`w-full rounded-t-md transition-colors ${
                      isToday
                        ? "bg-blue-600"
                        : "bg-blue-200 group-hover:bg-blue-300"
                    }`}
                    style={{
                      height: `${Math.max(heightPct, b.revenueNgwee > 0 ? 4 : 1)}%`,
                    }}
                  />
                  <span
                    className={`mt-2 text-xs ${
                      isToday ? "font-semibold text-gray-900" : "text-gray-500"
                    }`}
                  >
                    {b.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-900">Low stock</h2>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                lowCount > 0
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-green-200 bg-green-50 text-green-700"
              }`}
            >
              {lowCount} item{lowCount === 1 ? "" : "s"}
            </span>
          </div>
          {lowList.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm text-gray-500">
                All products are above their reorder level.
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lowList.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-gray-700">
                        {p.sku}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {p.name}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-amber-700">
                        {p.quantity}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">
                        {p.reorderLevel}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-900">
              Recent sales
            </h2>
          </div>
          {recentSales.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm text-gray-500">No sales recorded yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3">Receipt</th>
                    <th className="px-4 py-3">When</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentSales.map((s) => (
                    <tr
                      key={s.id}
                      className={
                        s.status === "voided"
                          ? "opacity-60"
                          : "hover:bg-gray-50"
                      }
                    >
                      <td className="px-4 py-3 font-mono text-gray-900">
                        {s.receiptNumber}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                        {new Date(s.soldAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {formatZMW(s.totalNgwee)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">Quick actions</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 px-4 py-4 sm:grid-cols-3">
          <QuickAction
            label="Manage products"
            description="Add, edit and search your catalogue"
            onClick={() => onNavigate("products")}
            icon={
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.91 8.84 8.56 2.23a1.93 1.93 0 0 0-1.66 0L2.6 4.45a1.93 1.93 0 0 0 0 3.42l12.35 6.61a1.93 1.93 0 0 0 1.66 0l4.3-2.22a1.93 1.93 0 0 0 0-3.42Z" />
                <path d="m22 8.86-9.54 4.84a1.93 1.93 0 0 1-1.66 0L2 8.86" />
              </svg>
            }
          />
          <QuickAction
            label="Receive stock"
            description="Record deliveries and adjustments"
            onClick={() => onNavigate("inventory")}
            icon={
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14" />
                <path d="M19 12l-7 7-7-7" />
              </svg>
            }
          />
          <QuickAction
            label="Make a sale"
            description="Ring up a new transaction"
            onClick={() => onNavigate("sales")}
            icon={
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            }
          />
        </div>
      </section>
    </div>
  );
}

function SummaryCard(props: {
  label: string;
  value: string;
  accent: "blue" | "gray" | "amber" | "green";
  icon: ReactNode;
}) {
  const { label, value, accent, icon } = props;
  const accentMap: Record<"blue" | "gray" | "amber" | "green", string> = {
    blue: "bg-blue-50 text-blue-600",
    gray: "bg-gray-100 text-gray-500",
    amber: "bg-amber-50 text-amber-600",
    green: "bg-green-50 text-green-600",
  };
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {label}
        </span>
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-md ${accentMap[accent]}`}
        >
          {icon}
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function QuickAction(props: {
  label: string;
  description: string;
  onClick: () => void;
  icon: ReactNode;
}) {
  const { label, description, onClick, icon } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-start gap-3 rounded-md border border-gray-200 bg-white p-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
        {icon}
      </span>
      <span>
        <span className="block text-sm font-semibold text-gray-900">
          {label}
        </span>
        <span className="block text-xs text-gray-500">{description}</span>
      </span>
    </button>
  );
}
