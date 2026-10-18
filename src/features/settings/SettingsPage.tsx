// src/features/settings/SettingsPage.tsx

import type { AppData } from "../../domain/types";
import {
  exportMovementsCSV,
  exportProductsCSV,
  exportSalesCSV,
} from "../../services/csvExport";

const RESET_CONFIRM_MESSAGE =
  "Reset demo data to the original fictional dataset? This will erase any changes you have made.";

interface Props {
  data: AppData;
  onReset: () => void;
}

export function SettingsPage({ data, onReset }: Props) {
  const productCount = data.products.length;
  const salesCount = data.sales.length;
  const movementCount = data.movements.length;
  const totalRecords = productCount + salesCount + movementCount;

  function handleReset() {
    const ok = window.confirm(RESET_CONFIRM_MESSAGE);
    if (ok) onReset();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Export your data, reset the demo dataset, or review storage.
        </p>
      </header>

      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">Export data</h2>
          <p className="text-xs text-gray-500">
            Download each dataset as a CSV file.
          </p>
        </div>
        <div className="px-4 py-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ExportButton
            label="Products"
            sublabel={`${productCount} rows`}
            onClick={() => exportProductsCSV(data.products, data.categories)}
          />
          <ExportButton
            label="Sales"
            sublabel={`${salesCount} rows`}
            onClick={() => exportSalesCSV(data.sales, data.products)}
          />
          <ExportButton
            label="Movements"
            sublabel={`${movementCount} rows`}
            onClick={() => exportMovementsCSV(data.movements, data.products)}
          />
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">Demo data</h2>
          <p className="text-xs text-gray-500">
            Restore the original fictional dataset.
          </p>
        </div>
        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-600">
            This will erase any changes you have made to products, stock, and
            sales.
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
            Reset demo data
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">Storage</h2>
          <p className="text-xs text-gray-500">Local persistence details.</p>
        </div>
        <div className="px-4 py-4">
          <dl className="divide-y divide-gray-100">
            <StorageRow term="Storage key" value="stockwise:v1" mono />
            <StorageRow term="Product records" value={String(productCount)} />
            <StorageRow term="Sales records" value={String(salesCount)} />
            <StorageRow term="Movement records" value={String(movementCount)} />
            <StorageRow
              term="Total records"
              value={String(totalRecords)}
              bold
            />
          </dl>
        </div>
      </section>
    </div>
  );
}

function ExportButton(props: {
  label: string;
  sublabel: string;
  onClick: () => void;
}) {
  const { label, sublabel, onClick } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-white p-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <span>
        <span className="block text-sm font-semibold text-gray-900">
          {label}
        </span>
        <span className="block text-xs text-gray-500">{sublabel}</span>
      </span>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </span>
    </button>
  );
}

function StorageRow(props: {
  term: string;
  value: string;
  mono?: boolean;
  bold?: boolean;
}) {
  const { term, value, mono, bold } = props;
  return (
    <div className="flex items-center justify-between py-2.5">
      <dt className="text-sm text-gray-500">{term}</dt>
      <dd
        className={`text-sm ${mono ? "font-mono" : ""} ${
          bold ? "font-bold text-gray-900" : "text-gray-700"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
