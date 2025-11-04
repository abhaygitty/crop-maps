import React, { useState } from "react";
import { View, Text, Modal, StyleSheet, TextInput, TouchableOpacity, Platform, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { TOKENS } from "../theme";
import { Unit, CropCycle } from "../types";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (cycle: CropCycle) => void;
  defaultDate?: Date;
}

export const CropTagSheet: React.FC<Props> = ({ visible, onClose, onSave, defaultDate }) => {
  const [crop, setCrop] = useState("Wheat");
  const [qty, setQty] = useState("1.0");
  const [unit, setUnit] = useState<Unit>("ton");
  const [date, setDate] = useState<Date>(defaultDate ?? new Date());
  const [showPicker, setShowPicker] = useState(Platform.OS === "ios");

  function handleSave() {
    const cycle: CropCycle = {
      id: Math.random().toString(36).slice(2),
      cropType: crop,
      expectedQty: Number(qty) || 0,
      unit,
      harvestDate: date.toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSave(cycle);
    onClose();
  }

  return (
    
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1, justifyContent: "center", padding: 4 }}
        >
          <View style={styles.overlay}>
            <View style={styles.sheet}>
              <Text style={styles.title}>Tag Crop</Text>

              <Text style={styles.label}>Crop</Text>
              <TextInput style={styles.input} value={crop} onChangeText={setCrop} />

              <Text style={styles.label}>Harvest Date</Text>
              {Platform.OS !== "ios" && (
                <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.selectBtn}>
                  <Text style={{ color: TOKENS.text }}>{date.toDateString()}</Text>
                </TouchableOpacity>
              )}
              {showPicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  onChange={(_, d) => {
                    if (d) setDate(d);
                    if (Platform.OS !== "ios") setShowPicker(false);
                  }}
                />
              )}
            
                  <Text style={styles.label}>Expected Quantity</Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={qty}
                      onChangeText={setQty}
                      keyboardType="decimal-pad"
                    />
                    <TouchableOpacity style={styles.unitBtn} onPress={() => setUnit(unit === "ton" ? "kg" : unit === "kg" ? "bags" : "ton")}>
                      <Text style={{ color: "#fff", fontWeight: "600" }}>{unit}</Text>
                    </TouchableOpacity>
                  </View>
                
                  <View style={styles.row}>
                    <TouchableOpacity onPress={onClose} style={[styles.cta, { backgroundColor: TOKENS.neutral }]}>
                      <Text style={[styles.ctaText, { color: TOKENS.text }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSave} style={[styles.cta, { backgroundColor: TOKENS.primary }]}>
                      <Text style={styles.ctaText}>Save</Text>
                    </TouchableOpacity>
                  </View>
            
            </View>
          </View>
        </KeyboardAvoidingView>      
      </TouchableWithoutFeedback>
    </Modal>
      
    
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.2)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: TOKENS.surface,
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  title: { fontSize: 18, fontWeight: "700", color: TOKENS.text, marginBottom: 8 },
  label: { color: TOKENS.muted, marginTop: 8, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: TOKENS.text,
    backgroundColor: "#fff",
  },
  selectBtn: {
    borderWidth: 1,
    borderColor: TOKENS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  unitBtn: { backgroundColor: TOKENS.primary, borderRadius: 12, paddingHorizontal: 14, justifyContent: "center" },
  row: { flexDirection: "row", gap: 10, marginTop: 14 },
  cta: { flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: "center" },
  ctaText: { color: "#fff", fontWeight: "700" },
});