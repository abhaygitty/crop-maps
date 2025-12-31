import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import LanguageSelector from "./LanguageSelector";

const screenWidth = Dimensions.get("window").width;
const SHEET_WIDTH = screenWidth * 0.7;

export const GlobalSettingsMenu: React.FC = () => {
    const router = useRouter();
  const { logout, userRole, user } = useAuth();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isLanguagePicker, setIsLanguagePicker] = useState(false);

  const settingsSheetX = useSharedValue(SHEET_WIDTH);
  const height = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: height.value,
    transform: [{ scaleY: height.value }],
  }));

  const settingsSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: settingsSheetX.value }],
  }));

  const openSettings = () => {
    setIsSettingsOpen(true);
    settingsSheetX.value = withTiming(0, { duration: 250 });
  };

  const closeSettings = () => {
    settingsSheetX.value = withTiming(SHEET_WIDTH, { duration: 250 });
    setTimeout(() => setIsSettingsOpen(false), 250);
  };

  const handleLogout = async () => {
    closeSettings();
    await logout();
    router.replace("/login");
  };
  
  return (
    <>
      {/* Hamburger button */}
      <TouchableOpacity style={styles.menuButton} onPress={openSettings}>
        <Ionicons name="menu" size={22} color="#fff" />
      </TouchableOpacity>

      {/* Settings half-slide modal */}
      <Modal
        visible={isSettingsOpen}
        animationType="none"
        transparent
        onRequestClose={closeSettings}
      >
        <View style={styles.settingsOverlay}>
          {/* Tap outside to close */}
          <TouchableOpacity
            style={styles.settingsBackdrop}
            activeOpacity={1}
            onPress={closeSettings}
          />

          {/* Right side sheet */}
          <Animated.View style={[styles.settingsSheet, settingsSheetStyle]}>
            <Text style={styles.settingsTitle}>Settings</Text>

            <View style={styles.settingsContent}>
              <Text style={styles.userLabel}>
                Email: {user?.email ?? "Logged in user"}
              </Text>
              <Text style={styles.roleLabel}>
                Role: {userRole ?? "Unknown"}
              </Text>

              <TouchableOpacity
                style={styles.settingsItem}
                onPress={() => {
                  closeSettings();
                  router.push("/crops-summary");
                }}
              >
                <Text style={styles.settingsItemText}>Crops Summary</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingsItem}
                onPress={() => setIsLanguageOpen((v) => !v)}
              >
                <Text style={styles.settingsItemText}>Language</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.toggleButton} onPress={() => {console.log("language button clicked...")}}>
                <Ionicons name="language" size={22} color="#fff" />
              </TouchableOpacity>
              {isLanguageOpen && (
                <View style={styles.languageContainer}>
                  <LanguageSelector />
                </View>
              )}

              {/* Add more items here as needed */}
            </View>

            {/* Logout pinned at bottom */}
            <View style={styles.settingsFooter}>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
    menuButton: {
      position: "absolute",
      top: 32,
      right: 20,
      zIndex: 30,
      backgroundColor: "#111827",
      borderRadius: 24,
      padding: 10,
      shadowColor: "#000",
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    settingsOverlay: {
      flex: 1,
      flexDirection: "row",
    },
    settingsBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.4)",
    },
    settingsSheet: {
      width: "70%",
      backgroundColor: "#fff",
      paddingTop: "15%",
      paddingHorizontal: 16,
      paddingBottom: 24,
      shadowColor: "#000",
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 10,
    },
    settingsTitle: {
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 16,
    },
    settingsContent: {
      flex: 1,
    },
    userLabel: {
      fontSize: 14,
      color: "#6B7280",
    },
    roleLabel: {
      fontSize: 14,
      color: "#6B7280",
      marginBottom: 16,
    },
    settingsItem: {
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: "#E5E7EB",
    },
    settingsItemText: {
      fontSize: 16,
    },
    languageContainer: {
      marginTop: 8,
    },
    settingsFooter: {
      marginTop: 16,
    },
    logoutButton: {
      backgroundColor: "#EF4444",
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: "center",
    },
    logoutText: {
      color: "#fff",
      fontWeight: "600",
      fontSize: 16,
    },
    toggleButton: {
      position: "absolute",
      top: 90,
      right: 20,
      zIndex: 20,
      backgroundColor: "#1DB954",
      borderRadius: 25,
      padding: 10,
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 5,
    },
  });