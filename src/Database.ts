// src/Database.ts
import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("crops.db");

export interface Crop {
  id: number;
  cropName: string;
  harvestDate: string;
  quantity: number;
  location: string;
  boundary?: string;
  locationName?: string;
}

export async function initDB() {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS crops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cropName TEXT,
      location TEXT,
      harvestDate TEXT,
      quantity INTEGER,
      boundary TEXT
    );
  `);
}

export async function addCrop(cropName: string, location: string, harvestDate: string, quantity: number, boundary: string) {
  await db.runAsync(
    `INSERT INTO crops (cropName, location, harvestDate, quantity, boundary) VALUES (?, ?, ?, ?, ?)`,
    [cropName, location, harvestDate, quantity, boundary]
  );
}

export async function deleteCrop(cropId: number) {
  const result = await db.runAsync(
    `DELETE FROM crops WHERE id = ?;`, {cropId}
  );
  console.log(result);
}

export async function getCrops() {
  return await db.getAllAsync("SELECT * FROM crops");
}

export async function getCropsList(): Promise<Crop[]> {
  const rows = await db.getAllAsync<any>(`SELECT * FROM crops`);

  return rows.map((row) => ({
    id: row.id,
    cropName: row.cropName,
    location: row.location,
    harvestDate: row.harvestDate,
    quantity: row.quantity,
    boundary: row.boundary
  })) as Crop[];
}
