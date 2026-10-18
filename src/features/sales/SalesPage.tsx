// src/features/sales/SalesPage.tsx

import { useMemo, useState } from "react";
import type {
  Product,
  Sale,
  SaleItem,
  StockMovement,
} from "../../domain/types";
import { recordSale } from "../../domain/sales";
import type { SaleLineInput } from "../../domain/sales";
import { formatZMW } from "../../lib/money";

interface CartLine {
  productId: string;
  quantity: number;
}

interface Props {
  products: Product[];
  movements: StockMovement[];
  sales: Sale[];
  onChange: (
    products: Product[],
    movements: StockMovement[],
    sales: Sale[],
  ) => void;
}

export function SalesPage({ products, movements, sales, onChange }: Props) {
  const [productId, setProductId] = useState<string>("");
  const [qtyStr, setQtyStr] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  const productMap = useMemo(() => {
    const m = new Map<string, Product>();
    for (const p of products) m.set(p.id, p);
    return m;
  }, [products]);

  const recentSales = useMemo(() => {
    return [...sales]
      .sort((a, b) => (a.soldAt < b.soldAt ? 1 : -1))
      .slice(0, 10);
  }, [sales]);

  const cartItems = useMemo(() => {
    return cart.map((line) => {
      const p = productMap.get(line.productId);
      const over = p ? line.quantity > p.quantity : false;
      const unitPrice = p ? p.sellingPriceNgwee : 0;
      const lineTotal = unitPrice * line.quantity;
      return { line, product: p, over, unitPrice, lineTotal };
    });
  }, [cart, productMap]);

  const cartTotalNgwee = cartItems.reduce((sum, i) => sum + i.lineTotal, 0);

  function addLine() {
    setFeedback(null);
    if (!productId) {
      setFeedback({ kind: "error", message: "Choose a product first." });
      return;
    }
    const qty = Number(qtyStr);
    if (!Number.isFinite(qty) || qty <= 0) {
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
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.productId === productId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
        return next;
      }
      return [...prev, { productId, quantity: qty }];
    });
    setProductId("");
    setQtyStr("");
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((l) => l.productId !== productId));
  }

  function confirmSale() {
    setFeedback(null);
    if (cart.length === 0) {
      setFeedback({ kind: "error", message: "Cart is empty." });
      return;
    }

    const lines: SaleLineInput[] = cart.map((l) => ({
      productId: l.productId,
      quantity: l.quantity,
    }));

    try {
      const result = recordSale(lines, products, movements, sales);
      onChange(result.products, result.movements, [...sales, result.sale]);
      setFeedback({
        kind: "success",
        message: `Sale ${result.sale.receiptNumber} recorded — ${formatZMW(result.sale.totalNgwee)}.`,
      });
      setCart([]);
      setProductId("");
      setQtyStr("");
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
        <h1 className="text-2xl font-semibold text-gray-900">Sales</h1>
        <p className="mt-1 text-sm text-gray-500">
          Build a sale, confirm it, and review recent receipts.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3 rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-900">Add a line</h2>
            <p className="text-xs text-gray-500">
              Choosing an existing product adds to its quantity.
            </p>
          </div>
          <div className="px-4 py-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label htmlFor="sale-product" className={labelClass}>
                  <span>Product</span>
                </label>
                <select
                  id="sale-product"
                  className={fieldClass}
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                >
                  <option value="">Select a product…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.quantity <= 0}>
                      {p.sku} — {p.name} ({p.quantity} in stock)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="sale-qty" className={labelClass}>
                  <span>Quantity</span>
                </label>
                <input
                  id="sale-qty"
                  inputMode="numeric"
                  className={fieldClass}
                  value={qtyStr}
                  onChange={(e) => setQtyStr(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add line
            </button>
          </div>
        </section>

        <section className="lg:col-span-2 rounded-lg border border-gray-200 bg-white shadow-sm flex flex-col">
          <div className="border-b border-gray-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-900">Cart</h2>
            <p className="text-xs text-gray-500">{cart.length} line(s)</p>
          </div>

          <div className="px-4 py-4 flex-1">
            {cart.length === 0 ? (
              <div className="flex h-full min-h-35 flex-col items-center justify-center text-center">
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
                  className="text-gray-300"
                >
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                <p className="mt-2 text-sm text-gray-500">No lines yet.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {cartItems.map((item) => (
                  <li
                    key={item.line.productId}
                    className={`rounded-md border px-3 py-2.5 ${
                      item.over
                        ? "border-red-200 bg-red-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {item.product ? item.product.name : "Unknown product"}
                        </p>
                        <p className="font-mono text-xs text-gray-500">
                          {item.product ? item.product.sku : "—"}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label="Remove line"
                        onClick={() => removeLine(item.line.productId)}
                        className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
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
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {item.line.quantity} × {formatZMW(item.unitPrice)}
                      </span>
                      <span className="font-medium text-gray-900">
                        {formatZMW(item.lineTotal)}
                      </span>
                    </div>
                    {item.over && (
                      <p className="mt-1 text-xs font-medium text-red-700">
                        Only {item.product ? item.product.quantity : 0} in stock
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {cart.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-3 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-gray-500">Total</span>
                <span className="text-2xl font-bold text-gray-900">
                  {formatZMW(cartTotalNgwee)}
                </span>
              </div>
              <button
                type="button"
                onClick={confirmSale}
                className="inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Confirm sale
              </button>
            </div>
          )}
        </section>
      </div>

      {feedback && (
        <div
          role="alert"
          className={`flex items-start gap-2 rounded-md border px-4 py-3 text-sm ${
            feedback.kind === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {feedback.kind === "success" ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mt-0.5 shrink-0"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
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

      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">Recent sales</h2>
        </div>
        {recentSales.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-gray-500">No sales recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Receipt</th>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3 text-right">Items</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentSales.map((s) => (
                  <tr
                    key={s.id}
                    className={
                      s.status === "voided" ? "opacity-60" : "hover:bg-gray-50"
                    }
                  >
                    <td className="px-4 py-3 font-mono text-gray-900">
                      {s.receiptNumber}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                      {new Date(s.soldAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {countItems(s.items)}
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
  );
}

function countItems(items: SaleItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}
