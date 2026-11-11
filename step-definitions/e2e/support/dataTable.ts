import type { DataTable } from "@cucumber/cucumber";

export function getRequiredTableValue(table: DataTable, key: string): string {
  const value = table.rowsHash()[key];
  if (value === undefined) {
    throw new Error(`Missing data table value: ${key}`);
  }
  return value;
}
