import React, { useState, useContext, useEffect } from "react";
import { View, TextInput, Button, Text, Alert, TouchableOpacity } from "react-native";
import { AuthContext, useAuth } from "@/src/context/AuthContext";
import { router } from "expo-router";
import { ensureAllTables } from "@/src/db/migration";
import { cropSchema, userSchema, weatherSchema } from "@/src/db/schema";
import { getAllUsers } from "@/src/db/Database";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // useEffect(() => {
  //   (async () => {
  //     await ensureAllTables([cropSchema, userSchema, weatherSchema]);
  //     console.log("✅ DB Migration completed");
  //   })();
  // }, []);
  const handleLogin = async () => {
    try {
      await loadUsers();
      const success = await login(email, password);
      if (success) 
          router.replace("/");
      else 
      alert("Invalid credentials");
    }catch(error) {
        console.error(error);
        Alert.alert("Login failed", "Please check your credentials");
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

  return (
    <View style={{ padding: 20, flex: 1, justifyContent: "center" }}>
      <Text style={{ fontSize: 24, marginBottom: 16 }}>Login</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, marginBottom: 12, padding: 8 }}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, marginBottom: 16, padding: 8 }}
      />
      <Button title="Login" onPress={handleLogin} />
      <TouchableOpacity onPress={() => router.push("/register")}>
        <Text style={{ marginTop: 20, color: "blue" }}>
          Don't have an account? Register
        </Text>
      </TouchableOpacity>
    </View>
  );
}
