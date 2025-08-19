import { create } from "zustand";
import { Parcel, CropCycle, Status } from "../types";

function computeStatus(harvestISO: string): Status {
  const d = new Date(harvestISO);
  const today = new Date();
  const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "OVERDUE";
  if (diffDays <= 14) return "DUE_SOON";
  return "ON_TRACK";
}

export interface AppState {
  parcels: Parcel[];
  addParcel: (p: Parcel) => void;
  addOrUpdateCycle: (parcelId: string, cycle: CropCycle) => void;
  getStatusForParcel: (parcelId: string) => Status | undefined;
}

export const useParcels = create<AppState>((set, get) => ({
  parcels: [
    {
      id: "p1",
      name: "North Field",
      point: { latitude: 12.9716, longitude: 77.5946 },
      areaHa: 2.3,
      cycles: [
        {
          id: "c1",
          cropType: "Wheat",
          harvestDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 25).toISOString(),
          expectedQty: 3.2,
          unit: "ton",
          updatedAt: new Date().toISOString(),
        },
      ],
    },
  ],
  addParcel: (p) => set((s) => ({ parcels: [...s.parcels, p] })),
  addOrUpdateCycle: (parcelId, cycle) =>
    set((s) => ({
      parcels: s.parcels.map((p) =>
        p.id === parcelId
          ? {
              ...p,
              cycles: p.cycles.some((c) => c.id === cycle.id)
                ? p.cycles.map((c) => (c.id === cycle.id ? cycle : c))
                : [...p.cycles, cycle],
            }
          : p
      ),
    })),
  getStatusForParcel: (parcelId) => {
    const p = get().parcels.find((x) => x.id === parcelId);
    if (!p || p.cycles.length === 0) return undefined;
    const latest = [...p.cycles].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))[0];
    return computeStatus(latest.harvestDate);
  },
}));