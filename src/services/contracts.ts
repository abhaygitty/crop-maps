// src/services/contracts.ts
// Create and persist contract data. Wire this to your SQLite DB.

import * as SQLite from 'expo-sqlite';
// TODO: replace this with your existing db wrapper (db.runAsync etc.)
const db = SQLite.openDatabaseSync('app.db');

export async function createContract(contract: any) {
  // You should create a contracts table with fields to store JSON payload and metadata.
  // For now we will attempt to insert into a contracts table (create if missing).
  return new Promise<void>( async (resolve, reject) => {
    try {
        await db.withTransactionAsync(async () => {
            // Create the contracts table if it doesn't exist
            await db.execAsync(`
              CREATE TABLE IF NOT EXISTS contracts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                createdAt TEXT,
                payload TEXT,
                status TEXT
              );
            `);
      
            // Insert a new contract entry
            await db.runAsync(
              `INSERT INTO contracts (createdAt, payload, status) VALUES (?, ?, ?);`,
              [
                new Date().toISOString(),
                JSON.stringify(contract),
                contract.status || "pending",
              ]
            );
          });
      
          console.log("✅ Contract saved successfully");
    } catch (e) {
      console.error('createContract error', e);
      reject(e);
    }
  });
}
