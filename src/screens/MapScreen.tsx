import React, { useEffect, useRef, useState } from "react";
import { Button, View, StyleSheet, TouchableOpacity, Text, Platform, Alert, Modal } from "react-native";
import { Picker } from "@react-native-picker/picker";
import MapView, { Marker, PROVIDER_GOOGLE, Polygon, Region, LatLng, Callout } from "react-native-maps";
import * as Location from "expo-location";
import { TOKENS } from "../theme";
import { TopBar } from "../components/TopBar";
import { useParcels } from "../store/useParcels";
import { ParcelPeekCard } from "../components/ParcelPeekCard";
import { CropTagSheet } from "../components/CropTagSheet";
import { Parcel, CropCycle } from "../types";
import { initDB, addCrop, getCrops, getCropsList, Crop, deleteCrop } from "../Database";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SQLite from "expo-sqlite";
import { useTranslation } from "react-i18next";
import LanguageSelector from "../components/LanguageSelector";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
} from "react-native-reanimated";
import VoiceTranscriptionBox from "../components/VoiceTranscriptionBox";
import VoiceRecorder from "../components/VoiceRecorder";


export const MapScreen: React.FC = () => {
  const db = SQLite.openDatabaseSync("crops.db");
  
  // states
  const mapRef = useRef<MapView | null>(null);
  const { t, i18n } = useTranslation();
  const { parcels, addParcel, addOrUpdateCycle, getStatusForParcel } = useParcels();
  const [selected, setSelected] = useState<Parcel | null>(null);
  const [sheet, setSheet] = useState(false);
  const [crops, setCrops] = useState<any[]>([]);
  const router = useRouter();
  const [points, setPoints] = useState<LatLng[]>([]);
  const height = useSharedValue(0);
 

  const [finalized, setFinalized] = useState(false);
  const [region, setRegion] = useState<Region>({
    latitude: 13.6145,
    longitude: 77.5128,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const COLORS = ["#FF5733", "#33FF57", "#3357FF", "#FFC300", "#8E44AD"];
  const [selectedCrp, setSelectedCrp] = useState<Crop | null>(null);
  const [highlightedPolygonId, setHighlightedPolygonId] = useState<number | null>(null);
  const { selectedCropFromSummaryPage } = useLocalSearchParams(); 
  const [selectedLang, setSelectedLang] = useState(i18n.language);
  const [isLanguagePicker, setIsLanguagePicker] = useState(false);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: height.value,
    transform: [{ scaleY: height.value }],
  }));

  const [transcription, setTranscription] = useState<string | null>(null);

  const handleLanguageChange = async (lang: string) => {
    setSelectedLang(lang);
    i18n.changeLanguage(lang);
    // await AsyncStorage.setItem("appLanguage", lang);
  };

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
    // setSelectedCrp()
    setSelected(p);
    // bring up add crop component
    setSheet(true); 
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

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({});
      flyTo(loc.coords.latitude, loc.coords.longitude);

      await initDB();
      const rows = await getCropsList();
      setCrops(rows);
      if(selectedCropFromSummaryPage) {
        focusOnEarliestPolygon(selectedCropFromSummaryPage.toString());
      }
    })();
  }, [crops.length]);


  const focusOnEarliestPolygon = (cropName: string) => {
    const filtered = crops.filter((c) => c.cropName === cropName);
    if(filtered.length === 0) return;

    const earliest = filtered.reduce((earliest, current) => 
      new Date(current.harvestDate) < new Date(earliest.harvestDate) 
      ? current 
      : earliest
    );

    try {
      const boundaryData = 
        typeof earliest.boundary === 'string'
        ? JSON.parse(earliest.boundary)
        : earliest.boundary;
      
        if(Array.isArray(boundaryData) && boundaryData.length > 0) {
          const latSum = boundaryData.reduce((sum, p) => sum + p.latitude, 0);
          const longSum = boundaryData.reduce((sum, p) => sum + p.longitude, 0);
          const center = {
            latitude: latSum / boundaryData.length,
            longitude: longSum / boundaryData.length,
          };

          setHighlightedPolygonId(earliest.id);
          mapRef.current?.fitToCoordinates(boundaryData, {
            edgePadding: {
              top: 100,
              right: 100,
              bottom: 100,
              left: 100
            },
            animated: true
          });
        } else {
          console.warn("No valid boundary points found for crop: ", cropName);
        }

    } catch(error) {
      console.warn("No valid boundary points found for crop: ", cropName);
    }
  };


  function flyTo(lat: number, lon: number, label?: string) {
    mapRef.current?.animateCamera({ center: { latitude: lat, longitude: lon }, zoom: 14 }, { duration: 600 });
  }

  

  function onSaveCycle(c: CropCycle) {
    console.log("onSave callback from cropsheet component invoked...");
    if (!selected) return;
    addOrUpdateCycle(selected.id, c);
    addCropWithLandBoundary(c);
  }

  function getPolygonCentroid(points: LatLng[]): LatLng {
    let x = 0, y = 0;
    for (const p of points) {
      x += p.latitude;
      y += p.longitude;
    }
    return {
      latitude: x / points.length,
      longitude: y / points.length
    };
  }

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  async function handleDelete() {
    const cropId = selectedCrp?.id;
    if(cropId) {
      await deleteCrop(cropId);
      Alert.alert(`Crop with ${cropId} deleted ✅`);  
      const rows = await getCropsList();
      const deletedCrop = rows.filter(r => r.id == cropId);
      console.log("deletedCrop: " + deletedCrop[0].cropName);
      setCrops(rows);
      closeModal();
    } else {
      Alert.alert("Crop deletion needs an ID");
      return;
    }
  }

  const reverseGeocode = async (locationStr: string): Promise<string> => {
    try {
        const [lat, lng] = locationStr.split(":").map(s => parseFloat(s));
        // const lat: number = 38.949551;
        // const lng: number = -121.134732;
        const res = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng});
        if(res && res.length > 0) {
            const place = res[0];
            return `${place.subregion || place.city || place.region || "Unknown"}`;
        }
        return "Unknown";
    } catch(e) {
        console.warn("Reverse geocode failed: ", e);
        return "Unknown";
    }
  };
  
  const togglePicker = () => {
    const newValue = !isLanguagePicker;
    setIsLanguagePicker(newValue);
    height.value = withTiming(newValue ? 1 : 0, { duration: 300 });
  };

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
        {/* Marker for each tap */}
        {points.map((p, idx) => (
          <Marker key={idx} coordinate={p} />
        ))}

        {crops.map((crop, index) => {
          if (!crop.boundary) return null;
          let centroid: LatLng;
          let coordinates: LatLng[];
          let sortedPoints: LatLng[];
          try {
            coordinates = JSON.parse(crop.boundary);
            // Step 1: find centroid
            centroid = {
              latitude:
                coordinates.reduce((sum, p) => sum + p.latitude, 0) /
                coordinates.length,
              longitude:
                coordinates.reduce((sum, p) => sum + p.longitude, 0) /
                coordinates.length,
            };

            // Step 2: sort by angle around centroid
            sortedPoints = [...coordinates].sort((a, b) => {
              const angleA = Math.atan2(a.latitude - centroid.latitude, a.longitude - centroid.longitude);
              const angleB = Math.atan2(b.latitude - centroid.latitude, b.longitude - centroid.longitude);
              return angleA - angleB;
            });

          } catch (e) {
            console.error("Invalid boundary JSON", e);
            return null;
          }

          return (
            <>
              <Polygon
                key={crop.id}
                coordinates={sortedPoints}
                strokeColor={highlightedPolygonId === crop.id ? '#FFD700' : "black" }
                strokeWidth={highlightedPolygonId === crop.id ? 3 : 1.5}
                fillColor={
                  highlightedPolygonId === crop.id
                  ? 'rgba(255, 215, 0, 0.4)' // light gold fill
                  : 'rgba(34, 139, 34, 0.3)' // normal green
                  // `${COLORS[index % COLORS.length]}55`
                } // semi-transparent fill
                tappable
                onPress={async () => {
                  const reverseGeocodeLocation = await reverseGeocode(crop.location);
                  crop.locationName = reverseGeocodeLocation;
                  setSelectedCrp(crop)
                }} // <-- open modal on tap
                // onTouchStart={}
              />
              <Marker coordinate={centroid}>
                <Callout>
                  <React.Fragment>
                    <Text style={{ fontWeight: "bold" }}>{crop.cropName}</Text>
                    <Text>{t("harvestDate")}: {crop.harvestDate}</Text>
                    <Text>{t("quantity")}: {crop.quantity} {t("ton")}</Text>
                    <Text>{t("location")}: {crop.locationName}</Text>
                  </React.Fragment>
                </Callout>
            </Marker>
          </>
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
                <Text>{t("harvestDate")}: {selectedCrp?.harvestDate}</Text>
                <Text>{t("quantity")}: {selectedCrp?.quantity} {t("ton")}</Text>
                <Text>{t("location")}: {selectedCrp?.locationName}</Text>

                <TouchableOpacity onPress={handleDelete} style={styles.button}>
                  <Text style={styles.buttonText}>{t("delete")}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={closeModal} style={styles.button}>
                  <Text style={styles.buttonText}>{t("close")}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
      <TopBar onFlyTo={flyTo} />
      <TouchableOpacity style={styles.toggleButton} onPress={togglePicker}>
        <Ionicons name="language" size={22} color="#fff" />
      </TouchableOpacity>

      <Animated.View style={[styles.languageContainer, animatedStyle]}>
        {isLanguagePicker && <LanguageSelector />}
      </Animated.View>
     
      <VoiceTranscriptionBox 
        text={transcription}
        onClose={() => setTranscription(null)}
      />

      {/* FABs */}
      <View style={styles.fabs}>
        <VoiceRecorder onTranscription={setTranscription}/>
        <Button title={t("clear")}onPress={handleClear} />
        <Button title={t("zoomIn")} onPress={() => handleZoom(true)} />
        <Button title={t("zoomOut")} onPress={() => handleZoom(false)} />
        {!finalized && <Button title={t("finalize")}onPress={handleFinalize}/>}
        <Button title={t("cropsSummary")} onPress={() => {router.push("/crops-summary")}}/>
      </View>
      
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
  picker: {
    height: Platform.OS === "ios" ? 180 : 50,
    width: "100%",
  },
  toggleButton: {
    position: "absolute",
    top: 90,
    right: 20,
    zIndex: 20,
    backgroundColor: "#1DB954",
    borderRadius: 25,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  languageContainer: {
    position: "absolute",
    top: 100,
    right: 20,
    left: 20,
    zIndex: 10,
    // backgroundColor: "#ffffffee",
    borderRadius: 12,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
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