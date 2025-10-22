import { LatLng } from "react-native-maps";
import * as Location from "expo-location";

// Simple geocoder using OpenStreetMap Nominatim (no key, respect usage policy in production)
export async function geocodeQuery(q: string): Promise<{ lat: number; lon: number; label: string }[]> {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`;
    const res = await fetch(url, { headers: { "Accept-Language": "en" } });
    const data = await res.json();
    return (data || []).map((d: any) => ({ lat: parseFloat(d.lat), lon: parseFloat(d.lon), label: d.display_name }));
  }
  
export function parseLatLng(input: string): { lat: number; lon: number } | null {
  const m = input.trim().match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lon = parseFloat(m[2]);
  if (isNaN(lat) || isNaN(lon)) return null;
  return { lat, lon };
}

export const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180; // in degrees
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + 
      Math.cos((lat1*Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * 
      Math.sin(dLon / 2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};


export function getCropCentroidFromBoundary(boundary: string | undefined): { lat: number, lng: number} {
  let coordinates: LatLng[];
  let centroid: LatLng;

  if(boundary) {
    coordinates = JSON.parse(boundary);
    // Step 1: find centroid
    centroid = {
      latitude:
        coordinates.reduce((sum, p) => sum + p.latitude, 0) /
        coordinates.length,
      longitude:
        coordinates.reduce((sum, p) => sum + p.longitude, 0) /
        coordinates.length,
    };
    return {lat: centroid.latitude, lng: centroid.longitude};
  }
  else return {lat: 72, lng: 112};  
};


export const reverseGeocode = async (locationStr: string): Promise<string> => {
  try {
      const [lat, lng] = locationStr.split(":").map(s => parseFloat(s));
      // const lat: number = 38.949551;
      // const lng: number = -121.134732;
      const res = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng});
      if(res && res.length > 0) {
          const place = res[0];
          return `${place.subregion || place.city || place.region || "Unknown"}`;
      }
      return "Unknown";
  } catch(e) {
      console.warn("Reverse geocode failed: ", e);
      return "Unknown";
  }
};

