/**
 * Dump every table to a single JSON file.
 *
 *   npm run db:backup                 # -> backups/backup-<timestamp>.json
 *   npm run db:backup -- <outfile>
 *
 * Uses the `pg` driver directly rather than Prisma so that `numeric` columns
 * come back as exact strings — routing Decimals through JS numbers would
 * silently round crypto amounts. Restore with `npm run db:restore`.
 *
 * Not a pg_dump replacement: this captures row data only, not schema. Recreate
 * the schema with `prisma migrate deploy`, then restore the rows.
 */
import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";
import { Client } from "pg";
import { TABLES } from "./tables";



async function main() {
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DIRECT_URL / DATABASE_URL is not set");

  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outFile = process.argv[2] ?? path.join("backups", `backup-${stamp}.json`);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });

  const client = new Client({ connectionString });
  await client.connect();

  const host = new URL(connectionString).host;
  const data: Record<string, unknown[]> = {};
  const counts: Record<string, number> = {};

  for (const table of TABLES) {
    const { rows } = await client.query(`select * from "${table}" order by 1`);
    data[table] = rows;
    counts[table] = rows.length;
  }

  let migration: string | null = null;
  try {
    const { rows } = await client.query(
      `select migration_name from "_prisma_migrations" where finished_at is not null order by finished_at desc limit 1`,
    );
    migration = rows[0]?.migration_name ?? null;
  } catch {
    // table absent on a bare database; not fatal for a data-only backup
  }

  const payload = {
    meta: {
      takenAt: new Date().toISOString(),
      host,
      serverVersion: (await client.query("show server_version")).rows[0].server_version,
      latestMigration: migration,
      counts,
    },
    data,
  };

  fs.writeFileSync(outFile, JSON.stringify(payload, null, 2));
  await client.end();

  const kb = (fs.statSync(outFile).size / 1024).toFixed(1);
  console.log(`backed up ${host} -> ${outFile} (${kb} KB)`);
  for (const t of TABLES) console.log(`  ${String(counts[t]).padStart(6)}  ${t}`);
}

main();
