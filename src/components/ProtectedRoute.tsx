import React, { ReactNode, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Redirect, useRouter, useSegments } from "expo-router";
import { ActivityIndicator, View } from "react-native";

interface ProtectedRouteProps {
    allowedRoles?: string[];
    children: ReactNode;
}

export const ProtectedRoute = ({ allowedRoles, children }: ProtectedRouteProps) => {
    const { isAuthenticated, userRole } = useContext(AuthContext);
    const router = useRouter();
    const segments = useSegments();

    // 🚫 Not logged in → redirect (but only if not already on /login)
    if (!isAuthenticated && segments[0] !== "login") {
        return <Redirect href="/login" />;
    } else if(!isAuthenticated) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center"}}>
                <ActivityIndicator />
            </View>
        );
    }

    // ⚙️ Role-based protection
    if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
        return <Redirect href="/unauthorized" />;
    }
    
    return <>{children}</>;
}