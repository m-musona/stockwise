// src/features/products/ProductsPage.tsx

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { Product } from "../../domain/types";
import type { ProductDraft } from "../../domain/inventory";
import { isLowStock, validateProductInput } from "../../domain/inventory";
import { formatZMW, parseKwachaToNgwee, uid } from "../../lib/money";

interface Props {
  products: Product[];
  onChange: (products: Product[]) => void;
}

export function ProductsPage({ products, onChange }: Props) {
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [costStr, setCostStr] = useState("");
  const [sellingStr, setSellingStr] = useState("");
  const [quantityStr, setQuantityStr] = useState("");
  const [reorderStr, setReorderStr] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

  const editing = editingId
    ? (products.find((p) => p.id === editingId) ?? null)
    : null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q),
    );
  }, [products, search]);

  function resetForm() {
    setSku("");
    setName("");
    setCostStr("");
    setSellingStr("");
    setQuantityStr("");
    setReorderStr("");
    setEditingId(null);
    setErrors({});
  }

  function startEdit(p: Product) {
    setEditingId(p.id);
    setSku(p.sku);
    setName(p.name);
    setCostStr(String(p.costPriceNgwee / 100));
    setSellingStr(String(p.sellingPriceNgwee / 100));
    setQuantityStr(String(p.quantity));
    setReorderStr(String(p.reorderLevel));
    setErrors({});
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const draft: ProductDraft = {
      id: editing?.id,
      sku: sku.trim(),
      name: name.trim(),
      costPriceNgwee: parseKwachaToNgwee(costStr),
      sellingPriceNgwee: parseKwachaToNgwee(sellingStr),
      quantity: Number(quantityStr),
      reorderLevel: Number(reorderStr),
    };

    const errs = validateProductInput(draft, products);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const saved: Product = {
      id: editing ? editing.id : uid(),
      sku: draft.sku,
      name: draft.name,
      categoryId: editing ? editing.categoryId : null,
      costPriceNgwee: draft.costPriceNgwee,
      sellingPriceNgwee: draft.sellingPriceNgwee,
      quantity: draft.quantity,
      reorderLevel: draft.reorderLevel,
      active: editing ? editing.active : true,
    };

    const next = editing
      ? products.map((p) => (p.id === editing.id ? saved : p))
      : [...products, saved];

    onChange(next);
    resetForm();
  }

  const fieldClass =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const errClass = "mt-1 text-xs text-red-600";

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
        <p className="mt-1 text-sm text-gray-500">
          {products.length} product{products.length === 1 ? "" : "s"} in your
          catalogue.
        </p>
      </header>

      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              {editing ? "Edit product" : "Add product"}
            </h2>
            <p className="text-xs text-gray-500">
              {editing
                ? `Updating ${editing.name}`
                : "Enter the details below to add a new product."}
            </p>
          </div>
          {editing && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label htmlFor="prod-sku" className={labelClass}>
                <span>SKU</span>
              </label>
              <input
                id="prod-sku"
                className={fieldClass}
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. SUGAR-1KG"
              />
              {errors.sku && <p className={errClass}>{errors.sku}</p>}
            </div>

            <div>
              <label htmlFor="prod-name" className={labelClass}>
                <span>Name</span>
              </label>
              <input
                id="prod-name"
                className={fieldClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Product name"
              />
              {errors.name && <p className={errClass}>{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="prod-cost" className={labelClass}>
                <span>Cost (K)</span>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-gray-400">
                  K
                </span>
                <input
                  id="prod-cost"
                  inputMode="decimal"
                  className={`${fieldClass} pl-7`}
                  value={costStr}
                  onChange={(e) => setCostStr(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              {errors.costPrice && (
                <p className={errClass}>{errors.costPrice}</p>
              )}
            </div>

            <div>
              <label htmlFor="prod-selling" className={labelClass}>
                <span>Selling (K)</span>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-gray-400">
                  K
                </span>
                <input
                  id="prod-selling"
                  inputMode="decimal"
                  className={`${fieldClass} pl-7`}
                  value={sellingStr}
                  onChange={(e) => setSellingStr(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              {errors.sellingPrice && (
                <p className={errClass}>{errors.sellingPrice}</p>
              )}
            </div>

            <div>
              <label htmlFor="prod-qty" className={labelClass}>
                <span>Quantity</span>
              </label>
              <input
                id="prod-qty"
                inputMode="numeric"
                className={fieldClass}
                value={quantityStr}
                onChange={(e) => setQuantityStr(e.target.value)}
                placeholder="0"
              />
              {errors.quantity && <p className={errClass}>{errors.quantity}</p>}
            </div>

            <div>
              <label htmlFor="prod-reorder" className={labelClass}>
                <span>Reorder level</span>
              </label>
              <input
                id="prod-reorder"
                inputMode="numeric"
                className={fieldClass}
                value={reorderStr}
                onChange={(e) => setReorderStr(e.target.value)}
                placeholder="0"
              />
              {errors.reorderLevel && (
                <p className={errClass}>{errors.reorderLevel}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {editing ? "Save changes" : "Add product"}
            </button>
            {editing && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
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
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          aria-label="Search products by SKU or name"
          className={`${fieldClass} pl-9`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by SKU or name…"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
          <p className="text-sm text-gray-500">
            {products.length === 0
              ? "No products yet. Add your first product above."
              : "No products match your search."}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm sm:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3 text-right">Cost</th>
                    <th className="px-4 py-3 text-right">Selling</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Reorder</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((p) => {
                    const low = isLowStock(p);
                    return (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-gray-700">
                          {p.sku}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {p.name}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          {formatZMW(p.costPriceNgwee)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          {formatZMW(p.sellingPriceNgwee)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900">
                          {p.quantity}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500">
                          {p.reorderLevel}
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
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => startEdit(p)}
                            aria-label={`Edit ${p.name}`}
                            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                            </svg>
                            <span className="ml-1">Edit</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-3 sm:hidden">
            {filtered.map((p) => {
              const low = isLowStock(p);
              return (
                <div
                  key={p.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-gray-500">{p.sku}</p>
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {p.name}
                      </p>
                    </div>
                    {low ? (
                      <span className="inline-flex shrink-0 items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                        Low
                      </span>
                    ) : (
                      <span className="inline-flex shrink-0 items-center rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        OK
                      </span>
                    )}
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <dt className="text-gray-500">Cost</dt>
                    <dd className="text-right text-gray-700">
                      {formatZMW(p.costPriceNgwee)}
                    </dd>
                    <dt className="text-gray-500">Selling</dt>
                    <dd className="text-right text-gray-700">
                      {formatZMW(p.sellingPriceNgwee)}
                    </dd>
                    <dt className="text-gray-500">On hand</dt>
                    <dd className="text-right text-gray-900">{p.quantity}</dd>
                    <dt className="text-gray-500">Reorder</dt>
                    <dd className="text-right text-gray-500">
                      {p.reorderLevel}
                    </dd>
                  </dl>
                  <button
                    type="button"
                    onClick={() => startEdit(p)}
                    className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Edit
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
