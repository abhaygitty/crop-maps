import React, { useEffect, useRef, useState } from "react";
import { View, TextInput, Button, Text, Alert, TouchableOpacity, Animated, AccessibilityInfo, KeyboardAvoidingView, ActivityIndicator, Platform, StyleSheet } from "react-native";
import { useAuth } from "@/src/context/AuthContext";
import { router } from "expo-router";
import { getAllUserCrops, getAllUsers } from "@/src/db/Database";
import * as Location from "expo-location";
import { Picker } from "@react-native-picker/picker";
import { ensureAllTables } from "@/src/db/migration";
import { cropSchema, userCropSchema, userSchema, weatherSchema } from "@/src/db/schema";

let LinearGradient: any = null;
try {
  LinearGradient = require("expo-linear-gradient").LinearGradient;
} catch(e) {
  LinearGradient = null;
}

export default function LoginScreen() {
  const fade = useRef(new Animated.Value(0)).current;
  const { login, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [userMessage, setUserMessage] = useState("");
  const [loading, setLoading] = useState<boolean>(false);
  const [roleHint, setRoleHint] = useState<"farmer" | "buyer">("farmer");

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start();
  }, []);

  // useEffect(() => {
  //   (async () => {
  //     console.log("ensure all tables triggered...");
  //     await ensureAllTables([cropSchema, userSchema, weatherSchema, userCropSchema]);
  //     console.log("ensure all tables triggered...");
  //   })();
  // }, []);

  const handleLogin = async () => {
    setError(null);
    if(!email || !password) {
      setError("Please enter email and password.");
      AccessibilityInfo.announceForAccessibility("Please enter email and password.");
      return;
    }
    setLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        if(user?.role === "farmer")
          router.push("/");
        else if(user?.role === "buyer") {
          router.push("/crops-summary");
        } else {
          setUserMessage("Invalid user role. Please login again");
          router.push("/login");
        }
      } else {
        setLoading(false);
        setError("Login failed. Try again.");
        alert("Invalid credentials");
        return;
      }
    }catch(error) {
        console.error(error);
        Alert.alert("Login failed", "Please check your credentials");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
        const users = await getAllUsers();
        console.log(users);
    } catch(error) {
        console.log("error fetching users: ", error);
    }
  };

  const loadUserCrops = async () => {
    try {
      const userCrops = await getAllUserCrops();
      console.log("userCrops: ", userCrops);
    } catch(error) {
      console.log("error fetching user crops: ", error);
    }
  };

  useEffect(() => {
    (async () => {
      await loadUsers();
      await loadUserCrops();
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        Alert.alert('Permission to access location was denied');
        return;
      }
    })();
    if(userMessage !== "")
      Alert.alert(userMessage);
  }, [userMessage]);

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* Header */}
      {false ? (
        <LinearGradient colors={["#E8F7EC", "#D0F0DA"]} style={styles.header}>
          <Text style={styles.brand}>Vana Smrithi</Text>
          <Text style={styles.subtitle}>Fair trade — farmer-first marketplace</Text>
        </LinearGradient>
      ) : (
        <View style={[styles.header, { backgroundColor: "#DFF3E6" }]}>
          <Text style={styles.brand}>Vana Smrithi</Text>
          <Text style={styles.subtitle}>Fair trade — farmer-first marketplace</Text>
        </View>
      )}

      {/* Content card */}
      <Animated.View style={[styles.card, { opacity: fade, transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>
        <Text style={styles.cardTitle}>Welcome back</Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor="#9aaea0"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          accessibilityLabel="Email"
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#9aaea0"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          accessibilityLabel="Password"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} disabled={loading} accessibilityRole="button">
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Sign in</Text>}
        </TouchableOpacity>

        <View style={styles.bottomRow}>
          <Text style={styles.smallText}>New here?</Text>
          <TouchableOpacity onPress={() => router.push("/register")}>
            <Text style={styles.link}> Create account</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inlineHint}>
          <Text style={styles.hint}>Quick demo role</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={roleHint} onValueChange={(v) => setRoleHint(v as any)} style={styles.picker}>
              <Picker.Item label="Farmer" value="farmer" />
              <Picker.Item label="Buyer" value="buyer" />
            </Picker>
          </View>
          <Text style={styles.note}>Use email containing <Text style={{ fontWeight: "700" }}>farmer</Text> or <Text style={{ fontWeight: "700" }}>buyer</Text> for demo</Text>
        </View>
      </Animated.View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Secure • Local-first • Role-based</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F6FBF7" },
  header: { height: 170, paddingTop: 44, paddingHorizontal: 20, justifyContent: "center" },
  brand: { color: "#0A5E37", fontSize: 28, fontWeight: "800" },
  subtitle: { color: "#2F6F47", marginTop: 6 },
  card: {
    marginHorizontal: 16,
    marginTop: -36,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 6,
  },
  cardTitle: { fontSize: 18, fontWeight: "700", color: "#0B6B3A", marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#E6F2EA",
    backgroundColor: "#FBFFFB",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    color: "#10321a",
  },
  primaryBtn: {
    backgroundColor: "#0B6B3A",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700" },
  bottomRow: { flexDirection: "row", justifyContent: "center", marginTop: 12 },
  smallText: { color: "#6b6b6b" },
  link: { color: "#0B6B3A", fontWeight: "700" },
  inlineHint: { marginTop: 10, alignItems: "center" },
  pickerWrap: {
    width: 160,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E6F2EA",
    overflow: "hidden",
    backgroundColor: "#FAFEFA",
    marginTop: 8,
  },
  picker: { height: 40 },
  hint: { color: "#4a7a5a", fontWeight: "600" },
  note: { marginTop: 8, fontSize: 12, color: "#6d6d6d", textAlign: "center" },
  error: { color: "#B00020", marginTop: 6 },
  footer: { alignItems: "center", padding: 18 },
  footerText: { color: "#6d8a6f", fontSize: 12 },
});