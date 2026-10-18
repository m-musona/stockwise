// src/features/inventory/InventoryPage.tsx

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { MovementType, Product, StockMovement } from "../../domain/types";
import { isLowStock, recordStockChange } from "../../domain/inventory";
import { formatZMW } from "../../lib/money";

type Mode = "receive" | "adjust";

interface Props {
  products: Product[];
  movements: StockMovement[];
  onChange: (products: Product[], movements: StockMovement[]) => void;
}

const TYPE_TAGS: Record<MovementType, { label: string; classes: string }> = {
  opening: {
    label: "Opening",
    classes: "border-gray-200 bg-gray-100 text-gray-600",
  },
  stock_in: {
    label: "Stock in",
    classes: "border-green-200 bg-green-50 text-green-700",
  },
  adjustment: {
    label: "Adjustment",
    classes: "border-blue-200 bg-blue-50 text-blue-700",
  },
  sale: { label: "Sale", classes: "border-red-200 bg-red-50 text-red-700" },
};

export function InventoryPage({ products, movements, onChange }: Props) {
  const [mode, setMode] = useState<Mode>("receive");
  const [productId, setProductId] = useState<string>("");
  const [qtyStr, setQtyStr] = useState("");
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  const productMap = useMemo(() => {
    const m = new Map<string, Product>();
    for (const p of products) m.set(p.id, p);
    return m;
  }, [products]);

  const recentMovements = useMemo(() => {
    return [...movements]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, 20);
  }, [movements]);

  function resetForm() {
    setProductId("");
    setQtyStr("");
    setReason("");
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);

    if (!productId) {
      setFeedback({ kind: "error", message: "Please choose a product." });
      return;
    }

    const qty = Number(qtyStr);
    if (!Number.isFinite(qty) || qty === 0) {
      setFeedback({ kind: "error", message: "Enter a valid quantity." });
      return;
    }
    if (!Number.isInteger(qty)) {
      setFeedback({
        kind: "error",
        message: "Quantity must be a whole number.",
      });
      return;
    }
    if (mode === "receive" && qty <= 0) {
      setFeedback({
        kind: "error",
        message: "Receive quantity must be positive.",
      });
      return;
    }

    const delta = mode === "receive" ? Math.abs(qty) : qty;
    const type: MovementType = mode === "receive" ? "stock_in" : "adjustment";

    try {
      const result = recordStockChange(
        products,
        movements,
        productId,
        delta,
        type,
        reason.trim() ||
          (mode === "receive" ? "Stock received" : "Stock adjustment"),
      );
      onChange(result.products, result.movements);
      const pname = productMap.get(productId)?.name ?? "Product";
      setFeedback({
        kind: "success",
        message: `${pname}: ${delta > 0 ? "+" : ""}${delta} unit${Math.abs(delta) === 1 ? "" : "s"} applied.`,
      });
      resetForm();
    } catch (err) {
      setFeedback({
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const fieldClass =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Inventory</h1>
        <p className="mt-1 text-sm text-gray-500">
          Receive new stock or adjust quantities, then review current levels and
          recent movements.
        </p>
      </header>

      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">
            Stock movement
          </h2>
          <p className="text-xs text-gray-500">
            Choose a mode, pick a product, and apply a quantity change.
          </p>
        </div>

        <div className="px-4 py-4 space-y-4">
          <div
            role="tablist"
            aria-label="Movement mode"
            className="inline-flex rounded-lg border border-gray-200 bg-gray-100 p-1"
          >
            {(["receive", "adjust"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => {
                  setMode(m);
                  setFeedback(null);
                }}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  mode === m
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {m === "receive" ? "Receive stock" : "Adjust stock"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <label htmlFor="inv-product" className={labelClass}>
                  <span>Product</span>
                </label>
                <select
                  id="inv-product"
                  className={fieldClass}
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                >
                  <option value="">Select a product…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} — {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="inv-qty" className={labelClass}>
                  <span>Quantity {mode === "adjust" ? "(signed)" : ""}</span>
                </label>
                <input
                  id="inv-qty"
                  inputMode="numeric"
                  className={fieldClass}
                  value={qtyStr}
                  onChange={(e) => setQtyStr(e.target.value)}
                  placeholder={mode === "adjust" ? "e.g. -3" : "0"}
                />
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="inv-reason" className={labelClass}>
                  <span>Reason (optional)</span>
                </label>
                <input
                  id="inv-reason"
                  className={fieldClass}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    mode === "receive" ? "Supplier delivery" : "Damaged stock"
                  }
                />
              </div>
            </div>

            {productId && productMap.get(productId) && (
              <p className="text-xs text-gray-500">
                Current on hand:{" "}
                <span className="font-medium text-gray-700">
                  {productMap.get(productId)!.quantity}
                </span>
              </p>
            )}

            {feedback && (
              <div
                role="alert"
                className={`flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm ${
                  feedback.kind === "success"
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {feedback.kind === "success" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mt-0.5 shrink-0"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mt-0.5 shrink-0"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {mode === "receive" ? "Receive stock" : "Apply adjustment"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">Current stock</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3 text-right">On hand</th>
                <th className="px-4 py-3 text-right">Reorder</th>
                <th className="px-4 py-3 text-right">Value (cost)</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-gray-500"
                  >
                    No products in stock yet.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const low = isLowStock(p);
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
                      <td className="px-4 py-3 text-right text-gray-700">
                        {formatZMW(p.costPriceNgwee * p.quantity)}
                      </td>
                      <td className="px-4 py-3">
                        {low ? (
                          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                            Low
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">
            Recent movements
          </h2>
          <p className="text-xs text-gray-500">Latest 20, newest first.</p>
        </div>
        {recentMovements.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto text-gray-300"
            >
              <path d="M3 12h4l3 9 4-18 3 9h4" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">
              No stock movements recorded yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Change</th>
                  <th className="px-4 py-3">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentMovements.map((m) => {
                  const tag = TYPE_TAGS[m.type];
                  const positive = m.quantityChange > 0;
                  const negative = m.quantityChange < 0;
                  return (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                        {new Date(m.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {productMap.get(m.productId)?.name ?? "Unknown product"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${tag.classes}`}
                        >
                          {tag.label}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-mono ${
                          positive
                            ? "text-green-700"
                            : negative
                              ? "text-red-700"
                              : "text-gray-500"
                        }`}
                      >
                        {positive ? "+" : ""}
                        {m.quantityChange}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{m.reason}</td>
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
