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