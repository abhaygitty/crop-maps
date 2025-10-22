import React, { useEffect, useRef, useState } from "react";
import { Button, View, StyleSheet, TouchableOpacity, Text, Platform, Alert, Modal } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Polygon, Region, LatLng, Callout } from "react-native-maps";
import * as Location from "expo-location";
import { TOKENS } from "../theme";
import { TopBar } from "../components/TopBar";
import { useParcels } from "../store/useParcels";
import { CropTagSheet } from "../components/CropTagSheet";
import { Parcel, CropCycle, CropQuery } from "../types";
import { initDB, addCrop, getCropsList, Crop, deleteCrop } from "../Database";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import LanguageSelector from "../components/LanguageSelector";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
} from "react-native-reanimated";
import VoiceRecorder from "../components/VoiceRecorder";
import { OpenAI } from "openai";
import { getCropCentroidFromBoundary, haversineDistance, reverseGeocode } from "../utils/geocode";
import { translateToEnglish } from "../utils/translate-to-english";
import { normalizeCropName } from "../utils/normalize";
import { OPENAI_API_KEY } from "../utils/security/keys";


export const MapScreen: React.FC = () => {

  const openAIClient = new OpenAI({
    apiKey: OPENAI_API_KEY,
  });

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
  const [currentUserLocation, setCurrentUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [finalized, setFinalized] = useState(false);
  const [region, setRegion] = useState<Region>({
    latitude: 13.6145,
    longitude: 77.5128,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [selectedCrp, setSelectedCrp] = useState<Crop | null>(null);
  const [highlightedPolygonId, setHighlightedPolygonId] = useState<number | null>(null);
  const { selectedCropFromSummaryPage } = useLocalSearchParams(); 
  const [isLanguagePicker, setIsLanguagePicker] = useState(false);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: height.value,
    transform: [{ scaleY: height.value }],
  }));

  const [transcription, setTranscription] = useState<string | "">("");
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

  useEffect(() => {
    (async () => {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }
  
      // Get current position
      const currentLocation = await Location.getCurrentPositionAsync({});
      setCurrentUserLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    })();
  }, []);

  useEffect(() => {
    let isActive = true;

    // async function definition and invokation - IIFE Immediately Invoked Function Expression.
    (async () => {
      console.log("use effect for transcription executed");
      if (transcription && isActive) {
        await renderCropQueryResults(transcription);
      }
    })();

    return () => {
      isActive = false; // cancel any pending work
    };
  }, [transcription]);

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

  const togglePicker = () => {
    const newValue = !isLanguagePicker;
    setIsLanguagePicker(newValue);
    height.value = withTiming(newValue ? 1 : 0, { duration: 300 });
  };

  async function parseCropQuery(transcribedText: string, userLocation: {lat: number, lng: number}): Promise<CropQuery> {
    
    const prompt = `
    Extract structured query parameters from the user request. Return JSON only.
    User request: "${transcribedText}"

    The JSON should have:
    - cropName (string, optional)
    - radiusKM (number, default 1000)
    - startDate (YYYY-MM-DD, optional)
    - endDate (YYYY-MM-DD, optional)
    Use user location as: {"latitude": ${userLocation.lat}, "longitude": ${userLocation.lng}}
    `;
    
    const response = await openAIClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const rawText = response.choices[0].message?.content || "{}";

    // 🧹 Clean up model output: remove markdown formatting & non-JSON text
    const cleanedText = rawText
      .replace(/```json\s*/g, "")  // remove ```json
      .replace(/```/g, "")         // remove ```
      .trim();
    
    try {
      const cropQuery = JSON.parse(cleanedText) as CropQuery;
      return cropQuery;
    } catch (error) {
      console.error("❌ Failed to parse JSON:", error, "\nRaw output:", rawText);
      return {} as CropQuery;
    }
  }

  function filterCropsByCropQuery(crops: Crop[], query: CropQuery) {
    const cropsList = crops.filter(c => {
      const {lat, lng} = getCropCentroidFromBoundary(c.boundary);
      const distance = haversineDistance(
        query.location!.latitude,
        query.location!.longitude,
        lat,
        lng
      );
      const withinRadius = distance <= query.radiusKm;
      const matchesName = query.cropName ? c.cropName.toLowerCase() === query.cropName.toLowerCase() : true;
      const inDateRange = (!query.startDate || c.harvestDate >= query.startDate) &&
                          (!query.endDate || c.harvestDate <= query.endDate);
      return matchesName && (withinRadius || inDateRange);
    });
    return cropsList;
  }

  async function renderCropQueryResults(transcribedText: string) {
    if(transcribedText) {
      console.log("Transcription available");
      
      // fetch user's current location
      const userLocation = currentUserLocation ? {lat: currentUserLocation.latitude, lng: currentUserLocation.longitude} : {lat: 13.004881, lng: 77.708927};

      const { englishText, language } = await translateToEnglish(transcribedText);

      // parse transcription to crop query scheme
      let cropQuery = await parseCropQuery(englishText, userLocation);
      if(!cropQuery){
        cropQuery = { radiusKm: 1000,
          cropName: "rice",
          startDate: "2025-01-01", // YYYY-MM-DD
          endDate: "2025-12-31",
          location: {latitude: 13.004834, longitude: 77.708848 },
        };
      } else {
        if(cropQuery.cropName) {
          console.log("cropQuery before normalizing: ", cropQuery);
          cropQuery.cropName = normalizeCropName(cropQuery.cropName);
          console.log("cropQuery after normalizing: ", cropQuery);
        }
      }
      
      // filter crops by query
      const filteredResults = filterCropsByCropQuery(crops, cropQuery);
      const cropsStr = JSON.stringify(filteredResults);
      // navigates to the crop query summary screen with the serialized results
      router.push({
        pathname: "/crop-query-results",
        params: { cropsFromTranscribedFilter: cropsStr}
      });
      
    }
    console.log("Transcription not available. Returning dummy crop query");
  }

  async function handlePolygonSelection(crop: Crop) {
    const reverseGeocodeLocation = await reverseGeocode(crop.location);
    crop.locationName = reverseGeocodeLocation;
    setSelectedCrp(crop);
  }

  function handleOnTranscription(transcribedText: string) {
    setTranscription(transcribedText);
    console.log("Transcription state updated with: ", transcribedText);
  }

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

          function reverseGeocode(location: any) {
            throw new Error("Function not implemented.");
          }

          return (
            <React.Fragment key={crop.id}>
              <Polygon
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
                onPress={async () => await handlePolygonSelection(crop)} // <-- open modal on tap
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
          </React.Fragment>
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
     
      {/* <VoiceTranscriptionBox 
        text={transcription}
      /> */}

      {/* FABs */}
      <View style={styles.fabs}>
        <VoiceRecorder onTranscription={(transcribedText) => {
          handleOnTranscription(transcribedText);
          // setTranscription(transcribedText); 
          // console.log("transcribed text: ", transcribedText);
        }}/>
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
