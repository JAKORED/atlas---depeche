import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

async function runRestore() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set — specify it in .env or environment variable");
  }

  const backupArg = process.argv[2];
  if (!backupArg) {
    throw new Error("Usage: tsx src/db/restore-backup.ts <path-to-backup-dir>");
  }

  const backupDir = path.resolve(process.cwd(), backupArg);
  const manifestPath = path.join(backupDir, "manifest.json");

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found at ${manifestPath}`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  console.log(`[restore] Validating manifest for backup from ${manifest.timestamp}...`);
  console.log(`[restore] Tables to restore: ${manifest.totalTables}, Total rows: ${manifest.totalRows}`);

  const sql = postgres(connectionString, { max: 1 });

  try {
    for (const [table, meta] of Object.entries<{ rows: number; file: string; sha256: string }>(manifest.tables)) {
      const filePath = path.join(backupDir, meta.file);
      if (!fs.existsSync(filePath)) {
        console.warn(`[restore] Skipping missing table file: ${filePath}`);
        continue;
      }

      const rows: Record<string, unknown>[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      if (rows.length === 0) {
        console.log(`[restore] -> ${table.padEnd(22)} : 0 rows (empty, skipped)`);
        continue;
      }

      console.log(`[restore] -> Restoring ${table} (${rows.length} rows)...`);
      await sql`BEGIN`;
      try {
        // Insert in batches of 100
        const batchSize = 100;
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize);
          await sql.unsafe(
            `INSERT INTO "${table}" ${sql(batch)} ON CONFLICT DO NOTHING`
          );
        }
        await sql`COMMIT`;
        console.log(`[restore] -> ${table.padEnd(22)} : Restored successfully.`);
      } catch (err: unknown) {
        await sql`ROLLBACK`;
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[restore] Failed restoring ${table}:`, message);
      }
    }

    console.log(`[restore] Restore completed.`);
  } finally {
    await sql.end();
  }
}

runRestore().catch((err) => {
  console.error("[restore] Failed:", err.message);
  process.exit(1);
});
