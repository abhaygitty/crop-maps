import { ProtectedRoute } from "@/src/components/ProtectedRoute";
import { Text, View } from "react-native";
import React from "react";
import { MapScreen } from "@/src/screens/MapScreen";
import CropSummaryScreen from "./crops-summary";

export default function BuyerDashboard() {
  return (
    <ProtectedRoute allowedRoles={["buyer"]}>
        <CropSummaryScreen />
    </ProtectedRoute>
  );
}
