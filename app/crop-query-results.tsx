import { Crop } from "@/src/Database";
import { Button, View, Text, FlatList, StyleSheet, ActivityIndicator, TextInput, ListRenderItem, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { router } from "expo-router";

export default function CropQueryResultsScreen() {
    const { cropsFromTranscribedFilter } = useLocalSearchParams<{cropsFromTranscribedFilter?: string | string[] }>();
    if(cropsFromTranscribedFilter === null || cropsFromTranscribedFilter === undefined || cropsFromTranscribedFilter.length === 0) return <Text>No crops found for this query.</Text>;
    else console.log("Crops filtered and received in this component");
    const cropsStr = Array.isArray(cropsFromTranscribedFilter) ? cropsFromTranscribedFilter[0]: cropsFromTranscribedFilter;
    const parsedCrops: Crop[] = cropsFromTranscribedFilter ? JSON.parse(cropsStr): [];

    // const [loading, setLoading] = useState(true);
    const { t } = useTranslation();

    const renderItem: ListRenderItem<Crop> = ({ item }) => (
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
                <Text>📍 {t("location")}: {item.locationName}</Text>
                <Text>🌾 {t("quantity")}: {item.quantity} {t("ton")}</Text>
                <Text>📅 {t("harvestDate")}: {item.harvestDate}</Text>
            </View>
        </TouchableOpacity>
        
    );

    return (

        <View style={styles.container}>
        <Text style={styles.title}>Filtered Crop Summary</Text>
        

        {/* {loading ? (
            <ActivityIndicator size="large" />
        ): ( */}
        <FlatList<Crop>
            data={parsedCrops}
            keyExtractor={(item, index) => `${item.cropName}-${index}`}
            renderItem={renderItem}
        />
        {/* )} */}
        <Button title="View Crop Summary coming shortly...****" />  
    </View>
        // <FlatList
        //     data={parsedCrops}
        //     keyExtractor={c => c.id.toString()}
        //     renderItem={({item}) => (
        //         <View className="p-2 border-b border-gray-200">
        //             <Text>{item.cropName}</Text>
        //             <Text>Quantity: {item.quantity}</Text>
        //             <Text>Harvest Date: {item.harvestDate}</Text>
        //             <Text>Location: {item.location}</Text>
        //         </View>
        //     )}
        // />
    );
};


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