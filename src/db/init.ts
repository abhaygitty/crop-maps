import * as SQLite from "expo-sqlite";
import { cropSchema } from "./schema";
import { openDatabase } from "./db-backup-restore";

const db = openDatabase();

export async function ensureTable() {
    console.log("Ensuring crops table schema...");

    const columnDefs = Object.entries(cropSchema.columns)
        .map(([name, type]) => `${name} ${type}`)
        .join(", ");
    
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS ${cropSchema.tableName} (
            ${columnDefs}
        );    
    `);

    const existingColumns = await db.getAllAsync(
        `PRAGMA table_info(${cropSchema.tableName});`
    );

    const existingColumnNames = existingColumns.map((col: any) => col.name);
    const expectedColumns = Object.keys(cropSchema.columns);

    for(const column of expectedColumns) {
        if(!existingColumnNames.includes(column)) {
            const columnKey = column as keyof typeof cropSchema.columns;
            const columnType = cropSchema.columns[columnKey];
            console.log(`🧩 Adding missing column: ${column} ${columnType}`);
            await db.execAsync(
                `ALTER TABLE ${cropSchema.tableName} ADD COLUMN ${column} ${columnType};`
            );
        }
    }

    console.log("✅ crops table schema verified");
    return db;
}