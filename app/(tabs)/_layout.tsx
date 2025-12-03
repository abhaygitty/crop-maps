import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ProtectedRoute } from '@/src/components/ProtectedRoute';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <ProtectedRoute allowedRoles={["farmer", "buyer", "admin"]}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              // Use a transparent background on iOS to show the blur effect
              position: 'absolute',
            },
            default: {},
          }),
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Map',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Crops',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="contracts/create-contract"
          options={{
            title: 'Contract',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="0.circle.fill" color={color} />
          }}
        />
        <Tabs.Screen
          name="contracts/contract-review"
          options={{
            title: 'Review',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="0.circle.hi" color={color} />
          }}
        />
        <Tabs.Screen
          name="contracts/matches"
          options={{
            title: 'Matches',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="0.square.fill" color={color} />
          }}
        />
      </Tabs>
    </ProtectedRoute>
  );
}
