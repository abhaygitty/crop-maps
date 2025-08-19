// src/Database.ts
import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("crops.db");

export async function initDB() {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS crops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cropName TEXT,
      location TEXT,
      harvestDate TEXT,
      quantity INTEGER
    );
  `);
}

export async function addCrop(cropName: string, location: string, harvestDate: string, quantity: number) {
  await db.runAsync(
    `INSERT INTO crops (cropName, location, harvestDate, quantity) VALUES (?, ?, ?, ?)`,
    [cropName, location, harvestDate, quantity]
  );
}

export async function getCrops() {
  return await db.getAllAsync("SELECT * FROM crops");
}
