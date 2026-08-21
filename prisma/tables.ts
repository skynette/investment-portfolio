/**
 * Table order for backup/restore, parents before children so a restore can
 * replay it under foreign-key constraints.
 *
 * Kept in its own module deliberately: backup-db.ts and restore-db.ts both run
 * work at import time, so importing one from the other would execute it.
 */
export const TABLES = [
  "Category",
  "CryptoAsset",
  "MonthlyEntry",
  "CryptoTransaction",
  "FxRate",
  "Setting",
] as const;
