// src/services/cropMatching.ts
// Simple mock matching service — replace with DB-driven matching logic
export type CommodityPoolItem = {
    cropName: string;
    qualityGrade: 'A' | 'B' | 'C';
    totalQty: number; // in kg
    avgDistanceKM: number;
    estimatedDeliveryDays: number;
    pricePerKg: number;
    summary: string;
  };
  
  // request shape used in matching
  type MatchRequest = {
    cropName: string;
    requiredQty: number;
    deliveryDate: string;
    grade?: string;
    radiusKm?: number;
  };
  
  /**
   * Replace this with your DB query:
   * - fetch farmer inventories for given crop and grade in radius
   * - aggregate into pools (e.g., by grade / region)
   * - compute avgDistanceKM, totalQty, ETA and price
   */
  export async function matchCommoditiesForFutureContract(req: MatchRequest): Promise<CommodityPoolItem[]> {
    // TODO: integrate real DB and distance calculations
    // This mock returns a couple of anonymized pools
    await new Promise((r) => setTimeout(r, 300)); // simulate latency
  
    const sample: CommodityPoolItem[] = [
      {
        cropName: req.cropName,
        qualityGrade: (req.grade as any) || 'A',
        totalQty: Math.min(2000, req.requiredQty + 300),
        avgDistanceKM: 72,
        estimatedDeliveryDays: 30,
        pricePerKg: 25,
        summary: 'Anonymized pool aggregated across local farmers. Quality checked.',
      },
      {
        cropName: req.cropName,
        qualityGrade: 'B',
        totalQty: 5000,
        avgDistanceKM: 120,
        estimatedDeliveryDays: 35,
        pricePerKg: 22,
        summary: 'Larger pool with mixed sizes and slightly longer transport time.',
      },
    ];
  
    return sample;
  }
  