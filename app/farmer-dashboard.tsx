import { ProtectedRoute } from "@/src/components/ProtectedRoute";
import { Text, View } from "react-native";
import React from "react";
import { MapScreen } from "@/src/screens/MapScreen";

export default function FarmerDashboard() {
  return (
    <ProtectedRoute allowedRoles={["farmer", "admin"]}>
        <MapScreen />
    </ProtectedRoute>
  );
}
