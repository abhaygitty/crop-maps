import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { Crop, getCrops, getCropsList } from "../Database";
import { ListRenderItem } from "react-native";

export default function CropListScreen() {
    const [crops, setCrops] = useState<Crop[]>([]);

    useEffect(() => {
        async function fetchData() {
            let data = await getCropsList();
            console.log("crops from db: ", data);
            setCrops(data);
        }
        fetchData();
    }, []);

  // Explicitly type renderItem
  const renderItem: ListRenderItem<Crop> = ({ item }) => (
    <View
      style={{
        marginBottom: 12,
        padding: 12,
        backgroundColor: "#fff",
        borderRadius: 12,
      }}
    >
      <Text style={{ fontWeight: "600" }}>{item.cropName}</Text>
      <Text>📍Location: {item.location}</Text>
      <Text>📅 Harvest Date: {item.harvestDate}</Text>
      <Text>🌾 Quantity: {item.quantity}</Text>
    </View>
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