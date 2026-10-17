import { useEffect, useState } from "react";
import type { AppData } from "../domain/types";
import { loadData, saveData, resetData } from "../services/storage";
import { ProductsPage } from "../features/products/ProductsPage";
import { InventoryPage } from "../features/inventory/InventoryPage";
import { SalesPage } from "../features/sales/SalesPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { ReportsPage } from "../features/reports/ReportsPage";
import { SettingsPage } from "../features/settings/SettingsPage";

type Tab =
  | "dashboard"
  | "products"
  | "inventory"
  | "sales"
  | "reports"
  | "settings";

const tabs: { id: Tab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "products", label: "Products" },
  { id: "inventory", label: "Inventory" },
  { id: "sales", label: "Sales" },
  { id: "reports", label: "Reports" },
  { id: "settings", label: "Settings" },
];

export function App() {
  const [data, setData] = useState<AppData>(() => loadData());
  const [tab, setTab] = useState<Tab>("products");

  useEffect(() => {
    saveData(data);
  }, [data]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">StockWise</h1>
            <p className="text-xs text-gray-500">
              Lusaka Mini Mart · demo data
            </p>
          </div>
          <button
            className="text-sm border rounded px-3 py-1"
            onClick={() => {
              if (
                confirm("Reset demo data to the original fictional dataset?")
              ) {
                setData(resetData());
              }
            }}
          >
            Reset demo
          </button>
        </div>
      </header>

      <nav className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-2 text-sm border-b-2 ${
                tab === t.id
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-gray-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {tab === "dashboard" && (
          <DashboardPage
            products={data.products}
            sales={data.sales}
            onNavigate={(t) => setTab(t)}
          />
        )}

        {tab === "products" && (
          <ProductsPage
            products={data.products}
            onChange={(products) => setData({ ...data, products })}
          />
        )}

        {tab === "inventory" && (
          <InventoryPage
            products={data.products}
            movements={data.movements}
            onChange={(products, movements) =>
              setData({ ...data, products, movements })
            }
          />
        )}

        {tab === "sales" && (
          <SalesPage
            products={data.products}
            movements={data.movements}
            sales={data.sales}
            onChange={(products, movements, sales) =>
              setData({ ...data, products, movements, sales })
            }
          />
        )}

        {tab === "reports" && (
          <ReportsPage products={data.products} sales={data.sales} />
        )}

        {tab === "settings" && (
          <SettingsPage data={data} onReset={() => setData(resetData())} />
        )}
      </main>
    </div>
  );
}
