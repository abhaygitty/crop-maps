import React, { useState } from "react";
import { View, Platform, StyleSheet, Text } from "react-native";
import { Picker } from "@react-native-picker/picker";
import i18n from "../i18n";

export default function LanguageSelector() {
    const [selectedLang, setSelectedLang] = useState(i18n.language);

    const handleLanguageChange = (lang: string) => {
        setSelectedLang(lang);
        i18n.changeLanguage(lang);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>🌐 Select Language</Text>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={selectedLang}
                    onValueChange={handleLanguageChange}
                    mode={Platform.OS === "android" ? "dropdown" : "dialog" }
                    style={styles.picker}
                >
                    <Picker.Item label="English" value="en"/>
                    <Picker.Item label="हिन्दी (Hindi)" value="hi" />
                    <Picker.Item label="ಕನ್ನಡ (Kannada)" value="kn" />
                    <Picker.Item label="தமிழ் (Tamil)" value="ta" />
                    <Picker.Item label="తెలుగు (Telugu)" value="te" />
                    <Picker.Item label="മലയാളം (Malayalam)" value="ml" />
                </Picker>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        margin: 12,
        backgroundColor: "#fff",
        borderRadius: 8,
        padding: 10,
        elevation:3
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 6
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        overflow: "hidden"
    },
    picker: {
        height: 50,
        width: "40%"
    }
});
