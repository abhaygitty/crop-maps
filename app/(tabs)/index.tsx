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
import { initDB, addCrop, getCrops } from "../../src/Database";

export default function HomeScreen() {
  const [crops, setCrops] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      await initDB();
      const rows = await getCrops();
      setCrops(rows);
    })();
  }, []);

  async function handleAddCrop() {
    await addCrop("Wheat", "12.9716,77.5946", "2025-11-30", 200);
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
    </View> */}
    </>
    // <>
    //   <SafeAreaView style={{ flex: 1 }}>
    //     <StatusBar barStyle="dark-content" />
    //     <MapScreen />
    //   </SafeAreaView>
    // </>

    // <ParallaxScrollView
    //   headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
    //   headerImage={
    //     <Image
    //       source={require('@/assets/images/partial-react-logo.png')}
    //       style={styles.reactLogo}
    //     />
    //   }>
    //   <ThemedView style={styles.titleContainer}>
    //     <ThemedText type="title">Welcome!</ThemedText>
    //     <HelloWave />
    //   </ThemedView>
    //   <ThemedView style={styles.stepContainer}>
    //     <ThemedText type="subtitle">Step 1: Try it</ThemedText>
    //     <ThemedText>
    //       Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes.
    //       Press{' '}
    //       <ThemedText type="defaultSemiBold">
    //         {Platform.select({
    //           ios: 'cmd + d',
    //           android: 'cmd + m',
    //           web: 'F12',
    //         })}
    //       </ThemedText>{' '}
    //       to open developer tools.
    //     </ThemedText>
    //   </ThemedView>
    //   <ThemedView style={styles.stepContainer}>
    //     <ThemedText type="subtitle">Step 2: Explore</ThemedText>
    //     <ThemedText>
    //       {`Tap the Explore tab to learn more about what's included in this starter app.`}
    //     </ThemedText>
    //   </ThemedView>
    //   <ThemedView style={styles.stepContainer}>
    //     <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
    //     <ThemedText>
    //       {`When you're ready, run `}
    //       <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{' '}
    //       <ThemedText type="defaultSemiBold">app</ThemedText> directory. This will move the current{' '}
    //       <ThemedText type="defaultSemiBold">app</ThemedText> to{' '}
    //       <ThemedText type="defaultSemiBold">app-example</ThemedText>.
    //     </ThemedText>
    //   </ThemedView>
    // </ParallaxScrollView>
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
