import { useAuth } from "@/src/context/AuthContext";
import { registerUser } from "@/src/services/authService";
import { useRouter } from "expo-router";
import { useState } from "react";
import { View, Text, TextInput, Button } from "react-native";



export default function RegisterScreen() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    // defaulting to farmer role
    const [role, setRole] = useState<"farmer" | "buyer" | "admin">("farmer");
    const { register } = useAuth();
    
    async function handleRegister() {
        const result = await register(name, email, password, role);
        // const isUserRegistered = await registerUser({name, email, password, role});
        console.log("user registered: ", result);
        router.replace("/login");
    }

    return (
        <View style = {{ padding: 20, paddingTop: 40 }}>
            <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 20 }}>
                Register
            </Text>

            <TextInput
                placeholder="Name"
                value={name}
                onChangeText={setName}
                style={{ borderBottomWidth: 1, marginBottom: 12 }}
            />
                
            <TextInput 
                placeholder="Email"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                style={{ borderBottomWidth: 1, marginBottom: 12 }}
            />
            
            <TextInput 
                placeholder="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                style={{ borderBottomWidth: 1, marginBottom: 12 }}
            />

            <Text style={{ marginTop: 10 }}>Select Role:</Text>
            <Button title={`Role: ${role}`} onPress={() => setRole(role === "farmer" ? "buyer": "farmer")} />
            
            <View style={{ marginTop: 20 }}>
                <Button title="Create Account" onPress={handleRegister}/>
            </View>
        </View>
    );
}