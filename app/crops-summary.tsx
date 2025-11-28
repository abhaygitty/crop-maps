import { Button, View, Text, FlatList, StyleSheet, ActivityIndicator, TextInput, ListRenderItem, TouchableOpacity, Alert } from "react-native";
import React, { useEffect, useState } from "react";
import { Crop, getAllUserCrops, getCropsForUser, getCropsList } from "../src/db/Database";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { openDatabase } from "@/src/db/db-backup-restore";
import VoiceRecorder from "@/src/components/vui/VoiceRecorder";
import { getCurrentLocation, renderCropQueryResults } from "@/src/components/vui/utilities";
import { useAuth } from "@/src/context/AuthContext";

interface CropSummary {
    cropName: string;
    totalQuantity: number;
    earliestHarvest: string;
    locationName: string;
    avgYieldNearby: number;
}

const db = openDatabase();

// this could be apt for the buyer as it fetches information based on the logged in user's location within a radius of 1000 kms
const CropSummaryScreen = () => {
    const [summaries, setSummaries] = useState<CropSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("");
    const { t } = useTranslation();
    const [transcription, setTranscription] = useState<string | "">("");
    const [crops, setCrops] = useState<Crop[]>([]);
    const { user } = useAuth();
    
    useEffect(() => {
        loadCropSummary();
    }, [location]);    

    useEffect(() => {
        let isActive = true;
    
        // async function definition and invokation - IIFE Immediately Invoked Function Expression.
        (async () => {
          console.log("use effect for transcription executed");
          if (transcription && isActive) {
            // await renderCropQueryResults(transcription);
            await renderCropQueryResults(transcription, crops);
          }
        })();
    
        return () => {
          isActive = false; // cancel any pending work
        };
    }, [transcription]);

    const loadCrops = async () => {
        if(user) {
            if(user.role === "farmer" && user.id) {
                const crops = await getCropsForUser(user.id);
            } else if(user.role === "buyer") {
                const crops = await getCropsList();
            }
            if(crops) {
                setCrops(crops);
            }
        } 
    };

    const loadCropSummary = async () => {
        setLoading(true);
        try {            
            loadCrops();
            if(crops && crops.length !== 0) {
                const grouped = await groupByCrop(crops); // grouped by crop name
                const summariesWithGeo = await Promise.all(
                    grouped.map(async g => {
                        const readableName = await reverseGeocode(g.location);
                        const avgYieldNearby = computeAverageYield(g);
                        return {
                            cropName: g.cropName,
                            totalQuantity: g.totalQuantity,
                            earliestHarvest: g.earliestHarvest,
                            locationName: readableName,
                            avgYieldNearby: avgYieldNearby,
                        };
                    })
                )
                setSummaries(summariesWithGeo);
                setLoading(false);
            }     
        } catch(e) {
            console.warn("exception has occured: ", e);
            setLoading(false);
            return false;
        }
        
    };

    const filterCropsWithinRadius = async (crops: Crop[]) => {
        const locationCoords = await getCurrentLocation();
        const lat1 = locationCoords?.coords.latitude;
        const lon1 = locationCoords?.coords.longitude;
        const cropsWithinRadius = crops.filter(c => {
            const [lat2, lon2] = c.location.split(":").map(Number);
            const dist = haversineDistance((lat1 !== undefined ? lat1 : 13.004951), (lon1 !== undefined ? lon1 : 77.709200), lat2, lon2);
            return dist <= 1000; // kilometer
        });
        return cropsWithinRadius;
    }
    // group by crop within radius limits 1000 km
    const groupByCrop = async (crops: Crop[]) => {
        const nearby = await filterCropsWithinRadius(crops);
        const grouped: Record<string, any> = {};
        if(nearby && nearby.length > 0) {
            for(const c of nearby) {
                if(!grouped[c.cropName]) {
                    // check if it is within the haversine distance of the user's current location
                    
                    grouped[c.cropName] = {
                        cropName: c.cropName,
                        totalQuantity: 0,
                        earliestHarvest: c.harvestDate,
                        location: c.location,
                        totalFieldCount: 0
                    };
                }
                grouped[c.cropName].totalQuantity += c.quantity;
                grouped[c.cropName].totalFieldCount++;
                if(new Date(c.harvestDate) < new Date(grouped[c.cropName].earliestHarvest)) {
                    grouped[c.cropName].earliestHarvest = c.harvestDate;
                }
            }
            return Object.values(grouped);
        }
        return Object.values(grouped);        
    };
    
    const reverseGeocode = async (locationStr: string): Promise<string> => {
        try {
            const [lat, lng] = locationStr.split(":").map(s => parseFloat(s));
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

    const computeAverageYield = (cropsWithinRadius: any) => {
        if(cropsWithinRadius.length === 0) 
            return 0;
        return Math.round(cropsWithinRadius.totalQuantity / cropsWithinRadius.totalFieldCount);
    };

    const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // km
        const dLat = ((lat2 - lat1) * Math.PI) / 180; // in degrees
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + 
            Math.cos((lat1*Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) * 
            Math.sin(dLon / 2);
        return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    };

    const filtered = summaries.filter(s => 
        s.locationName.toLowerCase().includes(filter.toLowerCase()) || 
        s.cropName.toLowerCase().includes(filter.toLowerCase()) 
    );

    function handleOnTranscription(transcribedText: string) {
        setTranscription(transcribedText);
        console.log("Transcription state updated with: ", transcribedText);
    }

    function handleOnPress(item: CropSummary) {
        if(user && user?.role === "farmer") {
            router.push({
                pathname: '/',
                params: { selectedCropFromSummaryPage: item.cropName }
            });
        } else if(user?.role === "buyer") {
            router.push({
                pathname: '/(tabs)/contracts/create-contract',
                params: { selectedCrop: item.cropName, 
                    cropQuantity: item.totalQuantity,
                    earliestCropHarvestDate: item.earliestHarvest 
                }
            });
        }        
    }

    const renderItem: ListRenderItem<CropSummary> = ({ item }) => (
        <TouchableOpacity
            onPress={() => {
                handleOnPress(item);
            }}
        >
            <View style={styles.card}>
                <Text style={styles.crop}>{t("cropName")}: {item.cropName}</Text>
                <Text>📍 {item.locationName}</Text>
                <Text>🌾 {t("totalQuantity")}: {item.totalQuantity} {t("ton")}</Text>
                <Text>📅 {t("earliestHarvest")}: {item.earliestHarvest}</Text>
                <Text>📊 {t("averageYieldNearby")} (1000 km): {item.avgYieldNearby} ton</Text>
            </View>
        </TouchableOpacity>
        
    );
      
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Crop Summary</Text>
            <TextInput 
                style = {styles.input}
                placeholder="Filter by location or crop..."
                value={filter}
                onChangeText={setFilter}
            />

            {loading ? (
                <ActivityIndicator size="large" />
            ): (
                <FlatList<CropSummary>
                    data={filtered}
                    keyExtractor={(item, index) => `${item.cropName}-${index}`}
                    renderItem={renderItem}
                />
            )}
            <Button title="View Crop Summary coming shortly...****" /> 
            <VoiceRecorder onTranscription={(transcribedText) => {
                handleOnTranscription(transcribedText);
            }}/>
        </View>
    );
};

export default CropSummaryScreen;

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: "#fff" },
    title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
    input: {
      borderWidth: 1,
      borderColor: "#ccc",
      padding: 8,
      borderRadius: 8,
      marginBottom: 12,
    },
    card: {
      padding: 12,
      backgroundColor: "#f9f9f9",
      borderRadius: 10,
      marginBottom: 10,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    crop: { fontSize: 18, fontWeight: "600", marginBottom: 4 },
});
  