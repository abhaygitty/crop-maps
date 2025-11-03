// app/(tabs)/contracts/contract-review.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
// import InsuranceToggle from '../../../app/components/InsuranceToggle';
import { createContract } from '../../../src/services/contracts';
import InsuranceToggle from '@/src/components/InsuranceToggle';

export default function ContractReviewScreen() {
  const { payload } = useLocalSearchParams<{ payload?: string }>();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [insured, setInsured] = useState(false);

  useEffect(() => {
    const str = Array.isArray(payload) ? payload[0] : payload;
    if (!str) return;
    try {
      setData(JSON.parse(str));
      setInsured(Boolean(JSON.parse(str).request.insurance));
    } catch (e) {
      console.error('parse error', e);
    }
  }, [payload]);

  async function confirmContract() {
    if (!data) return;
    // prepare contract object
    const contract = {
      request: data.request,
      chosenPools: data.chosenPools,
      insured,
      createdAt: new Date().toISOString(),
      status: 'confirmed',
    };

    try {
      // persist contract (DB) and update farmer inventory (service handles anonymized distribution)
      await createContract(contract);
      Alert.alert('Contract Created', 'Your future contract has been recorded.');
      router.replace('/(tabs)/index'); // or navigate to orders screen
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to create contract. Try again.');
    }
  }

  if (!data) return <View style={styles.container}><Text>Loading...</Text></View>;

  const req = data.request;
  const totalMatched = data.chosenPools.reduce((s: number, p: any) => s + p.totalQty, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Review Contract</Text>

      <View style={styles.card}>
        <Text style={{ fontWeight: '700' }}>{req.cropName} • {req.requiredQty} kg</Text>
        <Text style={{ color: '#6b7280' }}>Delivery: {req.deliveryDate}</Text>
        <Text style={{ color: '#374151', marginTop: 6 }}>Matched Quantity: {totalMatched} kg</Text>
      </View>

      <Text style={{ marginTop: 10, fontWeight: '700' }}>Selected Pools (Anonymized)</Text>
      {data.chosenPools.map((p: any, idx: number) => (
        <View key={idx} style={styles.poolCard}>
          <Text style={{ fontWeight: '700' }}>{p.cropName} • Grade {p.qualityGrade}</Text>
          <Text>{p.totalQty} kg • Avg distance {Math.round(p.avgDistanceKM)} km</Text>
          <Text style={{ color: '#6b7280' }}>{p.summary}</Text>
        </View>
      ))}

      <View style={{ marginTop: 12 }}>
        <InsuranceToggle value={insured} onChange={setInsured} />
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={confirmContract}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Confirm & Create Contract</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f7fbf6', marginTop: 40 },
  title: { fontSize: 18, fontWeight: '800' },
  card: { marginTop: 12, padding: 12, borderRadius: 8, backgroundColor: '#fff' },
  poolCard: { marginTop: 10, padding: 10, borderRadius: 8, backgroundColor: '#fff' },
  primaryBtn: { marginTop: 18, backgroundColor: '#1DB954', padding: 14, borderRadius: 12, alignItems: 'center' },
});
