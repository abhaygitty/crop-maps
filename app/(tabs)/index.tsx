import { Image } from 'expo-image';
import { Platform, StyleSheet } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { SafeAreaView, StatusBar } from "react-native";
import { MapScreen } from "../../src/screens/MapScreen";
import React, { useEffect, useState } from "react";
import { View, Text, Button, FlatList } from "react-native";
import { initDB, addCrop, getCrops, getCropsList } from "../../src/Database";

export default function HomeScreen() {
  const [crops, setCrops] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      await initDB();
      const rows = await getCropsList();
      setCrops(rows);
    })();
  }, []);

  async function handleAddCrop() {
    await addCrop("Wheat", "12.9716,77.5946", "2025-11-30", 200, "");
    const rows = await getCrops();
    setCrops(rows);
  }

  return (
    <>
        <SafeAreaView style={{ flex: 1 }}>
            <StatusBar barStyle="dark-content" />
            <MapScreen />
        </SafeAreaView>
        {/* <View style={{ flex: 1, marginTop: 20, padding: 20 }}>
        <Button title="Add Sample Crop" onPress={handleAddCrop} />
        <FlatList
            data={crops}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
            <Text>
                🌱 {item.cropName} at {item.location} → {item.quantity} units by {item.harvestDate}
            </Text>
            )}
        />
        </View>  */}
    </>
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
