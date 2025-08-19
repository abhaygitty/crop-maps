import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { TOKENS } from "../theme";
import { Parcel } from "../types";

function statusChipColor(status?: string) {
  switch (status) {
    case "ON_TRACK":
      return { bg: "#ECFDF5", fg: "#065F46" };
    case "DUE_SOON":
      return { bg: "#EFF6FF", fg: "#1D4ED8" };
    case "OVERDUE":
      return { bg: "#FEF2F2", fg: "#B91C1C" };
    default:
      return { bg: TOKENS.neutral, fg: TOKENS.muted };
  }
}

interface Props {
  parcel: Parcel;
  status?: "ON_TRACK" | "DUE_SOON" | "OVERDUE";
  onEdit: () => void;
}

export const ParcelPeekCard: React.FC<Props> = ({ parcel, status, onEdit }) => {
  const last = parcel.cycles[parcel.cycles.length - 1];
  const c = statusChipColor(status);
  return (
    <View style={styles.card}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={styles.title}>{parcel.name ?? "Unnamed Parcel"}</Text>
        <View style={[styles.statusChip, { backgroundColor: c.bg }]}> 
          <Text style={{ color: c.fg, fontWeight: "600", fontSize: 12 }}>{status ?? "N/A"}</Text>
        </View>
      </View>
      {last ? (
        <>
          <Text style={styles.muted}>Crop</Text>
          <Text style={styles.value}>{last.cropType}</Text>
          <View style={{ height: 6 }} />
          <Text style={styles.muted}>Harvest Due</Text>
          <Text style={styles.value}>{new Date(last.harvestDate).toDateString()}</Text>
          <View style={{ height: 6 }} />
          <Text style={styles.muted}>Quantity</Text>
          <Text style={styles.value}>{last.expectedQty} {last.unit}</Text>
        </>
      ) : (
        <Text style={styles.muted}>No crop cycle yet</Text>
      )}

      <TouchableOpacity onPress={onEdit} style={styles.editBtn} activeOpacity={0.9}>
        <Text style={{ color: "#fff", fontWeight: "700" }}>Edit / Tag Crop</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 20,
    backgroundColor: TOKENS.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: TOKENS.border,
    ...TOKENS.cardShadow,
  },
  title: { fontSize: 16, fontWeight: "700", color: TOKENS.text },
  muted: { color: TOKENS.muted, marginTop: 4, fontSize: 12 },
  value: { color: TOKENS.text, fontWeight: "600" },
  editBtn: { backgroundColor: TOKENS.primary, marginTop: 12, borderRadius: 14, paddingVertical: 12, alignItems: "center" },
  statusChip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
});