// components/VoiceTranscriptionBox.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { X } from 'lucide-react-native';

interface Props {
  text: string | null;
  onClose: () => void;
}

export default function VoiceTranscriptionBox({ text, onClose }: Props) {
    console.log("transcribed text: ", text);
    if(text !== null)
        Alert.alert(text);
  return (
    <View className="absolute top-16 left-4 right-4 bg-white shadow-lg rounded-2xl p-4 flex-row items-start">
      <View className="flex-1">
        <Text className="text-gray-900">{text}</Text>
      </View>
      <TouchableOpacity onPress={onClose}>
        <X size={20} color="gray" />
      </TouchableOpacity>
    </View>
  );
}
