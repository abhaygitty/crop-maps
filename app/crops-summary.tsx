import { Button, View, Text, FlatList, StyleSheet, ActivityIndicator, TextInput, ListRenderItem, TouchableOpacity, Alert } from "react-native";
import React, { useEffect, useState } from "react";
import { Crop, getCropsList } from "../src/db/Database";
import * as SQLite from "expo-sqlite";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

interface CropSummary {
    cropName: string;
    totalQuantity: number;
    earliestHarvest: string;
    locationName: string;
    avgYieldNearby: number;
}

const db = SQLite.openDatabaseSync("crops.db");

const CropSummaryScreen = () => {
    const [summaries, setSummaries] = useState<CropSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("");
    const { t } = useTranslation();

    useEffect(() => {
        loadCropSummary();
    }, []);

    const loadCropSummary = async () => {
        setLoading(true);
        try {
            const crops = await getCropsList();
            if(crops && crops.length !== 0) {
                const grouped = groupByCrop(crops);
                const summariesWithGeo = await Promise.all(
                    grouped.map(async g => {
                        const readableName = await reverseGeocode(g.location);
                        const avgYieldNearby = computeAverageYield(g, crops);
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

    const groupByCrop = (crops: Crop[]) => {
        const grouped: Record<string, any> = {};
        for(const c of crops) {
            if(!grouped[c.cropName]) {
                grouped[c.cropName] = {
                    cropName: c.cropName,
                    totalQuantity: 0,
                    earliestHarvest: c.harvestDate,
                    location: c.location
                };
            }
            grouped[c.cropName].totalQuantity += c.quantity;
            if(new Date(c.harvestDate) < new Date(grouped[c.cropName].earliestHarvest)) {
                grouped[c.cropName].earliestHarvest = c.harvestDate;
            }
        }
        return Object.values(grouped);
    };
    
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

    const computeAverageYield = (target: any, crops: Crop[]) => {
        const [lat1, lon1] = target.location.split(":").map(Number);
        const nearby = crops.filter(c => {
            const [lat2, lon2] = c.location.split(":").map(Number);
            const dist = haversineDistance(lat1, lon1, lat2, lon2);
            return dist <= 1000; // kilometer
        })

        if(nearby.length === 0) 
            return 0;
        const total = nearby.reduce((sum, c) => sum + c.quantity, 0);
        return Math.round(total / nearby.length);
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

    const renderItem: ListRenderItem<CropSummary> = ({ item }) => (
        <TouchableOpacity
            onPress={() => {
                // Alert.alert("crop selected on summary page");
                router.push({
                    pathname: '/',
                    params: { selectedCropFromSummaryPage: item.cropName }
                })
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
  