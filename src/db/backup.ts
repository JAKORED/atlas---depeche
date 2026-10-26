import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import postgres from "postgres";

export const KNOWN_TABLES = [
  "sources",
  "events",
  "source_items",
  "articles",
  "article_versions",
  "article_sources",
  "claims",
  "evidence",
  "fact_packs",
  "agent_runs",
  "audit_logs",
  "gazetteer_entries",
  "social_posts",
  "ad_companies",
  "ad_creatives",
  "ad_campaigns",
  "ad_placements",
  "ad_impressions",
  "ad_clicks",
  "ad_cost_log",
];

function escapeSqlValue(val: unknown): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
  if (typeof val === "number") return Number.isFinite(val) ? String(val) : "NULL";
  if (val instanceof Date) return `'${val.toISOString()}'`;
  if (typeof val === "object") {
    const jsonStr = JSON.stringify(val).replace(/'/g, "''");
    return `'${jsonStr}'::jsonb`;
  }
  const str = String(val).replace(/'/g, "''");
  return `'${str}'`;
}

async function runBackup() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set — specify it in .env or environment variable");
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.resolve(process.cwd(), "backups", `backup_${timestamp}`);
  fs.mkdirSync(backupDir, { recursive: true });

  console.log(`[backup] Target directory: ${backupDir}`);
  console.log(`[backup] Connecting to database...`);

  const sql = postgres(connectionString, { max: 2, connect_timeout: 10 });

  try {
    // 1. Get version and verify connectivity
    const versionRes = await sql`SELECT version();`;
    console.log(`[backup] Connected. Database engine: ${versionRes[0]?.version?.split(" ")[0] || "PostgreSQL"}`);

    // 2. Query available tables in public schema
    const tablesRes = await sql<{ table_name: string }[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    const availableTables = tablesRes.map((r) => r.table_name);
    console.log(`[backup] Discovered ${availableTables.length} tables in public schema.`);

    const manifest: {
      timestamp: string;
      totalTables: number;
      totalRows: number;
      files: Record<string, { sizeBytes: number; sha256: string }>;
      tables: Record<string, { rows: number; jsonFile: string; sha256: string }>;
    } = {
      timestamp: new Date().toISOString(),
      totalTables: 0,
      totalRows: 0,
      files: {},
      tables: {},
    };

    let grandTotalRows = 0;
    const sqlStatements: string[] = [
      `-- Atlas Depeche Database Backup`,
      `-- Generated: ${new Date().toISOString()}`,
      `-- Format: SQL INSERTs with ON CONFLICT DO NOTHING`,
      ``,
    ];

    // 3. Export each table to JSON and append to SQL
    for (const table of availableTables) {
      const rows = await sql.unsafe(`SELECT * FROM "${table}"`);
      const rowCount = rows.length;
      grandTotalRows += rowCount;

      // Write JSON
      const jsonFileName = `${table}.json`;
      const jsonFilePath = path.join(backupDir, jsonFileName);
      const jsonContent = JSON.stringify(rows, null, 2);
      fs.writeFileSync(jsonFilePath, jsonContent, "utf-8");

      const jsonHash = crypto.createHash("sha256").update(jsonContent).digest("hex");
      manifest.tables[table] = {
        rows: rowCount,
        jsonFile: jsonFileName,
        sha256: jsonHash,
      };
      manifest.files[jsonFileName] = {
        sizeBytes: Buffer.byteLength(jsonContent, "utf-8"),
        sha256: jsonHash,
      };

      // Generate SQL statements
      if (rows.length > 0) {
        sqlStatements.push(`-- Table: ${table} (${rowCount} rows)`);
        for (const row of rows) {
          const cols = Object.keys(row).map((k) => `"${k}"`).join(", ");
          const vals = Object.values(row).map(escapeSqlValue).join(", ");
          sqlStatements.push(`INSERT INTO "${table}" (${cols}) VALUES (${vals}) ON CONFLICT DO NOTHING;`);
        }
        sqlStatements.push("");
      }

      console.log(`[backup] -> ${table.padEnd(22)} : ${String(rowCount).padStart(6)} rows saved`);
    }

    // Write unified full_backup.sql
    const sqlContent = sqlStatements.join("\n");
    const sqlFilePath = path.join(backupDir, "full_backup.sql");
    fs.writeFileSync(sqlFilePath, sqlContent, "utf-8");
    const sqlHash = crypto.createHash("sha256").update(sqlContent).digest("hex");
    manifest.files["full_backup.sql"] = {
      sizeBytes: Buffer.byteLength(sqlContent, "utf-8"),
      sha256: sqlHash,
    };

    manifest.totalTables = availableTables.length;
    manifest.totalRows = grandTotalRows;

    const manifestContent = JSON.stringify(manifest, null, 2);
    const manifestPath = path.join(backupDir, "manifest.json");
    fs.writeFileSync(manifestPath, manifestContent, "utf-8");

    console.log(`[backup] Successfully completed. Total tables: ${manifest.totalTables}, Total rows: ${grandTotalRows}`);
    console.log(`[backup] Manifest written to ${manifestPath}`);
    console.log(`[backup] SQL dump written to ${sqlFilePath}`);
  } finally {
    await sql.end();
  }
}

runBackup().catch((err) => {
  console.error("[backup] Failed:", err.message);
  process.exit(1);
});
