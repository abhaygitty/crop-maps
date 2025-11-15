import { jwtDecode, JwtPayload } from "jwt-decode";

export interface CustomJwtPayload extends JwtPayload {
  role?: "farmer" | "buyer" | "admin";
  name?: string;
}

export function decodeToken(token: string): CustomJwtPayload | null {
  try {
    return jwtDecode<CustomJwtPayload>(token);
  } catch (e) {
    console.error("Invalid token", e);
    return null;
  }
}
