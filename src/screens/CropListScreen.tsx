import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { Crop, getCrops, getCropsList } from "../db/Database";
import { ListRenderItem } from "react-native";
import { enrichCropLocation } from "../utils/enrichCropLocation";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

export default function CropListScreen() {
    const [crops, setCrops] = useState<Crop[]>([]);
    const { t } = useTranslation();

    useEffect(() => {
        async function fetchData() {
            let data = await getCropsList();
            console.log("crops from db: ", data);
            setCrops(data);
        }
        fetchData();
    }, []);

  async function handleCropSelection(crop: Crop) {
    await enrichCropLocation(crop);
    router.push({
      pathname: "/",
      params: {selectedCropFromCropListPage: crop.id}
    })
  };



  // Explicitly type renderItem
  const renderItem: ListRenderItem<Crop> = ({ item }) => (
    <TouchableOpacity
      onPress={() => {
        handleCropSelection(item);
      }}
    >
      <View
        style={{
          marginBottom: 12,
          padding: 12,
          backgroundColor: "#fff",
          borderRadius: 12,
        }}
      >
        <Text style={{ fontWeight: "600" }}>{t("cropName")}: {item.cropName}</Text>
        <Text>📍{t("location")}: {item.locationName}</Text>
        <Text>📅 {t("harvestDate")}: {item.harvestDate}</Text>
        <Text>🌾 {t("quantity")}: {item.quantity}</Text>
      </View>
    </TouchableOpacity>
  );
    return (
        <>
            <View style={styles.container}>
              <Text style={styles.title}>My Crops</Text>
              <FlatList<Crop>
                  data={[...crops].sort(
                    (a, b) => new Date(a.harvestDate).getTime() - new Date(b.harvestDate).getTime()
                  )}
                  keyExtractor={(item: Crop) => item.id.toString()}
                  renderItem={renderItem}
              />
            </View>           
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, marginTop:120, backgroundColor: "#fff"},
    title: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
    card: {
        backgroundColor: "#f8f9fa",
        padding: 12,
        marginVertical: 6,
        borderRadius: 10,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    crop: { fontSize: 16, fontWeight: "600" },
})