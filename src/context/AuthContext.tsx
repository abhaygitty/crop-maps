import React, { createContext, useState, useEffect, ReactNode, useContext } from "react";
import {
  loginUser,
  registerUser,
  logoutUser,
  getCurrentUserRole,
  getCurrentToken,
//   initializeUserTable,
} from "@/src/services/authService";

type Role = "farmer" | "buyer" | "admin";

interface User {
    name?: string;
    email?: string;
    role?: Role;
}

interface AuthContextType {
    userRole: string | null;
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    register: (
        name: string,
        email: string,
        password: string,
        role: "farmer" | "buyer" | "admin"
    ) => Promise<boolean>;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
    userRole: null,
    user: null,
    isAuthenticated: false,
    login: async () => false,
    register: async () => false,
    logout: async () => {},
});

export const AuthProvider = ({ children }: {children: ReactNode }) => {
    const [userRole, setUserRole] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // initializeUserTable();
    const loadUser = async () => {
      const token = await getCurrentToken();
      const role = await getCurrentUserRole();
      if (token && role) {
        setIsAuthenticated(true);
        setUserRole(role);
      }
    };
    loadUser();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const token = await loginUser(email, password);
    if (token) {
      const role = await getCurrentUserRole();
      setUserRole(role);
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const register = async (
    name: string,
    email: string,
    passwordHash: string,
    role: "farmer" | "buyer" | "admin"
  ): Promise<boolean> => {
    await registerUser({ name, email, passwordHash, role });
    return true;
  };

  const logout = async () => {
    await logoutUser();
    setUserRole(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{ userRole, user, isAuthenticated, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );

};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if(!ctx)
        throw new Error("iseAuth must be used within AuthProvider");
    return ctx;
};