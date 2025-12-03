import { ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView, StatusBar } from "react-native";
import { MapScreen } from "../../src/screens/MapScreen";
import React, { useEffect, useState } from "react";
import { getCropsList } from "../../src/db/Database";
import { useAuth } from '@/src/context/AuthContext';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const [crops, setCrops] = useState<any[]>([]);
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if(!user)
      return;

    if(user.role === "buyer") {
      router.replace("/crops-summary");
      return;
    }

    // only for farmers and admin
    (async () => {
      try {
        const rows = await getCropsList();
        setCrops(rows);
      } catch(error) {
        console.error("Error occured while fetching crops", error);
      } finally {
        setLoading(false);
      }      
    })();
  }, [user]);

  if(!user) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if(loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </SafeAreaView>
    );
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
