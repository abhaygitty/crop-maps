import "dotenv/config";

export default {
    expo: {
        name: "vana-smrithi",
        slug: "crop-maps",
        version: "1.0.0",
        sdkVersion: "53.0.0",
        ios: {
            bundleIdentifier: "com.abhay.cropmaps",
            "infoPlist": {
                "ITSAppUsesNonExemptEncryption": false,
                "NSLocationWhenInUseUsageDescription": "We use your location to center the map and tag crops accurately.",
                "NSLocationAlwaysAndWhenInUseUsageDescription": "Location access improves map accuracy.",
                "NSMicrophoneUsageDescription": "Microphone access is required for voice input.",
                "NSCameraUsageDescription": "Camera access is required for future features.",
                "NSPhotoLibraryUsageDescription": "Photo library access may be required for uploads."
            },
            "NSAppTransportSecurity": {
               "NSAllowsArbitraryLoads": true
            }
        },
        android: {
            "package": "com.abhay.cropmaps"
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