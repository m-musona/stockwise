export function formatZMW(ngwee: number): string {
  const kwacha = ngwee / 100;
  return `K${kwacha.toLocaleString("en-ZM", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function parseKwachaToNgwee(input: string): number {
  const cleaned = input.trim().replace(/[,\s]/g, "").replace(/^K/i, "");
  if (!cleaned) return NaN;
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return NaN;
  return Math.round(value * 100);
}

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
