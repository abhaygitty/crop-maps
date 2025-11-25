import * as SQLite from "expo-sqlite";
import * as FileSystem from "expo-file-system";

const DB_NAME = "crops.db";
const DB_PATH = `${FileSystem.documentDirectory}/SQLite/`;
const BACKUP_PATH = `${DB_PATH}/crops-backup.db`;
let db: SQLite.SQLiteDatabase | null = null; 

let backupTimeout: NodeJS.Timeout | null = null;
const BACKUP_DELAY_MS = 10_000; // 10 seconds debounce delay
let backupInProgress = false;
let pendingBackup = false;

export const openDatabase = (): SQLite.SQLiteDatabase => {
  if(!db) {
    db = SQLite.openDatabaseSync(DB_NAME);
  }
  return db;
};

const restoreDatabase = async () => {
  try {
    const backupExists = await FileSystem.getInfoAsync(BACKUP_PATH);
    if (backupExists.exists) {
      const dbPath = `${DB_PATH}${DB_NAME}`;
      await FileSystem.copyAsync({
        from: BACKUP_PATH,
        to: dbPath,
      });
      console.log("✅ Database restored from backup.");
    } else {
      console.log("ℹ️ No backup found. Starting fresh DB.");
    }
  } catch (error) {
    console.error("❌ Error restoring database:", error);
  }
};

const backupDatabase = async () => {
    if (backupInProgress) {
        // A backup is already running — schedule another run
        pendingBackup = true;
        return;
    }
    
    backupInProgress = true;
    try {
        const dbPath = `${DB_PATH}${DB_NAME}`;
        const dbExists = await FileSystem.getInfoAsync(dbPath);
        if (dbExists.exists) {
        await FileSystem.copyAsync({
            from: dbPath,
            to: BACKUP_PATH,
        });
        console.log("💾 Database backup completed.");
        }
    } catch (error) {
        console.error("❌ Error backing up database:", error);
    } finally {
        backupInProgress = false;
    
        // if a backup was queued while this one was running, execute it
        if (pendingBackup) {
          pendingBackup = false;
          await backupDatabase();
        }
    }
};

// --- Debounced backup scheduler ---
const scheduleBackup = () => {
  if (backupTimeout) {
    clearTimeout(backupTimeout);
  }
  backupTimeout = setTimeout(async () => {
    try {
        console.log("DB backup triggered...")
        await backupDatabase();
    } catch (err) {
        console.error("❌ Scheduled backup failed:", err);
    }
  }, BACKUP_DELAY_MS);
};

// --- Query wrapper with auto-backup ---
export const runQueryWithAutoBackup = async (
  db: SQLite.SQLiteDatabase,
  sql: string,
  params: any[] = []
) => {
    try {
        const result = await db.runAsync(sql, params);

        // Trigger debounced backup if data changes
        if (/^(INSERT|UPDATE|DELETE)/i.test(sql.trim())) {
            console.log("insert update or delete detected. Triggering backup...");
            scheduleBackup();
        }
        return result;
    } catch(error) {
        console.error("❌ SQL execution failed:", error);
    } 
};


// --- Lifecycle hook ---
export const useDatabaseLifecycle = async () => {
    let db: SQLite.SQLiteDatabase;

    (async () => {
      await restoreDatabase();
      db = openDatabase();
      console.log("📦 Database opened.");
    })();
};
