import { useState } from "react";
import type { FormEvent } from "react";
import type { Product, Sale, StockMovement } from "../../domain/types";
import { recordSale } from "../../domain/sales";
import type { SaleLineInput } from "../../domain/sales";
import { formatZMW } from "../../lib/money";

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

const inputCls = "border rounded px-2 py-1 text-sm w-full";

export function SalesPage({ products, movements, sales, onChange }: Props) {
  const [selectedProductId, setSelectedProductId] = useState("");
  const [qty, setQty] = useState("");
  const [cart, setCart] = useState<SaleLineInput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    receipt: string;
    totalNgwee: number;
  } | null>(null);

  const activeProducts = products
    .filter((p) => p.active)
    .sort((a, b) => a.name.localeCompare(b.name));
  const productMap = new Map(products.map((p) => [p.id, p]));

  const cartTotal = cart.reduce((sum, line) => {
    const p = productMap.get(line.productId);
    return sum + (p ? p.sellingPriceNgwee * line.quantity : 0);
  }, 0);

  function addLine(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedProductId) {
      setError("Select a product");
      return;
    }
    const qtyNum = parseInt(qty, 10);
    if (!Number.isInteger(qtyNum) || qtyNum <= 0) {
      setError("Quantity must be a positive integer");
      return;
    }

    setCart((prev) => {
      const existing = prev.find((l) => l.productId === selectedProductId);
      if (existing) {
        return prev.map((l) =>
          l.productId === selectedProductId
            ? { ...l, quantity: l.quantity + qtyNum }
            : l,
        );
      }
      return [...prev, { productId: selectedProductId, quantity: qtyNum }];
    });

    setSelectedProductId("");
    setQty("");
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((l) => l.productId !== productId));
    setError(null);
    setSuccess(null);
  }

  function confirmSale() {
    setError(null);
    setSuccess(null);
    try {
      const result = recordSale(cart, products, movements, sales);
      onChange(result.products, result.movements, [...sales, result.sale]);
      setSuccess({
        receipt: result.sale.receiptNumber,
        totalNgwee: result.sale.totalNgwee,
      });
      setCart([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record sale");
    }
  }

  const sortedSales = [...sales]
    .sort((a, b) => b.soldAt.localeCompare(a.soldAt))
    .slice(0, 15);

  return (
    <div className="space-y-6">
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded p-3 text-sm">
          Sale recorded · <span className="font-mono">{success.receipt}</span> ·{" "}
          <strong>{formatZMW(success.totalNgwee)}</strong>
        </div>
      )}

      <div className="bg-white rounded-lg border p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">New sale</h2>
        <form
          onSubmit={addLine}
          className="grid grid-cols-1 md:grid-cols-3 gap-3"
        >
          <label className="flex flex-col gap-1 text-sm md:col-span-1">
            <span className="text-gray-700">Product</span>
            <select
              className={inputCls}
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
            >
              <option value="">— Select product —</option>
              {activeProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} · {p.name} ({formatZMW(p.sellingPriceNgwee)}, have{" "}
                  {p.quantity})
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-700">Quantity</span>
            <input
              className={inputCls}
              inputMode="numeric"
              placeholder="e.g. 2"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              className="bg-blue-600 text-white rounded px-4 py-2 text-sm"
            >
              Add line
            </button>
          </div>
        </form>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </div>

      <div className="bg-white rounded-lg border">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-sm font-semibold text-gray-700">
            Cart ({cart.length} line{cart.length === 1 ? "" : "s"})
          </h2>
          <span className="text-sm text-gray-700">
            Total: <strong>{formatZMW(cartTotal)}</strong>
          </span>
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2 text-right">Qty</th>
              <th className="px-3 py-2 text-right">Unit price</th>
              <th className="px-3 py-2 text-right">Line total</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {cart.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                  No lines yet — add a product above.
                </td>
              </tr>
            )}
            {cart.map((line) => {
              const p = productMap.get(line.productId);
              if (!p) return null;
              const lineTotal = p.sellingPriceNgwee * line.quantity;
              const overStock = line.quantity > p.quantity;
              return (
                <tr key={line.productId} className="border-t">
                  <td className="px-3 py-2">
                    <div>
                      {p.sku} · {p.name}
                    </div>
                    {overStock && (
                      <div className="text-xs text-red-600">
                        Only {p.quantity} in stock
                      </div>
                    )}
                  </td>
                  <td
                    className={`px-3 py-2 text-right ${
                      overStock ? "text-red-600 font-semibold" : ""
                    }`}
                  >
                    {line.quantity}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatZMW(p.sellingPriceNgwee)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatZMW(lineTotal)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      className="text-red-600 hover:underline text-sm"
                      onClick={() => removeLine(line.productId)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t flex justify-end">
          <button
            className="bg-blue-600 text-white rounded px-4 py-2 text-sm disabled:opacity-50"
            disabled={cart.length === 0}
            onClick={confirmSale}
          >
            Confirm sale
          </button>
        </div>
      </div>

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
              {sortedSales.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-6 text-center text-gray-500"
                  >
                    No sales yet.
                  </td>
                </tr>
              )}
              {sortedSales.map((s) => (
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
