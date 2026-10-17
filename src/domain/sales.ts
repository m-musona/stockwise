import type { Product, Sale, SaleItem, StockMovement } from "./types";
import { uid } from "../lib/money";

export function saleTotal(items: SaleItem[]): number {
  return items.reduce((s, i) => s + i.lineTotalNgwee, 0);
}

export function nextReceiptNumber(sales: Sale[]): string {
  return `SW-${String(sales.length + 1).padStart(5, "0")}`;
}

function withinRange(iso: string, from?: string, to?: string): boolean {
  if (from && iso < from) return false;
  if (to && iso > to) return false;
  return true;
}

export function totalRevenue(
  sales: Sale[],
  from?: string,
  to?: string,
): number {
  return sales
    .filter((s) => s.status === "completed" && withinRange(s.soldAt, from, to))
    .reduce((sum, s) => sum + s.totalNgwee, 0);
}

export function totalCOGS(sales: Sale[], from?: string, to?: string): number {
  return sales
    .filter((s) => s.status === "completed" && withinRange(s.soldAt, from, to))
    .reduce(
      (sum, s) =>
        sum + s.items.reduce((is, i) => is + i.quantity * i.unitCostNgwee, 0),
      0,
    );
}

export function grossProfit(sales: Sale[], from?: string, to?: string): number {
  return totalRevenue(sales, from, to) - totalCOGS(sales, from, to);
}

export interface SaleLineInput {
  productId: string;
  quantity: number;
}

export interface RecordSaleResult {
  sale: Sale;
  products: Product[];
  movements: StockMovement[];
}

/** Validates, deducts stock, snapshots prices, and returns updated state. */
export function recordSale(
  lines: SaleLineInput[],
  products: Product[],
  movements: StockMovement[],
  sales: Sale[],
  soldAt = new Date().toISOString(),
): RecordSaleResult {
  if (lines.length === 0)
    throw new Error("A sale must contain at least one line");

  const working = products.map((p) => ({ ...p }));
  const errors: string[] = [];
  const items: SaleItem[] = [];

  for (const line of lines) {
    const p = working.find((x) => x.id === line.productId);
    if (!p) {
      errors.push(`Unknown product ${line.productId}`);
      continue;
    }
    if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
      errors.push(`Invalid quantity for ${p.name}`);
      continue;
    }
    if (line.quantity > p.quantity) {
      errors.push(`Not enough stock for ${p.name} (have ${p.quantity})`);
      continue;
    }
    items.push({
      productId: p.id,
      quantity: line.quantity,
      unitPriceNgwee: p.sellingPriceNgwee,
      unitCostNgwee: p.costPriceNgwee,
      lineTotalNgwee: line.quantity * p.sellingPriceNgwee,
    });
  }

  if (errors.length) throw new Error(errors.join("; "));

  for (const item of items) {
    const p = working.find((x) => x.id === item.productId)!;
    p.quantity -= item.quantity;
  }

  const sale: Sale = {
    id: uid(),
    receiptNumber: nextReceiptNumber(sales),
    soldAt,
    totalNgwee: saleTotal(items),
    status: "completed",
    items,
  };

  const newMovements: StockMovement[] = items.map((i) => ({
    id: uid(),
    productId: i.productId,
    type: "sale",
    quantityChange: -i.quantity,
    reason: `Sale ${sale.receiptNumber}`,
    createdAt: soldAt,
    saleId: sale.id,
  }));

  return {
    sale,
    products: working,
    movements: [...movements, ...newMovements],
  };
}
