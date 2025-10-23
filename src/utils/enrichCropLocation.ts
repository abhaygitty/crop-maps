import * as Location from "expo-location";
import { Crop, updateCropLocationName } from "../db/Database";
import { reverseGeocode } from "./geocode";

export async function enrichCropLocation(crop: Crop) {
    try {
        // skip if already available
        if(crop.locationName)
            return crop;
        const locationName = await reverseGeocode(crop.location);
        if(locationName) {
            await updateCropLocationName(crop.id, locationName);
            return { ...crop, locationName};
        }
    } catch(error) {
        console.error("Reverse geocode failed for crop", crop.id, error);
    }
    return crop;
}