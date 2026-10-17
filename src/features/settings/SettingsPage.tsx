import type { AppData } from "../../domain/types";
import {
  exportMovementsCSV,
  exportProductsCSV,
  exportSalesCSV,
} from "../../services/csvExport";

interface Props {
  data: AppData;
  onReset: () => void;
}

export function SettingsPage({ data, onReset }: Props) {
  const totalRecords =
    data.products.length + data.sales.length + data.movements.length;

  return (
    <div className="space-y-6">
      {/* Export */}
      <div className="bg-white rounded-lg border p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">
          Export data
        </h2>
        <p className="text-xs text-gray-500 mb-3">
          Download your records as CSV. Each file opens directly in Excel,
          Google Sheets or LibreOffice.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            className="border rounded px-3 py-2 text-sm"
            onClick={() => exportProductsCSV(data.products, data.categories)}
          >
            Products ({data.products.length})
          </button>
          <button
            className="border rounded px-3 py-2 text-sm"
            onClick={() => exportSalesCSV(data.sales, data.products)}
          >
            Sales ({data.sales.length})
          </button>
          <button
            className="border rounded px-3 py-2 text-sm"
            onClick={() => exportMovementsCSV(data.movements, data.products)}
          >
            Stock movements ({data.movements.length})
          </button>
        </div>
      </div>

      {/* Demo data */}
      <div className="bg-white rounded-lg border p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Demo data</h2>
        <p className="text-xs text-gray-500 mb-3">
          Restore the original fictional Lusaka Mini Mart dataset. This erases
          all changes you have made in this browser.
        </p>
        <button
          className="border border-red-300 text-red-700 rounded px-3 py-2 text-sm"
          onClick={() => {
            if (
              confirm(
                "Reset demo data to the original fictional dataset? This will erase any changes you have made.",
              )
            ) {
              onReset();
            }
          }}
        >
          Reset demo data
        </button>
      </div>

      {/* Storage */}
      <div className="bg-white rounded-lg border p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Storage</h2>
        <dl className="grid grid-cols-2 gap-y-1 text-sm">
          <dt className="text-gray-500">Storage key</dt>
          <dd className="font-mono">stockwise:v1</dd>
          <dt className="text-gray-500">Products</dt>
          <dd>{data.products.length}</dd>
          <dt className="text-gray-500">Sales</dt>
          <dd>{data.sales.length}</dd>
          <dt className="text-gray-500">Stock movements</dt>
          <dd>{data.movements.length}</dd>
          <dt className="text-gray-500">Total records</dt>
          <dd>{totalRecords}</dd>
        </dl>
        <p className="text-xs text-gray-500 mt-3">
          Data is stored in this browser only. Clearing browser storage or
          opening the app in a different browser will start from a fresh demo
          dataset. For multi-device access, a real database
          (Supabase/PostgreSQL) is required — see Phase 2 of the architecture
          blueprint.
        </p>
      </div>
    </div>
  );
}
