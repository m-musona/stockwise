import type { AppData } from "../domain/types";
import { createSeedData } from "../data/seed";

const STORAGE_KEY = "stockwise:v1";
const SCHEMA_VERSION = 1;

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = createSeedData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw) as AppData;
    if (parsed.version !== SCHEMA_VERSION) return createSeedData();
    return parsed;
  } catch {
    return createSeedData();
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function resetData(): AppData {
  const seed = createSeedData();
  saveData(seed);
  return seed;
}
