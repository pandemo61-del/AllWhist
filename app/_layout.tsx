// ─────────────────────────────────────────────
//  app/_layout.tsx — Layout racine Expo Router
// ─────────────────────────────────────────────

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import mobileAds from 'react-native-google-mobile-ads';
import { Colors } from '../src/constants/theme';

export default function RootLayout() {
  useEffect(() => {
    // Initialisation asynchrone du SDK
    mobileAds()
      .initialize()
      .then(adapterStatuses => {
        // Initialisation réussie
        if (__DEV__) {
          console.log('AdMob Initialized');
        }
      });
  }, []);

  return (
    <>
      <StatusBar hidden={true} translucent={true} />
      <Stack
        screenOptions={{
          headerStyle:      { backgroundColor: Colors.bg },
          headerTintColor:  Colors.textPrimary,
          headerTitleStyle: { fontWeight: '600', fontSize: 17 },
          contentStyle:     { backgroundColor: Colors.bg },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="index"     options={{ headerShown: false }} />
        <Stack.Screen name="variantes" options={{ title: 'Choisir une variante' }} />
        <Stack.Screen name="game/[varianteId]" options={{ headerShown: false }} />
        <Stack.Screen name="learn/[varianteId]" options={{ title: 'Apprendre' }} />
        <Stack.Screen name="stats" options={{ title: 'Statistiques & Coach' }} />
      </Stack>
    </>
  );
}
