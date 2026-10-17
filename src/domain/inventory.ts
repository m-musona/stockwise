import type { Product, StockMovement, MovementType } from "./types";
import { uid } from "../lib/money";

export function isLowStock(p: Product): boolean {
  return p.active && p.quantity <= p.reorderLevel;
}

export function totalUnitsInStock(products: Product[]): number {
  return products.filter((p) => p.active).reduce((s, p) => s + p.quantity, 0);
}

export function inventoryCostValue(products: Product[]): number {
  return products
    .filter((p) => p.active)
    .reduce((s, p) => s + p.quantity * p.costPriceNgwee, 0);
}

export function inventoryRetailValue(products: Product[]): number {
  return products
    .filter((p) => p.active)
    .reduce((s, p) => s + p.quantity * p.sellingPriceNgwee, 0);
}

export function lowStockProducts(products: Product[]): Product[] {
  return products.filter(isLowStock);
}

export interface ProductDraft {
  id?: string;
  sku: string;
  name: string;
  costPriceNgwee: number;
  sellingPriceNgwee: number;
  quantity: number;
  reorderLevel: number;
}

export function validateProductInput(
  draft: ProductDraft,
  existing: Product[],
): Record<string, string> {
  const errors: Record<string, string> = {};
  const sku = draft.sku.trim().toUpperCase();

  if (!sku) errors.sku = "SKU is required";
  else if (
    existing.some((p) => p.sku.toUpperCase() === sku && p.id !== draft.id)
  )
    errors.sku = "SKU already exists";

  if (!draft.name.trim()) errors.name = "Name is required";

  if (!Number.isInteger(draft.costPriceNgwee) || draft.costPriceNgwee < 0)
    errors.costPrice = "Cost must be a non-negative amount";

  if (!Number.isInteger(draft.sellingPriceNgwee) || draft.sellingPriceNgwee < 0)
    errors.sellingPrice = "Selling price must be a non-negative amount";

  if (!Number.isInteger(draft.quantity) || draft.quantity < 0)
    errors.quantity = "Quantity must be a non-negative integer";

  if (!Number.isInteger(draft.reorderLevel) || draft.reorderLevel < 0)
    errors.reorderLevel = "Reorder level must be a non-negative integer";

  return errors;
}

/** Applies a signed stock change and appends an audit movement. */
export function recordStockChange(
  products: Product[],
  movements: StockMovement[],
  productId: string,
  delta: number,
  type: MovementType,
  reason: string,
): { products: Product[]; movements: StockMovement[] } {
  const product = products.find((p) => p.id === productId);
  if (!product) throw new Error("Product not found");
  if (!Number.isInteger(delta) || delta === 0)
    throw new Error("Quantity change must be a non-zero integer");

  const nextQty = product.quantity + delta;
  if (nextQty < 0) throw new Error("Stock cannot go negative");

  const updatedProducts = products.map((p) =>
    p.id === productId ? { ...p, quantity: nextQty } : p,
  );

  const movement: StockMovement = {
    id: uid(),
    productId,
    type,
    quantityChange: delta,
    reason,
    createdAt: new Date().toISOString(),
  };

  return { products: updatedProducts, movements: [...movements, movement] };
}
