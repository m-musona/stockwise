export type CategoryId = string;
export type ProductId = string;
export type SaleId = string;
export type MovementId = string;

export interface Category {
  id: CategoryId;
  name: string;
}

export interface Product {
  id: ProductId;
  sku: string;
  name: string;
  categoryId: CategoryId | null;
  costPriceNgwee: number; // integer ngwee (K1 = 100)
  sellingPriceNgwee: number; // integer ngwee
  quantity: number;
  reorderLevel: number;
  active: boolean;
}

export type MovementType = "opening" | "stock_in" | "sale" | "adjustment";

export interface StockMovement {
  id: MovementId;
  productId: ProductId;
  type: MovementType;
  quantityChange: number; // signed
  reason: string;
  createdAt: string; // ISO
  saleId?: SaleId;
}

export interface SaleItem {
  productId: ProductId;
  quantity: number;
  unitPriceNgwee: number;
  unitCostNgwee: number;
  lineTotalNgwee: number;
}

export type SaleStatus = "completed" | "voided";

export interface Sale {
  id: SaleId;
  receiptNumber: string;
  soldAt: string;
  totalNgwee: number;
  status: SaleStatus;
  items: SaleItem[];
}

/** Aggregate root persisted by the storage adapter. */
export interface AppData {
  version: number;
  categories: Category[];
  products: Product[];
  sales: Sale[];
  movements: StockMovement[];
}
