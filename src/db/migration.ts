import * as SQLite from "expo-sqlite";
import type { TableSchema } from "./schema";
import { openDatabase } from "./db-backup-restore";

const db = openDatabase();

export async function ensureAllTables(schemas: TableSchema[]) {
    for(const schema of schemas) {
        await ensureTable(schema);
    }
}

async function ensureTable(schema: TableSchema) {
    const { tableName, columns } = schema;
    const columnDefinitions = Object.entries(columns)
        .map(([name, type]) => `${name} ${type}`)
        .join(", ");

    await db.execAsync(
        `CREATE TABLE IF NOT EXISTS ${tableName} (${columnDefinitions});`
    );

    const existingColumns = await db.getAllAsync<{ name: string }>(
        `PRAGMA table_info(${tableName});`
    );

    const existingColNames = existingColumns.map((c) => c.name);

    // 3️⃣ Add new columns if any
    const expectedColumns = Object.keys(columns) as (keyof typeof columns)[];
    for (const column of expectedColumns) {
        if (!existingColNames.includes(column as string)) {
        const columnType = columns[column];
        console.log(`🧩 Adding missing column: ${column} ${columnType}`);
        await db.execAsync(
            `ALTER TABLE ${tableName} ADD COLUMN ${column} ${columnType};`
        );
        }
    }

    console.log(`✅ Table ensured: ${tableName}`);

}