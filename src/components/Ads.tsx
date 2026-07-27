// ─────────────────────────────────────────────
//  COMPOSANT — Publicités
// ─────────────────────────────────────────────

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { Colors } from '../constants/theme';

// Identifiants de test fournis par Google
// En production, vous devrez utiliser vos propres IDs
const adUnitId = __DEV__
  ? TestIds.ADAPTIVE_BANNER
  : Platform.select({
      android: 'ca-app-pub-3940256099942544/9214589741', // Test ID par défaut pour Android
      ios: 'ca-app-pub-3940256099942544/2934735716',     // Test ID par défaut pour iOS
    }) || TestIds.ADAPTIVE_BANNER;

interface AdBannerProps {
  marginTop?: number;
  marginBottom?: number;
}

/**
 * Affiche une bannière publicitaire adaptative.
 */
export const AdBanner: React.FC<AdBannerProps> = ({ marginTop = 0, marginBottom = 0 }) => {
  return (
    <View style={[styles.container, { marginTop, marginBottom }]}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdFailedToLoad={(error) => {
          if (__DEV__) {
            console.warn('Erreur de chargement de la pub:', error);
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
});
