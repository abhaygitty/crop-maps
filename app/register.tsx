import { useAuth } from "@/src/context/AuthContext";
import { useDatabaseLifecycle } from "@/src/db/db-backup-restore";
import { registerUser } from "@/src/services/authService";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, Button, Animated, AccessibilityInfo, KeyboardAvoidingView, TouchableOpacity, ActivityIndicator, Platform, StyleSheet } from "react-native";

let LinearGradient: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  LinearGradient = require("expo-linear-gradient").LinearGradient;
} catch (e) {
  LinearGradient = null;
}

export default function RegisterScreen() {
    const fade = useRef(new Animated.Value(0)).current;
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    // defaulting to farmer role
    const [role, setRole] = useState<"farmer" | "buyer" | "admin">("farmer");
    const { register } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        Animated.timing(fade, { toValue: 1, duration: 420, useNativeDriver: true }).start();
    }, []);

    async function handleRegister() {
        setError(null);
        if(!name || !email || !password) {
            setError("Please complete all fields.");
            AccessibilityInfo.announceForAccessibility("Please complete all fields.");
            return;
        }
        setLoading(true);
        try {
            const result = await register(name, email, password, role);
            // const isUserRegistered = await registerUser({name, email, password, role});
            console.log("user registered: ", result);
            router.replace("/login");
        } catch(err) {
            console.error(err);
            setError("Registration failed. Try a different email.");
            AccessibilityInfo.announceForAccessibility("Registration failed");
        } finally {
            setLoading(false);
        }

        
    }

    return (
        <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {false ? (
          <LinearGradient colors={["#EAF7EE", "#D9F0DC"]} style={styles.header}>
            <Text style={styles.brand}>Welcome</Text>
            <Text style={styles.subtitle}>Create an account to start listing your produce</Text>
          </LinearGradient>
        ) : (
          <View style={[styles.header, { backgroundColor: "#EAF7EE" }]}>
            <Text style={styles.brand}>Welcome</Text>
            <Text style={styles.subtitle}>Create an account to start listing your produce</Text>
          </View>
        )}
  
        <Animated.View style={[styles.card, { opacity: fade }]}>
          <Text style={styles.cardTitle}>Create account</Text>
  
          <TextInput value={name} onChangeText={setName} placeholder="Full name" style={styles.input} />
          <TextInput value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" style={styles.input} />
          <TextInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry style={styles.input} />
  
          <Text style={{ color: "#4a7a5a", fontWeight: "600", marginTop: 6 }}>Role</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={role} onValueChange={(v) => setRole(v as any)}>
              <Picker.Item label="Farmer (Seller)" value="farmer" />
              <Picker.Item label="Buyer (Retailer / Wholesaler)" value="buyer" />
              <Picker.Item label="Admin (Administrator)" value="admin" />
            </Picker>
          </View>
 
          <TouchableOpacity style={styles.primaryBtn} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Create account</Text>}
          </TouchableOpacity>
  
          <View style={styles.bottomRow}>
            <Text style={styles.smallText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.replace("/login")}>
              <Text style={styles.linkText}> Sign in</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
  
        <View style={styles.footer}>
          <Text style={styles.footerText}>Accounts stored locally. You can migrate to cloud later.</Text>
        </View>
      </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#F6FBF7" },
    header: { height: 150, paddingTop: 40, paddingHorizontal: 20, justifyContent: "center" },
    brand: { color: "#0A5E37", fontSize: 26, fontWeight: "800" },
    subtitle: { color: "#2F6F47", marginTop: 6 },
    card: {
      marginHorizontal: 16,
      marginTop: -28,
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
    },
    pickerWrap: {
      borderWidth: 1,
      borderColor: "#E6F2EA",
      borderRadius: 8,
      overflow: "hidden",
      backgroundColor: "#FAFEFA",
      marginTop: 8,
      marginBottom: 6,
    },
    picker: { height: 42 },
    primaryBtn: {
      backgroundColor: "#0B6B3A",
      padding: 14,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 10,
    },
    primaryBtnText: { color: "#fff", fontWeight: "700" },
    bottomRow: { flexDirection: "row", justifyContent: "center", marginTop: 12 },
    smallText: { color: "#6b6b6b" },
    linkText: { color: "#0B6B3A", fontWeight: "700" },
    footer: { alignItems: "center", padding: 18 },
    footerText: { color: "#627d69", fontSize: 12 },
    error: { color: "#B00020", marginTop: 6 },
  });