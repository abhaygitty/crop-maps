export type Unit = "kg" | "ton" | "bags";
export type Status = "ON_TRACK" | "DUE_SOON" | "OVERDUE";

export interface CropCycle {
  id: string;
  cropType: string;
  harvestDate: string; // ISO
  expectedQty: number;
  unit: Unit;
  updatedAt: string; // ISO
}

export interface Parcel {
  id: string;
  name?: string;
  // point for quick pin even without polygon
  point: { latitude: number; longitude: number };
  // polygon omitted in starter (can be added later)
  areaHa?: number;
  cycles: CropCycle[];
}