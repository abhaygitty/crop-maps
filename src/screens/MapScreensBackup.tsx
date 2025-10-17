import React, { useEffect, useRef, useState } from "react";
import { Button, View, StyleSheet, TouchableOpacity, Text, Platform, Alert, Modal } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Polygon, Region, LatLng } from "react-native-maps";
import * as Location from "expo-location";
import { TOKENS } from "../theme";
import { TopBar } from "../components/TopBar";
import { useParcels } from "../store/useParcels";
import { ParcelPeekCard } from "../components/ParcelPeekCard";
import { CropTagSheet } from "../components/CropTagSheet";
import { Parcel, CropCycle } from "../types";
import { initDB, addCrop, getCrops, getCropsList, Crop } from "../Database";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { useRouter } from "expo-router";
import * as SQLite from "expo-sqlite";

export const MapScreen: React.FC = () => {
  const db = SQLite.openDatabaseSync("crops.db");
  
  // states
  const mapRef = useRef<MapView | null>(null);
  const { parcels, addParcel, addOrUpdateCycle, getStatusForParcel } = useParcels();
  const [selected, setSelected] = useState<Parcel | null>(null);
  const [sheet, setSheet] = useState(false);
  const [crops, setCrops] = useState<any[]>([]);
  const router = useRouter();
  const [points, setPoints] = useState<LatLng[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<number | null>(null);  
  const [finalized, setFinalized] = useState(false);
  const [region, setRegion] = useState<Region>({
    latitude: 13.6145,
    longitude: 77.5128,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const COLORS = ["#FF5733", "#33FF57", "#3357FF", "#FFC300", "#8E44AD"];
  const [selectedCrp, setSelectedCrp] = useState<Crop | null>(null);

  const closeModal = () => setSelectedCrp(null);

  const handleZoom = (zoomIn: boolean) => {
    const factor = zoomIn ? 0.5 : 2; // shrink delta = zoom in; expand delta = zoom out
    const newRegion = {
      ...region,
      latitudeDelta: region.latitudeDelta * factor,
      longitudeDelta: region.longitudeDelta * factor,
    };

    mapRef.current?.animateToRegion(newRegion, 500);
    setRegion(newRegion);
  };

  const handleLongPress = (event: any) => {
    const newPoint = event.nativeEvent.coordinate;
    setPoints([...points, newPoint]);
  };

  const handleClear = () => {
    setPoints([]);
    setFinalized(false);
  };

  const handleFinalize = () => {
    if(points.length < 3) {
      Alert.alert("Boundary needs at least 3 points");
      return;
    }

    setFinalized(true);
    
    const latitude = points[0].latitude;
    const longitude = points[0].longitude;
    
    const p: Parcel = {
      id: Math.random().toString(36).slice(2),
      name: "New Parcel",
      point: { latitude, longitude },
      cycles: [],
    };
    addParcel(p);
    // setSelected(p);
    // bring up add crop component
    setSheet(true); 

    // onLongPress(points);
    // // Save to DB (example: cropId=1)
    // db.runAsync(
    //   "UPDATE crops SET boundary = ? WHERE id = ?",
    //   [JSON.stringify(points), 1] // replace 1 with the crop ID in context
    // )
    // .then(() => Alert.alert("Boundary saved for crop!"))
    // .catch((err) => console.error(err));
  };

  async function handleAddCropHere() {
    // Example: default center coordinates
    const latitude = 12.9716;
    const longitude = 77.5946;
    await addCrop("Rice", "" + latitude + ":" + longitude, "2025-11-15", 250, "");
    const rows = await getCropsList();
    setCrops(rows);
    setSheet(true);
  }

  async function addCropWithLandBoundary(cropCycle: CropCycle) {
    console.log("addCropWithLandBoundary called...");
    

    const cropName = cropCycle.cropType;
    const harvestDate = cropCycle.harvestDate;
    const quantity = cropCycle.expectedQty;
    if(points.length>2) {

      // randomly taking the first coordinates to pin
      const latitude = points[0].latitude;
      const longitude = points[0].longitude;
      
      const boundary = JSON.stringify(points);
      await addCrop(cropName, "" + latitude + ":" + longitude, harvestDate, quantity, boundary);

      const rows = await getCropsList();
      setCrops(rows);

      Alert.alert("Crop Tagged ✅", `${cropName} added at (${latitude}, ${longitude})`);  
    } else {
      Alert.alert("Crop cannot be Tagged", `${cropName} boundary points not recorded`);  
    }
    
  }

  async function onLongPress(points: LatLng[]) {
    const latitude = points[0].latitude;
    const longitude = points[0].longitude;
    
    const p: Parcel = {
      id: Math.random().toString(36).slice(2),
      name: "New Parcel",
      point: { latitude, longitude },
      cycles: [],
    };
    addParcel(p);
    // setSelected(p);
    setSheet(true);

    // For now, just using dummy values for crop
    const cropName = "Wheat";
    const harvestDate = "2025-12-01";
    const quantity = 100;
    const boundary = JSON.stringify(points);
    await addCrop(cropName, "" + latitude + ":" + longitude, harvestDate, quantity, boundary);

    const rows = await getCropsList();
    setCrops(rows);

    Alert.alert("Crop Tagged ✅", `${cropName} added at (${latitude}, ${longitude})`);
  }

 

  const handleZoomIn = () => {
    if(mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.01, // smaller delta = zoom in
        longitudeDelta: 0.01,
      });
    }
  };

  const handleZoomOut = () => {
    if(mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.2, // larger delta = zoom out
        longitudeDelta: 0.2,
      });
    }
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({});
      flyTo(loc.coords.latitude, loc.coords.longitude);

      await initDB();
      const rows = await getCropsList();
      setCrops(rows);
    })();
  }, []);


  function flyTo(lat: number, lon: number, label?: string) {
    mapRef.current?.animateCamera({ center: { latitude: lat, longitude: lon }, zoom: 14 }, { duration: 600 });
  }

  

  function onSaveCycle(c: CropCycle) {
    console.log("onSave callback from cropsheet component invoked...");
    if (!selected) return;
    addOrUpdateCycle(selected.id, c);
    addCropWithLandBoundary(c);
  }


  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined} 
        
        initialRegion={{ latitude: 13.6145, longitude: 77.5128, latitudeDelta: 10, longitudeDelta: 10 }}
        onLongPress={handleLongPress}
        customMapStyle={lightMapStyle}
        onRegionChangeComplete={(r) => setRegion(r)} // keep track of the region from the currently visible region
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
        {/* Marker for each tap */}
        {points.map((p, idx) => (
          <Marker key={idx} coordinate={p} />
        ))}

        {/* Polygon showing land boundary */}
        {/* {points.length > 2 && (
          <Polygon
            coordinates={points}
            strokeColor="rgba(108,92,231,1)" // violet border
            fillColor="rgba(108,92,231,0.2)" // translucent fill
            strokeWidth={2}
          />
        )} */}

        {crops.map((crop, index) => {
          if (!crop.boundary) return null;

          let coordinates: LatLng[];
          try {
            coordinates = JSON.parse(crop.boundary);
          } catch (e) {
            console.error("Invalid boundary JSON", e);
            return null;
          }

          return (
            <Polygon
              key={crop.id}
              coordinates={coordinates}
              strokeColor="black"
              strokeWidth={2}
              fillColor={`${COLORS[index % COLORS.length]}55`} // semi-transparent fill
              tappable
              onPress={() => setSelectedCrp(crop)} // <-- open modal on tap
              // onTouchStart={}
            />
          );
        })}
      </MapView>

    {/* Popup Modal */}
      <Modal
        visible={!!selectedCrp}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedCrp && (
              <>
                <Text style={styles.title}>{selectedCrp?.cropName}</Text>
                <Text>Harvest Date: {selectedCrp?.harvestDate}</Text>
                <Text>Quantity: {selectedCrp?.quantity}</Text>
                <Text>Location: {selectedCrp?.location}</Text>

                <TouchableOpacity onPress={closeModal} style={styles.button}>
                  <Text style={styles.buttonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
      <TopBar onFlyTo={flyTo} />

      {/* FABs */}
      <View style={styles.fabs}>
        {/* <TouchableOpacity style={[styles.fab, { backgroundColor: TOKENS.primary }]} onPress={() => selected && setSheet(true)} activeOpacity={0.9}> */}
        {/* <TouchableOpacity style={[styles.fab, { backgroundColor: TOKENS.primary }]} onPress={handleAddCropHere} activeOpacity={0.9}>
          <Text style={styles.fabText}>Tag Crop Here</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.fab, { backgroundColor: TOKENS.surface, borderWidth: 1, borderColor: TOKENS.border }]} onPress={() => selected && flyTo(selected.point.latitude, selected.point.longitude)}>
          <Text style={[styles.fabText, { color: TOKENS.text }]}>My Location</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.fab, { backgroundColor: TOKENS.primary }]} onPress={() => router.push("/(tabs)/explore")} activeOpacity={0.9}>
          <Text style={[styles.fabText]}>View Crop List</Text>
        </TouchableOpacity> */}
        {/* <View style={styles.controls}> */}
        <Button title="Clear" onPress={handleClear} />
        <Button title="Zoom In" onPress={() => handleZoom(true)} />
        <Button title="Zoom Out" onPress={() => handleZoom(false)} />
        {!finalized && <Button title="Finalize" onPress={handleFinalize}/>}
      {/* </View> */}
      </View>

      {/* {selected && (
        <ParcelPeekCard
          parcel={selected}
          status={getStatusForParcel(selected.id)}
          onEdit={() => setSheet(true)}
        />
      )} */}

      <CropTagSheet visible={sheet} onClose={() => setSheet(false)} onSave={onSaveCycle} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TOKENS.bg },
  fabs: { position: "absolute", right: 16, bottom: 140, gap: 10 },
  fab: { borderRadius: 999, paddingVertical: 12, paddingHorizontal: 16, ...TOKENS.cardShadow },
  fabText: { color: "#fff", fontWeight: "700" },
  controls: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  button: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

const lightMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#f2f5fa" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6B7280" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
  { featureType: "water", stylers: [{ color: "#e9eef5" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#e9eef5" }] },
];