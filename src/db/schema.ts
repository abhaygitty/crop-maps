export interface TableSchema {
    tableName: string;
    columns: Record<string, string>; // column name -> SQL type
}

export const cropSchema: TableSchema = {
    tableName: "crops",
    columns: {
        id: "INTEGER PRIMARY KEY AUTOINCREMENT",
        cropName: "TEXT",
        location: "TEXT",
        harvestDate: "TEXT",
        quantity: "INTEGER",
        boundary: "TEXT",
        locationName: "TEXT",
    },
};

export const userSchema: TableSchema = {
    tableName: "users",
    columns: {
      id: "INTEGER PRIMARY KEY AUTOINCREMENT",
      name: "TEXT",
      email: "TEXT",
      passwordHash: "TEXT",
      role: "TEXT CHECK(role IN ('farmer', 'buyer', 'admin')) NOT NULL",
      createdAt: "TEXT DEFAULT CURRENT_TIMESTAMP"
    },
  };
  
export const weatherSchema: TableSchema = {
    tableName: "weather",
    columns: {
        id: "INTEGER PRIMARY KEY AUTOINCREMENT",
        cropId: "INTEGER",
        forecastDate: "TEXT",
        temperature: "REAL",
    },
};

export const userCropSchema: TableSchema = {
    tableName: "user_crops",
    columns: {
        id: "INTEGER PRIMARY KEY AUTOINCREMENT",
        userId: "INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE",
        cropId: "INTEGER NOT NULL REFERENCES crops(id) ON DELETE CASCADE",
        relationshipRole: "TEXT DEFAULT 'owner'",
        createdAt: "TEXT DEFAULT CURRENT_TIMESTAMP",
    },
};