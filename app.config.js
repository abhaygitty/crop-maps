import "dotenv/config";

export default {
    expo: {
        name: "vana-smrithi",
        slug: "crop-maps",
        version: "1.0.0",
        extra: {
            openaiApiKey: process.env.OPENAI_API_KEY,
        },
    },
};