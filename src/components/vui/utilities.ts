import { Crop } from "@/src/db/Database";
import { CropQuery } from "@/src/types";
import { getCropCentroidFromBoundary, haversineDistance, reverseGeocode } from "@/src/utils/geocode";
import { normalizeCropName } from "@/src/utils/normalize";
import { BENGALURUURBAN, CHIKKABALLAPUR, COOKCOUNTY, GUNA, LASSENCOUNTY, OPENAI_API_KEY, SANFRANCISCOCOUNTY } from "@/src/utils/security/keys";
import { translateToEnglish } from "@/src/utils/translate-to-english";
import { router } from "expo-router";
import OpenAI from "openai";
import { useState } from "react";
import * as Location from "expo-location";

const openAIClient = new OpenAI({
    apiKey: OPENAI_API_KEY,
});

export async function getCurrentLocation() {
    let currentLocation = await Location.getCurrentPositionAsync({});
    const currentLocationCordinates = CHIKKABALLAPUR;
    const [lat, lon] = currentLocationCordinates.split(":").map(Number);
    currentLocation.coords.latitude = lat;
    currentLocation.coords.longitude = lon;
    const locationName = await reverseGeocode(currentLocationCordinates);
    console.log("current location: ", currentLocationCordinates);
    console.log("current location name: ", locationName);
    return currentLocation;
}

export async function renderCropQueryResults(transcribedText: string, crops: Crop[]) {
    if(transcribedText) {
      console.log("Transcription available");
      const currentUserLocation = await getCurrentLocation();
      // fetch user's current location
      const userLocation = currentUserLocation ? {lat: currentUserLocation.coords.latitude, lng: currentUserLocation.coords.longitude} : {lat: 13.004881, lng: 77.708927};

      const { englishText, language } = await translateToEnglish(transcribedText);

      // parse transcription to crop query scheme
      let cropQuery = await parseCropQuery(englishText, userLocation);
      if(!cropQuery){
        cropQuery = { radiusKm: 1000,
          cropName: "rice",
          startDate: "2025-01-01", // YYYY-MM-DD
          endDate: "2025-12-31",
          location: {latitude: 13.004834, longitude: 77.708848 },
        };
      } else {
        if(cropQuery.cropName) {
          console.log("cropQuery before normalizing: ", cropQuery);
          cropQuery.cropName = normalizeCropName(cropQuery.cropName);
          console.log("cropQuery after normalizing: ", cropQuery);
        }
      }
      
      // filter crops by query
      const filteredResults = filterCropsByCropQuery(crops, cropQuery);
      const cropsStr = JSON.stringify(filteredResults);
      // navigates to the crop query summary screen with the serialized results
      router.push({
        pathname: "/crop-query-results",
        params: { cropsFromTranscribedFilter: cropsStr}
      });
      
    }
    console.log("Transcription not available. Returning dummy crop query");
}

async function parseCropQuery(transcribedText: string, userLocation: {lat: number, lng: number}): Promise<CropQuery> {
    const prompt = `
    Extract structured query parameters from the user request. Return JSON only.
    User request: "${transcribedText}"

    The JSON should have:
    - cropName (string, optional)
    - radiusKm (number, default 20000)
    - startDate (YYYY-MM-DD, optional)
    - endDate (YYYY-MM-DD, optional)
    Use location as: {"latitude": ${userLocation.lat}, "longitude": ${userLocation.lng}}
    `;

    const response = await openAIClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
    });

    const rawText = response.choices[0].message?.content || "{}";

    // 🧹 Clean up model output: remove markdown formatting & non-JSON text
    const cleanedText = rawText
        .replace(/```json\s*/g, "")  // remove ```json
        .replace(/```/g, "")         // remove ```
        .trim();

    try {
        const cropQuery = JSON.parse(cleanedText) as CropQuery;
        return cropQuery;
    } catch (error) {
        console.error("❌ Failed to parse JSON:", error, "\nRaw output:", rawText);
        return {} as CropQuery;
    }
}

function filterCropsByCropQuery(crops: Crop[], query: CropQuery) {
    const cropsList = crops.filter(c => {
      const {lat, lng} = getCropCentroidFromBoundary(c.boundary);
      const distance = haversineDistance(
        query.location!.latitude,
        query.location!.longitude,
        lat,
        lng
      );
      const withinRadius = distance <= query.radiusKm;
      const matchesName = query.cropName ? c.cropName.toLowerCase() === query.cropName.toLowerCase() : false;
      const inDateRange = (query.startDate && c.harvestDate >= query.startDate) &&
                          (query.endDate && c.harvestDate <= query.endDate);
      if(query.cropName) {
        if(query.radiusKm) {
            return matchesName && withinRadius;
        } else 
            return matchesName;
      } else if(query.radiusKm) {
        return withinRadius;
      } else
        return (matchesName || withinRadius) || inDateRange;
    });
    return cropsList;
  }
