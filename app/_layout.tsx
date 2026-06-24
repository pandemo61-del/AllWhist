// ─────────────────────────────────────────────
//  app/_layout.tsx — Layout racine Expo Router
// ─────────────────────────────────────────────

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../src/constants/theme';

export default function RootLayout() {
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
      </Stack>
    </>
  );
}
