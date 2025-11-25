import Constants from "expo-constants";

export const OPENAI_API_KEY = Constants.expoConfig?.extra?.openaiApiKey;
export const SECRET_KEY = Constants.expoConfig?.extra?.secretKey;
export const GUNA = process.env.EXPO_PUBLIC_GUNA;
export const LASSENCOUNTY = process.env.EXPO_PUBLIC_LASSENCOUNTY;
export const COOKCOUNTY = process.env.EXPO_PUBLIC_COOKCOUNTY;
export const BENGALURUURBAN = process.env.EXPO_PUBLIC_BENGALURUURBAN;
export const SANFRANCISCOCOUNTY = process.env.EXPO_PUBLIC_SANFRANCISCOCOUNTY;
export const CHIKKABALLAPUR = process.env.EXPO_PUBLIC_CHIKKABALLAPUR;