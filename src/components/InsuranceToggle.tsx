// app/components/InsuranceToggle.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function InsuranceToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '700' }}>Insurance</Text>
        <Text style={{ color: '#6b7280' }}>Protect the contract against crop loss, drought or price drops.</Text>
      </View>
      <TouchableOpacity onPress={() => onChange(!value)} style={[styles.toggle, value ? styles.on : styles.off]}>
        <Text style={{ color: '#fff' }}>{value ? 'Enabled' : 'Disabled'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#fff', borderRadius: 8 },
  toggle: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  on: { backgroundColor: '#16a34a' },
  off: { backgroundColor: '#6b7280' },
});
