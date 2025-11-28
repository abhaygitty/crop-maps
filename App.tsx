import React, { useEffect, useState } from "react";
import { getCropsList } from "./src/db/Database";
import { StyleSheet } from 'react-native';
import { createNativeStackNavigator } from "@react-navigation/native-stack";


export type RootStackParamList = {
  Map: undefined;
  CropList: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [crops, setCrops] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      // await initDB();
      const rows = await getCropsList();
      setCrops(rows);
    })();
  }, []);

  return (
    // <>
    //   <NavigationContainer>
    //     <Stack.Navigator>
    //       {/* <Stack.Screen name="Map" component={MapScreen} options={{ title: "Crop Map" }}/> */}
    //       <Stack.Screen name="CropList" component={CropListScreen} options={{ title: "My Crops" }}/>
    //     </Stack.Navigator>
    //   </NavigationContainer>
    //   <SafeAreaView style={{ flex: 1 }}>
    //      <StatusBar barStyle="dark-content" />
    //      {/* <MapScreen /> */}
    //    </SafeAreaView>
    // </>
    <></>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
