import { openDatabase, runQueryWithAutoBackup } from "./db-backup-restore";

const db = openDatabase();

export interface Crop {
  id: number;
  cropName: string;
  harvestDate: string;
  quantity: number;
  location: string;
  boundary?: string;
  locationName?: string;
}

export interface UserCrop {
  id: number;
  userId: number;
  cropId: number;
  relationshipRole: string;
  createdAt: string;
}

export async function resetDB() {
  console.log("Resetting crops table...");
  await db.execAsync(`
    DROP TABLE IF EXISTS crops;
  `);
  await initDB();
}

export async function migrateDB() {
  console.log("db migrate executed");
  const existingColumns = await db.getAllAsync(
    `PRAGMA table_info(crops);`
  );
  
  const hasLocationNameColumn = existingColumns.some((col: any) => col.name === "locationName");
  console.log(hasLocationNameColumn);
  if(!hasLocationNameColumn) {
    console.log("Adding new column: locationName");
    await db.execAsync(`ALTER TABLE crops ADD COLUMN locationName TEXT;`);
  }
}


async function initDB() {
  console.log("db init executed");

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS crops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cropName TEXT,
      location TEXT,
      harvestDate TEXT,
      quantity INTEGER,
      boundary TEXT,
      locationName TEXT
    );
  `);
}

export async function addCrop(userId: number, cropName: string, location: string, harvestDate: string, quantity: number, boundary: string, locationName: string) {
  const result = await runQueryWithAutoBackup(
    db,
    `INSERT INTO crops (cropName, location, harvestDate, quantity, boundary, locationName) VALUES (?, ?, ?, ?, ?, ?)`,
    [cropName, location, harvestDate, quantity, boundary, locationName]
  );

  const cropId = (result?.lastInsertRowId as number) ?? null;
  if(!cropId) {
    console.error("Could not retrieve lastInsertRowid for crops");
    return;
  }

  await db.runAsync(
    `INSERT INTO user_crops (userId, cropId, relationshipRole)
     VALUES (?, ?, ?)`,
     [userId, cropId, "owner"]
  );
}

export async function deleteCrop(cropId: number) {
  const result = await runQueryWithAutoBackup(
    db,
    `DELETE FROM crops WHERE id = ?;`, [cropId]
  );
  console.log(result);
}

export async function getAllUsers() {
  return await db.getAllAsync("select * from users");
}

export async function getAllUserCrops() {
  return await db.getAllAsync("select * from user_crops");
}

export async function getCropsForUser(userId: number) {
  const rows = await db.getAllAsync<any>(
    `SELECT c.*, uc.relationshipRole
    FROM crops c
    JOIN user_crops uc ON uc.cropId = c.id
    WHERE uc.userId = ?`,
    [userId]
  );
  return rows;
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
    boundary: row.boundary,
    locationName: row?.locationName,
  })) as Crop[];
}

export async function updateCropLocationName(cropId: number, locationName: string) {
  try {
    await runQueryWithAutoBackup(db,`UPDATE crops SET locationName = ? WHERE id = ?`, [locationName, cropId]);
    console.log(`Updated crop ${cropId} with locationName: ${locationName}`);
  } catch(error) {
    console.error("Failed to update locationName", error);
  }
}
