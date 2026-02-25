import "dotenv/config";

export default {
    expo: {
        name: "vana-smrithi",
        slug: "crop-maps",
        version: "1.0.2",
        sdkVersion: "53.0.0",
        orientation: "portrait",
        scheme: "cropmaps",
        userInterfaceStyle: "automatic",
        newArchEnabled: true,
        icon: "./assets/images/icon.png",

        ios: {
            bundleIdentifier: "com.abhay.cropmaps",
            supportsTablet: true,
            config: {
                googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
            },
            "infoPlist": {
                "ITSAppUsesNonExemptEncryption": false,
                "NSLocationWhenInUseUsageDescription": "We use your location to center the map and tag crops accurately.",
                "NSLocationAlwaysAndWhenInUseUsageDescription": "Location access improves map accuracy.",
                "NSMicrophoneUsageDescription": "Microphone access is required for voice input.",
                "NSCameraUsageDescription": "Camera access is required for future features.",
                "NSPhotoLibraryUsageDescription": "Photo library access may be required for uploads."
            }
        },
        android: {
            "package": "com.abhay.cropmaps",
            adaptiveIcon: {
                foregroundImage: "./assets/images/adaptive-icon.png",
                backgroundColor: "#ffffff",
            },
            edgeToEdgeEnabled: true,
        },
        web: {
            bundler: "metro",
            output: "static",
            favicon: "./assets/images/favicon.png",
        },
        plugins: [
            "expo-router",
            [
              "expo-splash-screen",
              {
                image: "./assets/images/splash-icon.png",
                imageWidth: 200,
                resizeMode: "contain",
                backgroundColor: "#ffffff",
              },
            ],
            "expo-sqlite",
            "expo-localization",
          ],
      
          experiments: {
            typedRoutes: true,
        },
        extra: {
            openaiApiKey: process.env.OPENAI_API_KEY,
            googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
            "eas": {
                "projectId": "4e7ed654-0073-478d-8200-3195a17f28a5"
            },
            secretKey: process.env.SECRET_KEY,
        },
    },
};