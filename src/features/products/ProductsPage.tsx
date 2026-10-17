import { useState } from "react";
import type { ReactNode, FormEvent } from "react";
import type { Product } from "../../domain/types";
import { isLowStock, validateProductInput } from "../../domain/inventory";
import { formatZMW, parseKwachaToNgwee, uid } from "../../lib/money";

interface Props {
  products: Product[];
  onChange: (products: Product[]) => void;
}

interface FormState {
  id?: string;
  sku: string;
  name: string;
  costK: string;
  sellingK: string;
  quantity: string;
  reorderLevel: string;
  categoryId: string;
}

const emptyForm: FormState = {
  sku: "",
  name: "",
  costK: "",
  sellingK: "",
  quantity: "0",
  reorderLevel: "0",
  categoryId: "",
};

const inputCls = "border rounded px-2 py-1 text-sm";

export function ProductsPage({ products, onChange }: Props) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

  const q = search.toLowerCase();
  const filtered = products.filter(
    (p) => p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q),
  );

  function submit(e: FormEvent) {
    e.preventDefault();
    const candidate = {
      id: form.id,
      sku: form.sku,
      name: form.name,
      costPriceNgwee: parseKwachaToNgwee(form.costK),
      sellingPriceNgwee: parseKwachaToNgwee(form.sellingK),
      quantity: parseInt(form.quantity || "0", 10),
      reorderLevel: parseInt(form.reorderLevel || "0", 10),
    };
    const errs = validateProductInput(candidate, products);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    if (form.id) {
      onChange(
        products.map((p) =>
          p.id === form.id
            ? {
                ...p,
                sku: form.sku.trim().toUpperCase(),
                name: form.name.trim(),
                categoryId: form.categoryId || null,
                costPriceNgwee: candidate.costPriceNgwee,
                sellingPriceNgwee: candidate.sellingPriceNgwee,
                quantity: candidate.quantity,
                reorderLevel: candidate.reorderLevel,
              }
            : p,
        ),
      );
    } else {
      onChange([
        ...products,
        {
          id: uid(),
          sku: form.sku.trim().toUpperCase(),
          name: form.name.trim(),
          categoryId: form.categoryId || null,
          costPriceNgwee: candidate.costPriceNgwee,
          sellingPriceNgwee: candidate.sellingPriceNgwee,
          quantity: candidate.quantity,
          reorderLevel: candidate.reorderLevel,
          active: true,
        },
      ]);
    }
    setForm(emptyForm);
    setErrors({});
  }

  function edit(p: Product) {
    setForm({
      id: p.id,
      sku: p.sku,
      name: p.name,
      costK: (p.costPriceNgwee / 100).toString(),
      sellingK: (p.sellingPriceNgwee / 100).toString(),
      quantity: p.quantity.toString(),
      reorderLevel: p.reorderLevel.toString(),
      categoryId: p.categoryId ?? "",
    });
    setErrors({});
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <input
          className={inputCls + " w-full sm:w-64"}
          placeholder="Search by SKU or name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="text-sm text-gray-600">
          {filtered.length} product(s)
        </span>
      </div>

      <form
        onSubmit={submit}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 rounded-lg border"
      >
        <Field label="SKU" error={errors.sku}>
          <input
            className={inputCls}
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
          />
        </Field>
        <Field label="Name" error={errors.name}>
          <input
            className={inputCls}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <Field label="Cost (K)" error={errors.costPrice}>
          <input
            className={inputCls}
            inputMode="decimal"
            value={form.costK}
            onChange={(e) => setForm({ ...form, costK: e.target.value })}
          />
        </Field>
        <Field label="Selling (K)" error={errors.sellingPrice}>
          <input
            className={inputCls}
            inputMode="decimal"
            value={form.sellingK}
            onChange={(e) => setForm({ ...form, sellingK: e.target.value })}
          />
        </Field>
        <Field label="Quantity" error={errors.quantity}>
          <input
            className={inputCls}
            inputMode="numeric"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          />
        </Field>
        <Field label="Reorder level" error={errors.reorderLevel}>
          <input
            className={inputCls}
            inputMode="numeric"
            value={form.reorderLevel}
            onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })}
          />
        </Field>
        <div className="flex items-end gap-2 lg:col-span-2">
          <button
            type="submit"
            className="bg-blue-600 text-white rounded px-4 py-2 text-sm"
          >
            {form.id ? "Save changes" : "Add product"}
          </button>
          {form.id && (
            <button
              type="button"
              className="border rounded px-4 py-2 text-sm"
              onClick={() => {
                setForm(emptyForm);
                setErrors({});
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="overflow-x-auto bg-white rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-3 py-2">SKU</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Cost</th>
              <th className="px-3 py-2">Selling</th>
              <th className="px-3 py-2">Qty</th>
              <th className="px-3 py-2">Reorder</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-3 py-2 font-mono">{p.sku}</td>
                <td className="px-3 py-2">{p.name}</td>
                <td className="px-3 py-2">{formatZMW(p.costPriceNgwee)}</td>
                <td className="px-3 py-2">{formatZMW(p.sellingPriceNgwee)}</td>
                <td className="px-3 py-2">{p.quantity}</td>
                <td className="px-3 py-2">{p.reorderLevel}</td>
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
                <td className="px-3 py-2 text-right">
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() => edit(p)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-gray-500">
                  No products match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-gray-700">{label}</span>
      {children}
      {error && <span className="text-red-600 text-xs">{error}</span>}
    </label>
  );
}
