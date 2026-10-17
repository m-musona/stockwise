import type {
  AppData,
  Category,
  Product,
  Sale,
  SaleItem,
  StockMovement,
} from "../domain/types";
import { uid } from "../lib/money";

const daysAgo = (days: number, hours = 0): string => {
  const t = new Date();
  t.setDate(t.getDate() - days);
  t.setHours(t.getHours() - hours);
  return t.toISOString();
};

export function createSeedData(): AppData {
  const categories: Category[] = [
    { id: "cat-drinks", name: "Drinks" },
    { id: "cat-food", name: "Food" },
    { id: "cat-hygiene", name: "Hygiene" },
  ];

  const products: Product[] = [
    {
      id: "prod-water",
      sku: "DRK001",
      name: "Bottled water",
      categoryId: "cat-drinks",
      costPriceNgwee: 500,
      sellingPriceNgwee: 800,
      quantity: 50,
      reorderLevel: 10,
      active: true,
    },
    {
      id: "prod-soft",
      sku: "DRK002",
      name: "Soft drink",
      categoryId: "cat-drinks",
      costPriceNgwee: 800,
      sellingPriceNgwee: 1200,
      quantity: 30,
      reorderLevel: 8,
      active: true,
    },
    {
      id: "prod-oil",
      sku: "FOD001",
      name: "Cooking oil, 1L",
      categoryId: "cat-food",
      costPriceNgwee: 2500,
      sellingPriceNgwee: 3200,
      quantity: 20,
      reorderLevel: 5,
      active: true,
    },
    {
      id: "prod-mealie",
      sku: "FOD002",
      name: "Mealie meal, 5kg",
      categoryId: "cat-food",
      costPriceNgwee: 9000,
      sellingPriceNgwee: 11000,
      quantity: 15,
      reorderLevel: 4,
      active: true,
    },
    {
      id: "prod-soap",
      sku: "HYG001",
      name: "Bathing soap",
      categoryId: "cat-hygiene",
      costPriceNgwee: 1000,
      sellingPriceNgwee: 1500,
      quantity: 25,
      reorderLevel: 6,
      active: true,
    },
    {
      id: "prod-washing",
      sku: "HYG002",
      name: "Washing powder",
      categoryId: "cat-hygiene",
      costPriceNgwee: 1800,
      sellingPriceNgwee: 2500,
      quantity: 12,
      reorderLevel: 4,
      active: true,
    },
  ];

  const movements: StockMovement[] = products.map((p) => ({
    id: uid(),
    productId: p.id,
    type: "opening",
    quantityChange: p.quantity,
    reason: "Opening stock",
    createdAt: daysAgo(7),
  }));

  const sales: Sale[] = [];

  // One sale leaves water low (7 ≤ 10), one leaves washing powder low (3 ≤ 4).
  const saleDefs = [
    { daysAgo: 2, hoursAgo: 3, items: [{ id: "prod-water", qty: 43 }] },
    {
      daysAgo: 1,
      hoursAgo: 5,
      items: [
        { id: "prod-soap", qty: 3 },
        { id: "prod-oil", qty: 2 },
        { id: "prod-mealie", qty: 1 },
      ],
    },
    {
      daysAgo: 0,
      hoursAgo: 1,
      items: [
        { id: "prod-soft", qty: 5 },
        { id: "prod-washing", qty: 9 },
      ],
    },
  ];

  saleDefs.forEach((def, idx) => {
    const soldAt = daysAgo(def.daysAgo, def.hoursAgo);
    const items: SaleItem[] = def.items.map(({ id, qty }) => {
      const p = products.find((x) => x.id === id)!;
      return {
        productId: p.id,
        quantity: qty,
        unitPriceNgwee: p.sellingPriceNgwee,
        unitCostNgwee: p.costPriceNgwee,
        lineTotalNgwee: qty * p.sellingPriceNgwee,
      };
    });

    const sale: Sale = {
      id: `sale-${idx + 1}`,
      receiptNumber: `SW-${String(idx + 1).padStart(5, "0")}`,
      soldAt,
      totalNgwee: items.reduce((s, i) => s + i.lineTotalNgwee, 0),
      status: "completed",
      items,
    };
    sales.push(sale);

    for (const item of items) {
      const p = products.find((x) => x.id === item.productId)!;
      p.quantity -= item.quantity;
      movements.push({
        id: uid(),
        productId: item.productId,
        type: "sale",
        quantityChange: -item.quantity,
        reason: `Sale ${sale.receiptNumber}`,
        createdAt: soldAt,
        saleId: sale.id,
      });
    }
  });

  return { version: 1, categories, products, sales, movements };
}
