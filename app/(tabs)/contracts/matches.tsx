// app/(tabs)/contracts/matches.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { matchCommoditiesForFutureContract, CommodityPoolItem } from '../../../src/services/crop-matching';

type RequestShape = {
  cropName: string;
  requiredQty: number;
  deliveryDate: string;
  grade?: string;
  radiusKm?: number;
  insurance?: boolean;
};

export default function MatchesScreen() {
  const { request } = useLocalSearchParams<{ request?: string }>();
  const router = useRouter();
  const [reqObj, setReqObj] = useState<RequestShape | null>(null);
  const [results, setResults] = useState<CommodityPoolItem[]>([]);
  const [selectedPools, setSelectedPools] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const str = Array.isArray(request) ? request[0] : request;
    if (!str) return;
    try {
      const r = JSON.parse(str);
      setReqObj(r);
      (async () => {
        // call matching service (replace with DB-backed function)
        const pools = await matchCommoditiesForFutureContract({
          cropName: r.cropName,
          requiredQty: r.requiredQty,
          deliveryDate: r.deliveryDate,
          grade: r.grade,
          radiusKm: r.radiusKm,
        });
        setResults(pools);
      })();
    } catch (e) {
      console.error('Failed to parse request', e);
    }
  }, [request]);

  function toggleSelect(index: number) {
    setSelectedPools((s) => ({ ...s, [index]: !s[index] }));
  }

  function proceedToReview() {
    const chosen = results.filter((_, idx) => selectedPools[idx]);
    // If none selected, send top pool automatically
    const toSend = chosen.length > 0 ? chosen : results.slice(0, 1);
    const payload = {
      request: reqObj,
      chosenPools: toSend,
    };
    router.push({
      pathname: '/(tabs)/contracts/contract-review',
      params: { payload: JSON.stringify(payload) },
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Matching Commodity Pools</Text>
      {reqObj && (
        <View style={styles.reqSummary}>
          <Text style={{ fontWeight: '700' }}>{reqObj.cropName} • {reqObj.requiredQty} kg • by {reqObj.deliveryDate}</Text>
          <Text style={{ color: '#6b7280' }}>Grade: {reqObj.grade || 'Any'} • Radius: {reqObj.radiusKm || 100} km</Text>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(item, idx) => `${item.cropName}-${idx}`}
        renderItem={({ item, index }) => (
          <TouchableOpacity onPress={() => toggleSelect(index)} style={[styles.card, selectedPools[index] && styles.cardSelected]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '700' }}>{item.cropName} • Grade {item.qualityGrade}</Text>
              <Text style={{ fontWeight: '700' }}>{item.totalQty} kg</Text>
            </View>
            <Text style={{ color: '#374151' }}>Avg distance: {Math.round(item.avgDistanceKM)} km • ETA: {item.estimatedDeliveryDays} days</Text>
            <Text style={{ color: '#374151' }}>Price (indicative): ₹{item.pricePerKg}/kg</Text>
            <Text style={{ color: '#6b7280', marginTop: 6 }}>{item.summary}</Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.primaryBtn} onPress={proceedToReview}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Review Contract</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f7fbf6', marginTop: 40 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  reqSummary: { padding: 12, backgroundColor: '#fff', borderRadius: 8, marginBottom: 12 },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 10 },
  cardSelected: { borderWidth: 2, borderColor: '#1DB954' },
  primaryBtn: { backgroundColor: '#1DB954', padding: 24, borderRadius: 12, alignItems: 'center', marginTop: 8, marginBottom: 80 },
});
