import { StyleSheet } from 'react-native';
import { SafeAreaView, StatusBar } from "react-native";
import { MapScreen } from "../../src/screens/MapScreen";
import React, { useEffect, useState } from "react";
import { initDB, addCrop, getCrops, getCropsList } from "../../src/db/Database";
import { ensureAllTables } from '@/src/db/migration';
import { cropSchema, userSchema, weatherSchema } from '@/src/db/schema';

export default function HomeScreen() {
  const [crops, setCrops] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      await ensureAllTables([cropSchema, userSchema, weatherSchema]);
      console.log("All DB tables ensured");
      await initDB();
      const rows = await getCropsList();
      setCrops(rows);
    })();
  }, []);

  async function handleAddCrop() {
    await addCrop("Wheat", "12.9716,77.5946", "2025-11-30", 200, "", "");
    const rows = await getCrops();
    setCrops(rows);
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" />
        <MapScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
