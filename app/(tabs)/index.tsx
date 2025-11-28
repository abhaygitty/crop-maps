import { StyleSheet } from 'react-native';
import { SafeAreaView, StatusBar } from "react-native";
import { MapScreen } from "../../src/screens/MapScreen";
import React, { useEffect, useState } from "react";
import { getCropsList } from "../../src/db/Database";

export default function HomeScreen() {
  const [crops, setCrops] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const rows = await getCropsList();
      setCrops(rows);
    })();
  }, []);

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
