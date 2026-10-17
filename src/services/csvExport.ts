import type { Category, Product, Sale, StockMovement } from "../domain/types";

function escapeCSV(value: unknown): string {
  const s = value == null ? "" : String(value);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function dateStamp(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function downloadCSV(filename: string, headers: string[], rows: unknown[][]) {
  const lines = [
    headers.map(escapeCSV).join(","),
    ...rows.map((r) => r.map(escapeCSV).join(",")),
  ];
  // UTF-8 BOM so Excel detects encoding; CRLF per RFC 4180
  const csv = "\ufeff" + lines.join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportProductsCSV(
  products: Product[],
  categories: Category[],
): void {
  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const headers = [
    "SKU",
    "Name",
    "Category",
    "Cost (ZMW)",
    "Selling (ZMW)",
    "Quantity",
    "Reorder level",
    "Active",
    "Inventory value (ZMW)",
  ];
  const rows = products.map((p) => [
    p.sku,
    p.name,
    p.categoryId ? (catMap.get(p.categoryId) ?? "") : "",
    (p.costPriceNgwee / 100).toFixed(2),
    (p.sellingPriceNgwee / 100).toFixed(2),
    p.quantity,
    p.reorderLevel,
    p.active ? "yes" : "no",
    ((p.quantity * p.costPriceNgwee) / 100).toFixed(2),
  ]);
  downloadCSV(`stockwise-products-${dateStamp()}.csv`, headers, rows);
}

export function exportSalesCSV(sales: Sale[], products: Product[]): void {
  const productMap = new Map(products.map((p) => [p.id, p]));
  const headers = [
    "Receipt",
    "Date",
    "Status",
    "SKU",
    "Product",
    "Quantity",
    "Unit price (ZMW)",
    "Line total (ZMW)",
    "Sale total (ZMW)",
  ];
  const rows: unknown[][] = [];
  for (const s of sales) {
    for (const item of s.items) {
      const p = productMap.get(item.productId);
      rows.push([
        s.receiptNumber,
        new Date(s.soldAt).toISOString(),
        s.status,
        p ? p.sku : "",
        p ? p.name : "(removed product)",
        item.quantity,
        (item.unitPriceNgwee / 100).toFixed(2),
        (item.lineTotalNgwee / 100).toFixed(2),
        (s.totalNgwee / 100).toFixed(2),
      ]);
    }
  }
  downloadCSV(`stockwise-sales-${dateStamp()}.csv`, headers, rows);
}

export function exportMovementsCSV(
  movements: StockMovement[],
  products: Product[],
): void {
  const productMap = new Map(products.map((p) => [p.id, p]));
  const headers = ["Date", "Type", "SKU", "Product", "Change", "Reason"];
  const rows = [...movements]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((m) => {
      const p = productMap.get(m.productId);
      return [
        new Date(m.createdAt).toISOString(),
        m.type,
        p ? p.sku : "",
        p ? p.name : "(removed product)",
        m.quantityChange,
        m.reason,
      ];
    });
  downloadCSV(`stockwise-movements-${dateStamp()}.csv`, headers, rows);
}
