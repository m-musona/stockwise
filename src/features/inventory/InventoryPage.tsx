import { useState } from "react";
import type { FormEvent } from "react";
import type { Product, StockMovement } from "../../domain/types";
import { isLowStock, recordStockChange } from "../../domain/inventory";
import { formatZMW } from "../../lib/money";

interface Props {
  products: Product[];
  movements: StockMovement[];
  onChange: (products: Product[], movements: StockMovement[]) => void;
}

const inputCls = "border rounded px-2 py-1 text-sm w-full";

type Mode = "receive" | "adjust";

export function InventoryPage({ products, movements, onChange }: Props) {
  const [mode, setMode] = useState<Mode>("receive");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!productId) {
      setError("Select a product");
      return;
    }

    const qtyNum = parseInt(quantity, 10);
    if (!Number.isInteger(qtyNum) || qtyNum === 0) {
      setError("Quantity must be a non-zero integer");
      return;
    }

    const delta = mode === "receive" ? Math.abs(qtyNum) : qtyNum;
    const type = mode === "receive" ? "stock_in" : "adjustment";
    const finalReason =
      reason.trim() ||
      (mode === "receive" ? "Stock received" : "Manual adjustment");

    try {
      const result = recordStockChange(
        products,
        movements,
        productId,
        delta,
        type,
        finalReason,
      );
      onChange(result.products, result.movements);
      setSuccess(
        `${mode === "receive" ? "Received" : "Adjusted"} ${delta > 0 ? "+" : ""}${delta} unit(s)`,
      );
      setQuantity("");
      setReason("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to record movement",
      );
    }
  }

  const sortedProducts = [...products].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const sortedMovements = [...movements]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 20);
  const productMap = new Map(products.map((p) => [p.id, p]));

  return (
    <div className="space-y-6">
      {/* Action form */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setMode("receive")}
            className={`px-3 py-1 text-sm rounded ${
              mode === "receive" ? "bg-blue-600 text-white" : "border"
            }`}
          >
            Receive stock
          </button>
          <button
            type="button"
            onClick={() => setMode("adjust")}
            className={`px-3 py-1 text-sm rounded ${
              mode === "adjust" ? "bg-blue-600 text-white" : "border"
            }`}
          >
            Adjust stock
          </button>
        </div>

        <form
          onSubmit={submit}
          className="grid grid-cols-1 md:grid-cols-3 gap-3"
        >
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-700">Product</span>
            <select
              className={inputCls}
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="">— Select product —</option>
              {sortedProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} · {p.name} (have {p.quantity})
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-700">
              {mode === "receive" ? "Quantity received" : "Adjustment (+/-)"}
            </span>
            <input
              className={inputCls}
              inputMode="numeric"
              placeholder={mode === "receive" ? "e.g. 20" : "e.g. -3 or 5"}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-700">Reason (optional)</span>
            <input
              className={inputCls}
              placeholder={
                mode === "receive"
                  ? "e.g. Supplier delivery"
                  : "e.g. Damaged / expired"
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>

          <div className="md:col-span-3 flex items-center gap-3">
            <button
              type="submit"
              className="bg-blue-600 text-white rounded px-4 py-2 text-sm"
            >
              {mode === "receive" ? "Record stock in" : "Record adjustment"}
            </button>
            {error && <span className="text-red-600 text-sm">{error}</span>}
            {success && (
              <span className="text-green-700 text-sm">{success}</span>
            )}
          </div>
        </form>
      </div>

      {/* Current stock */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">
          Current stock
        </h2>
        <div className="overflow-x-auto bg-white rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2 text-right">On hand</th>
                <th className="px-3 py-2 text-right">Reorder</th>
                <th className="px-3 py-2 text-right">Value (cost)</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedProducts.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-3 py-2 font-mono">{p.sku}</td>
                  <td className="px-3 py-2">{p.name}</td>
                  <td className="px-3 py-2 text-right">{p.quantity}</td>
                  <td className="px-3 py-2 text-right">{p.reorderLevel}</td>
                  <td className="px-3 py-2 text-right">
                    {formatZMW(p.quantity * p.costPriceNgwee)}
                  </td>
                  <td className="px-3 py-2">
                    {isLowStock(p) ? (
                      <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-xs">
                        Low
                      </span>
                    ) : (
                      <span className="text-green-700 bg-green-50 px-2 py-0.5 rounded text-xs">
                        OK
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent movements */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">
          Recent movements
        </h2>
        <div className="overflow-x-auto bg-white rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2 text-right">Change</th>
                <th className="px-3 py-2">Reason</th>
              </tr>
            </thead>
            <tbody>
              {sortedMovements.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-6 text-center text-gray-500"
                  >
                    No movements yet.
                  </td>
                </tr>
              )}
              {sortedMovements.map((m) => {
                const p = productMap.get(m.productId);
                return (
                  <tr key={m.id} className="border-t">
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      {p ? `${p.sku} · ${p.name}` : "—"}
                    </td>
                    <td className="px-3 py-2">{m.type}</td>
                    <td
                      className={`px-3 py-2 text-right font-mono ${
                        m.quantityChange > 0 ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      {m.quantityChange > 0 ? "+" : ""}
                      {m.quantityChange}
                    </td>
                    <td className="px-3 py-2 text-gray-600">{m.reason}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
