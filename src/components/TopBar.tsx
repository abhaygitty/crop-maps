import React, { useState } from "react";
import { View, TextInput, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { TOKENS } from "../theme";
import { geocodeQuery, parseLatLng } from "../utils/geocode";

interface Props {
  onFlyTo: (lat: number, lon: number, label?: string) => void;
}

export const TopBar: React.FC<Props> = ({ onFlyTo }) => {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    const coords = parseLatLng(q);
    if (coords) {
      onFlyTo(coords.lat, coords.lon, `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`);
      return;
    }
    try {
      setLoading(true);
      const results = await geocodeQuery(q);
      if (results[0]) onFlyTo(results[0].lat, results[0].lon, results[0].label);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.searchRow}>
        <TextInput
          placeholder="Search address, ZIP or lat,lon"
          placeholderTextColor={TOKENS.muted}
          value={q}
          onChangeText={setQ}
          onSubmitEditing={onSubmit}
          style={styles.input}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.btn} onPress={onSubmit} activeOpacity={0.9}>
          {loading ? <ActivityIndicator /> : <Text style={styles.btnText}>Go</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 20,
    left: 16,
    right: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TOKENS.border,
    padding: 10,
    // backdropFilter: "blur(12px)" as any, // web only, ignored native
    ...TOKENS.cardShadow,
  },
  searchRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: TOKENS.border,
    color: TOKENS.text,
  },
  btn: {
    backgroundColor: TOKENS.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  btnText: { color: "#fff", fontWeight: "600" },
});