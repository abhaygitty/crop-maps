import { ProtectedRoute } from "@/src/components/ProtectedRoute";
import { Text, View } from "react-native";
import React from "react";

export default function FarmerDashboard() {
  return (
    <ProtectedRoute allowedRoles={["farmer"]}>
      <View>
        <Text>Welcome Farmer 👨‍🌾</Text>
      </View>
    </ProtectedRoute>
  );
}
