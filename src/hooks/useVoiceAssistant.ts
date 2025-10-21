import * as Speech from 'expo-speech';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import { OpenAI } from 'openai';
import { franc } from 'franc-min';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';


const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export function useVoiceAssistant() {
    const { i18n } = useTranslation();

    async function handleVoiceCommand(audioUri: string) {
        try {
            const audioResponse = await fetch(audioUri);
            const blob = await audioResponse.blob();

            
          // 1️⃣ Transcribe the voice input using Whisper
          const transcription = await client.audio.transcriptions.create({
            file: blob,
            model: "gpt-4o-mini-transcribe"
          });
      
          const text = transcription.text.trim();
      
          // 2️⃣ Detect language
          const lang = franc(text);
          const langMap: Record<string, string> = {
            eng: "en",
            tam: "ta",
            tel: "te",
            mal: "ml",
            kan: "kn",
            hin: "hi"
          };
          const detectedLang = langMap[lang] || "en";
          await i18n.changeLanguage(detectedLang);
      
          // 3️⃣ Interpret intent using GPT
          const response = await client.responses.create({
            model: "gpt-4o-mini",
            input: `Interpret this user command in structured JSON with fields: 
              { "action": "show_crops" | "show_crop_availability", 
                "cropName": string | null, "radius": number | null }. 
              Command: "${text}"`
          });
      
          // ✅ Fixed JSON extraction
          const result = JSON.parse(response.output_text || "{}");
      
          // 4️⃣ Get location
          const { coords } = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced
          });
      
          // 5️⃣ Route based on action
          if (result.action === "show_crops") {
            router.push({
              pathname: "/crops-summary",
              params: {
                radius: result.radius ?? 1000,
                lang: detectedLang,
                lat: coords.latitude,
                lon: coords.longitude
              }
            });
          } else if (result.action === "show_crop_availability" && result.cropName) {
            router.push({
              pathname: "/crops-summary", 
              params: { cropName: result.cropName, lang: detectedLang }
            });
          }
        } catch (err) {
          console.error("Voice command failed:", err);
          Speech.speak("Sorry, I could not understand that.");
        }
      }
      

  return { handleVoiceCommand };
}
