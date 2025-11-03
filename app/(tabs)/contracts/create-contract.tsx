// app/(tabs)/contracts/create.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

type QualityGrade = 'A' | 'B' | 'C';

export default function CreateContractScreen() {
  const router = useRouter();
  const [cropName, setCropName] = useState('');
  const [quantity, setQuantity] = useState<string>('');
  const [deliveryDate, setDeliveryDate] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [grade, setGrade] = useState<QualityGrade>('A');
  const [insurance, setInsurance] = useState<boolean>(false);
  const [radiusKm, setRadiusKm] = useState<string>('100'); // default 100 km

  function onSubmit() {
    const req = {
      cropName: cropName.trim(),
      requiredQty: Number(quantity || 0),
      deliveryDate: deliveryDate.toISOString().split('T')[0],
      grade,
      insurance,
      radiusKm: Number(radiusKm || 100),
      createdAt: new Date().toISOString(),
    };

    // Send as string param
    router.push({
      pathname: '/(tabs)/contracts/matches',
      params: { request: JSON.stringify(req) },
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Future Contract</Text>

      <Text style={styles.label}>Crop</Text>
      <TextInput
        value={cropName}
        onChangeText={setCropName}
        placeholder="e.g. Tomato"
        style={styles.input}
      />

      <Text style={styles.label}>Quantity (kg)</Text>
      <TextInput
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="numeric"
        placeholder="e.g. 2000"
        style={styles.input}
      />

      <Text style={styles.label}>Delivery Date</Text>
      <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.input}>
        <Text>{deliveryDate.toDateString()}</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={deliveryDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(_, d) => {
            setShowPicker(false);
            if (d) setDeliveryDate(d);
          }}
        />
      )}

      <Text style={styles.label}>Quality Grade</Text>
      <View style={styles.pickerWrap}>
        <Picker selectedValue={grade} onValueChange={(v) => setGrade(v as QualityGrade)}>
          <Picker.Item label="Grade A (Best)" value="A" />
          <Picker.Item label="Grade B" value="B" />
          <Picker.Item label="Grade C" value="C" />
        </Picker>
      </View>

      <Text style={styles.label}>Search Radius (km)</Text>
      <TextInput
        value={radiusKm}
        onChangeText={setRadiusKm}
        keyboardType="numeric"
        placeholder="e.g. 100"
        style={styles.input}
      />

      <View style={styles.row}>
        <Text style={styles.label}>Insurance</Text>
        <TouchableOpacity
          onPress={() => setInsurance((s) => !s)}
          style={[styles.toggle, insurance ? styles.toggleOn : styles.toggleOff]}
        >
          <Text style={{ color: '#fff' }}>{insurance ? 'On' : 'Off'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={onSubmit}>
        <Text style={styles.primaryBtnText}>Find Matching Commodities</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f7fbf6', marginTop: 40 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  label: { marginTop: 10, marginBottom: 6, fontWeight: '600' },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e6e6e6',
  },
  pickerWrap: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  toggle: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16 },
  toggleOn: { backgroundColor: '#16a34a' },
  toggleOff: { backgroundColor: '#9ca3af' },
  primaryBtn: {
    marginTop: 20,
    backgroundColor: '#1DB954',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
});
