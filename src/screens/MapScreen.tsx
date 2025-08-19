import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, TouchableOpacity, Text, Platform, Alert } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { TOKENS } from "../theme";
import { TopBar } from "../components/TopBar";
import { useParcels } from "../store/useParcels";
import { ParcelPeekCard } from "../components/ParcelPeekCard";
import { CropTagSheet } from "../components/CropTagSheet";
import { Parcel, CropCycle } from "../types";
import { initDB, addCrop, getCrops } from "../Database";

export const MapScreen: React.FC = () => {
  const mapRef = useRef<MapView | null>(null);
  const { parcels, addParcel, addOrUpdateCycle, getStatusForParcel } = useParcels();
  const [selected, setSelected] = useState<Parcel | null>(null);
  const [sheet, setSheet] = useState(false);
  const [crops, setCrops] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({});
      flyTo(loc.coords.latitude, loc.coords.longitude);

      await initDB();
      const rows = await getCrops();
      setCrops(rows);
    })();
  }, []);


  function flyTo(lat: number, lon: number, label?: string) {
    mapRef.current?.animateCamera({ center: { latitude: lat, longitude: lon }, zoom: 14 }, { duration: 600 });
  }

  async function onLongPress(e: any) {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    const p: Parcel = {
      id: Math.random().toString(36).slice(2),
      name: "New Parcel",
      point: { latitude, longitude },
      cycles: [],
    };
    addParcel(p);
    setSelected(p);
    setSheet(true);

    // For now, just using dummy values for crop
    const cropName = "Wheat";
    const harvestDate = "2025-12-01";
    const quantity = 100;

    await addCrop(cropName, "" + latitude + ":" + longitude, harvestDate, quantity);

    const rows = await getCrops();
    setCrops(rows);

    Alert.alert("Crop Tagged ✅", `${cropName} added at (${latitude}, ${longitude})`);
  }

  function onSaveCycle(c: CropCycle) {
    if (!selected) return;
    addOrUpdateCycle(selected.id, c);
  }

  async function handleAddCropHere() {
    // Example: default center coordinates
    const latitude = 12.9716;
    const longitude = 77.5946;
    await addCrop("Rice", "" + latitude + ":" + longitude, "2025-11-15", 250);
    const rows = await getCrops();
    setCrops(rows);
    setSheet(true);
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        initialRegion={{ latitude: 20.5937, longitude: 78.9629, latitudeDelta: 10, longitudeDelta: 10 }}
        onLongPress={onLongPress}
        customMapStyle={lightMapStyle}
      >
        {parcels.map((p) => {
          const status = getStatusForParcel(p.id);
          const color = status === "OVERDUE" ? TOKENS.danger : status === "DUE_SOON" ? TOKENS.info : TOKENS.success;
          return (
            <Marker
              key={p.id}
              coordinate={p.point}
              pinColor={color}
              onPress={() => setSelected(p)}
            />
          );
        })}
        {crops.map((crop) => (
          <Marker
            key={crop.id}
            coordinate={{ latitude: crop.latitude, longitude: crop.longitude }}
            title={crop.cropName}
            description={`Qty: ${crop.quantity} | Harvest: ${crop.harvestDate}`}
          />
        ))}
      </MapView>

      <TopBar onFlyTo={flyTo} />

      {/* FABs */}
      <View style={styles.fabs}>
        {/* <TouchableOpacity style={[styles.fab, { backgroundColor: TOKENS.primary }]} onPress={() => selected && setSheet(true)} activeOpacity={0.9}> */}
        <TouchableOpacity style={[styles.fab, { backgroundColor: TOKENS.primary }]} onPress={handleAddCropHere} activeOpacity={0.9}>
          <Text style={styles.fabText}>Tag Crop Here</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.fab, { backgroundColor: TOKENS.surface, borderWidth: 1, borderColor: TOKENS.border }]} onPress={() => selected && flyTo(selected.point.latitude, selected.point.longitude)}>
          <Text style={[styles.fabText, { color: TOKENS.text }]}>My Location</Text>
        </TouchableOpacity>
      </View>

      {selected && (
        <ParcelPeekCard
          parcel={selected}
          status={getStatusForParcel(selected.id)}
          onEdit={() => setSheet(true)}
        />
      )}

      <CropTagSheet visible={sheet} onClose={() => setSheet(false)} onSave={onSaveCycle} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TOKENS.bg },
  fabs: { position: "absolute", right: 16, bottom: 140, gap: 10 },
  fab: { borderRadius: 999, paddingVertical: 12, paddingHorizontal: 16, ...TOKENS.cardShadow },
  fabText: { color: "#fff", fontWeight: "700" },
});

const lightMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#f2f5fa" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6B7280" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
  { featureType: "water", stylers: [{ color: "#e9eef5" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#e9eef5" }] },
];