import { openDatabase, runQueryWithAutoBackup } from "../db/db-backup-restore";
import * as bcrypt from "bcryptjs";
import { jwtDecode, JwtPayload } from "jwt-decode";
import { SECRET_KEY } from "../utils/security/keys";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";

interface CustomJwtPayload extends JwtPayload {
    role?: "farmer" | "buyer" | "admin";
    name?: string;
}

const db = openDatabase();

export interface User {
    id?: number;
    name: string;
    email: string;
    passwordHash: string;
    role: "farmer" | "buyer" | "admin";
}

const TOKEN_KEY = "authToken";

export async function saveToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken() {
  return await SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function getUserFromToken() {
  const token = await getToken();
  if (!token) return null;

  const payload = decodeToken(token);
  return payload ? { name: payload.name, role: payload.role } : null;
}

  
export function decodeToken(token: string): CustomJwtPayload | null {
    try {
        return jwtDecode<CustomJwtPayload>(token);
    } catch (e) {
        console.error("Invalid token", e);
        return null;
    }
}

export async function registerUser(user: User): Promise<boolean> {
    try{
        // const hash = await bcrypt.hash(user.password, 10);
        const result = await runQueryWithAutoBackup(
            db,
            `INSERT INTO users (name, email, passwordHash, role) VALUES (?, ?, ?, ?)`,
            [user.name, user.email, user.passwordHash, user.role]
        );
        console.log("User creation result: ", result);
        Alert.alert("User created");
    } catch(error) {
        console.log("Insertion error", error);
        return false;
    }
    return true;
}

export async function loginUser(email: string, password: string): Promise<string | null> {
    const user = await db.getFirstAsync<User>(`SELECT * FROM users WHERE email = ?`, [email]);
    if(!user) return null;

    // let valid = await bcrypt.compare(password, user.password)
    const valid = password === user.passwordHash;
    if(!valid) return null;

    // const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: "7d"});
    const token = "secret_token";

    await SecureStore.setItemAsync("userToken", token);
    await SecureStore.setItemAsync("userRole", user.role);
    await SecureStore.setItemAsync("userName", user.name);
    await SecureStore.setItemAsync("userEmail", user.email);

    return token;
}

export async function logoutUser(): Promise<void> {
    await SecureStore.deleteItemAsync("userToken");
    await SecureStore.deleteItemAsync("userRole");
}

export async function getCurrentUserRole(): Promise<string | null> {
    return SecureStore.getItemAsync("userRole");
}

export async function getCurrentUser(): Promise<User | null> {
    const userName = await SecureStore.getItemAsync("userName");
    const userEmail = await SecureStore.getItemAsync("userEmail");
    let userRole = await SecureStore.getItemAsync("userRole");
    const user: User = {
        name: userName === null ? "" : userName,
        email: userEmail === null ? "" : userEmail,
        role: userRole as ("farmer" | "buyer" | "admin"),
        passwordHash: ""
    };
    return user;
}
  
export async function getCurrentToken(): Promise<string | null> {
    return SecureStore.getItemAsync("userToken");
}