/**
 * Restore a backup produced by `npm run db:backup`.
 *
 *   npm run db:restore -- backups/backup-<stamp>.json            # dry run
 *   npm run db:restore -- backups/backup-<stamp>.json --apply    # DESTRUCTIVE
 *
 * DESTRUCTIVE: --apply truncates every table listed in TABLES before reloading
 * them, inside one transaction — so a mid-way failure rolls back rather than
 * leaving the database half-restored. The schema must already exist; run
 * `prisma migrate deploy` first against an empty database.
 *
 * Identity sequences are re-set from the restored ids, otherwise the next
 * insert would collide with a restored primary key.
 */
import "dotenv/config";
import * as fs from "node:fs";
import { Client } from "pg";
import { TABLES } from "./tables";

type Backup = {
  meta: { takenAt: string; host: string; counts: Record<string, number> };
  data: Record<string, Record<string, unknown>[]>;
};

async function main() {
  const file = process.argv[2];
  const apply = process.argv.includes("--apply");
  if (!file) {
    console.error("usage: tsx prisma/restore-db.ts <backup.json> [--apply]");
    process.exit(1);
  }

  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DIRECT_URL / DATABASE_URL is not set");
  const target = new URL(connectionString).host;

  const backup: Backup = JSON.parse(fs.readFileSync(file, "utf8"));
  console.log(`backup taken ${backup.meta.takenAt} from ${backup.meta.host}`);
  console.log(`restore target: ${target}`);
  for (const t of TABLES) console.log(`  ${String(backup.data[t]?.length ?? 0).padStart(6)}  ${t}`);

  if (!apply) {
    console.log("\ndry run — pass --apply to overwrite the target (DESTRUCTIVE)");
    return;
  }

  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query("begin");
    await client.query(`truncate ${TABLES.map((t) => `"${t}"`).join(", ")} restart identity cascade`);

    for (const table of TABLES) {
      const rows = backup.data[table] ?? [];
      if (!rows.length) continue;
      const cols = Object.keys(rows[0]);
      const colList = cols.map((c) => `"${c}"`).join(", ");
      for (const row of rows) {
        const params = cols.map((c) => row[c] ?? null);
        const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
        await client.query(`insert into "${table}" (${colList}) values (${placeholders})`, params);
      }
      // realign the identity sequence with the restored ids
      if (cols.includes("id")) {
        await client.query(
          `select setval(pg_get_serial_sequence('"${table}"', 'id'),
                         coalesce((select max(id) from "${table}"), 1),
                         (select count(*) > 0 from "${table}"))`,
        );
      }
      console.log(`  restored ${String(rows.length).padStart(6)}  ${table}`);
    }

    await client.query("commit");
    console.log("\nrestore committed");
  } catch (err) {
    await client.query("rollback");
    console.error("\nrestore rolled back:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
