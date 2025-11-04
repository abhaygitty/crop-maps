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
               "ITSAppUsesNonExemptEncryption": false
            }
        },
        android: {
            "package": "com.abhay.cropmaps"
        },
        extra: {
            openaiApiKey: process.env.OPENAI_API_KEY,
            "eas": {
                "projectId": "4e7ed654-0073-478d-8200-3195a17f28a5"
            },
        },
    },
};