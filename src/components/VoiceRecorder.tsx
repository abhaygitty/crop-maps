import React,  { useState, useEffect} from "react";
import { Audio } from "expo-av";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { Mic, Square, X } from "lucide-react-native"; 
import OpenAI from "openai";
// import { OPENAI_API_KEY } from "@env";
// import Constants from "expo-constants";


interface VoiceRecorderProps {
    onTranscription: (text: string) => void;
}

export default function VoiceRecorder({ onTranscription }: VoiceRecorderProps) {
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isProcessingVoice, setIsProcessingVoice] = useState(false);

    async function startRecording() {
        try {
            console.log("Requesting permission..");
            await Audio.requestPermissionsAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true
            });

            console.log("Starting recording..");
            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            setRecording(recording);
            console.log("Recording Started");
        } catch(error) {
            console.error("Failed to start recording", error);
        }
    }

    async function stopRecording() {
        console.log("Stopiing recording..");
        if(!recording) return;
        setRecording(null);
        await recording.stopAndUnloadAsync();

        const uri = recording.getURI();
        console.log("Recording stopped and stored at", uri);
        if(!uri) return;

        setIsProcessingVoice(true);
        try{
            const formData = new FormData();
            formData.append("file", {
            uri,
            name: "recording.m4a",
            type: "audio/m4a"
            } as any);
            formData.append("model", "gpt-4o-mini-transcribe");

            const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
            },
            body: formData
            });

            const data = await res.json();
            onTranscription(data.text);
            // onTranscription("data.text");
        } catch(error) {
            console.error("Transcription failed: ", error);
        } finally {
            setIsProcessingVoice(false);
        }
    }

    return (
        <View className="absolute bottom-6 right-6">
            <TouchableOpacity
                className="bg-green-600 p-4 roudned-full shadow-lg items-center justify-center"
                onPress={recording ? stopRecording : startRecording}
            >
                {recording ? <Square size={24} color="black" />: <Mic size={24} color="black" />}
            </TouchableOpacity>

            {isProcessingVoice && (
                <View className="absolute bottom-20 right-0 bg-white p-2 rounded-lg shadow-md">
                    <ActivityIndicator size="small" color="#000" />
                    <Text className="text-xz mt-1"> Processing voice...</Text>
                </View>
            )}
        </View>
    );
}

