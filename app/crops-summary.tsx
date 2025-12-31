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
import { GlobalSettingsMenu } from "@/src/components/GlobalSettingsMenu";

interface CropSummary {
    id: number;
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
        (async () => {
            const cropsLoaded = await loadCrops();
            if(cropsLoaded) {
                console.log("crops loaded...");
                await loadCropSummary(cropsLoaded);
            }
        })();
    }, [location]);    

    useEffect(() => {
        let isActive = true;
        // async function definition and invokation - IIFE Immediately Invoked Function Expression.
        (async () => {
          console.log("use effect for transcription executed");
          if (transcription && isActive) {
            await renderCropQueryResults(transcription, crops);
          }
        })();
    
        return () => {
          isActive = false; // cancel any pending work
        };
    }, [transcription]);

    const loadCrops = async ():Promise<Crop[]> => {
        if(user) {
            let userCrops;
            if(user.role === "farmer" && user.id) {
                userCrops = await getCropsForUser(user.id);
                let cropList: Crop[] = [];
                for(const c of userCrops){
                    const cropItem: Crop = {
                        cropName: c.cropName,
                        harvestDate: c.harvestDate,
                        location: c.location,
                        locationName: c.locationName,
                        quantity: c.quantity,
                        id: c.id,
                        boundary: c.boundary
                    };
                    cropList.push(cropItem);
                }                
                setCrops(cropList);
                console.log("farmer role detected. allCrops object length: ", userCrops.length);
                return cropList;
            } else if(user.role === "buyer" || "admin") {
                const allCrops = await getCropsList();
                console.log("buyer role detected. allCrops object length: ", allCrops.length);
                setCrops(allCrops);                
                return allCrops;
            } else {
                console.log("no crops...neither farmer nor buyer");
                return [];      
            }
        }
        return [];
    };

    const loadCropSummary = async (retrievedCrops: Crop[]) => {
        console.log("load crop summary invoked...");
        setLoading(true);
        try {
            if(retrievedCrops && retrievedCrops.length !== 0) {
                console.log("crops loaded in state object", retrievedCrops.length);
                
                // grouped by crop name
                const grouped = await groupByCrop(retrievedCrops); // grouped by crop name
                
                // summarize with crop and geo location
                const summariesWithGeo = await Promise.all(
                    grouped.map(async g => {
                        const readableName = await reverseGeocode(g.location);
                        const avgYieldNearby = computeAverageYield(g);
                        return {
                            id: g.id,
                            cropName: g.cropName,
                            totalQuantity: g.totalQuantity,
                            earliestHarvest: g.earliestHarvest,
                            locationName: readableName,
                            avgYieldNearby: avgYieldNearby                            
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
        } finally {
            setLoading(false);
        }        
    };

    // filter crops within radius. Defaulted to 1000km
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
    const groupByCrop = async (crps: Crop[]) => {
        let cropListToGroup: Crop[] = [];
        // filter crops within the haversine distance of the user's current location
        if(user?.role === "admin") {
            cropListToGroup = crps;
        } else {
            cropListToGroup = await filterCropsWithinRadius(crps);
        }
        const grouped: Record<string, any> = {};
        if(cropListToGroup && cropListToGroup.length > 0) {
            for(const c of cropListToGroup) {
                if(!grouped[c.cropName]) {                    
                    grouped[c.cropName] = {
                        id: c.id,
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
                    grouped[c.cropName].id = c.id;
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
                params: { selectedCropFromSummaryPage: item.id }
            });
        } else if(user?.role === "buyer") {
            router.push({
                pathname: '/(tabs)/contracts/create-contract',
                params: { selectedCrop: item.cropName, 
                    cropQuantity: item.totalQuantity,
                    earliestCropHarvestDate: item.earliestHarvest 
                }
            });
        } else if(user?.role === "admin") {
            router.push({
                pathname: "/",
                params: { selectedCropFromSummaryPage: item.id }
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
                <Text>📅 {t("earliestHarvest")}: {item.earliestHarvest.split("T")[0]} ({getDaysRemaining(item.earliestHarvest)})</Text>
                <Text>📊 {t("averageYieldNearby")} (1000 km): {item.avgYieldNearby} ton</Text>
            </View>
        </TouchableOpacity>
        
    );
      
    function getDaysRemaining(harvestDateString: string): string {
        const now = new Date();
        const harvestDate = new Date(harvestDateString);
        const diffMs = harvestDate.getTime() - now.getTime();
        const daysRemaining = Math.ceil(diffMs / (1000*60*60*24));
        if (daysRemaining > 0) {
            console.log(`${daysRemaining} days remaining`);
            return `${daysRemaining} days remaining`;
        } else if (daysRemaining === 0) {
            console.log("Harvest today!");
            return `Harvest today!`;
        } else {
            console.log(`Harvest ended ${Math.abs(daysRemaining)} days ago`);
            return `Harvest ended ${Math.abs(daysRemaining)} days ago`;
        }
    }

    return (
        <View style={styles.container}>
            <GlobalSettingsMenu />
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
    container: { flex: 1, padding: 16, backgroundColor: "#fff", paddingTop: 60 },
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
  