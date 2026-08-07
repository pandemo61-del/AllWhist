// ─────────────────────────────────────────────
//  COMPOSANT — Publicités
// ─────────────────────────────────────────────

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds, InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';
import { Colors } from '../constants/theme';

// Identifiants de test fournis par Google
const adUnitId = __DEV__
  ? TestIds.ADAPTIVE_BANNER
  : Platform.select({
      android: 'ca-app-pub-4266277576724378/2466658452',
      ios: 'ca-app-pub-3940256099942544/2934735716',
    }) || TestIds.ADAPTIVE_BANNER;

// Identifiant pour l'interstitiel de fin de manche
export const INTERSTITIAL_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : 'ca-app-pub-4266277576724378/8938170215';

// Identifiant pour l'interstitiel de fin de partie (Victoire/Score final)
export const END_GAME_INTERSTITIAL_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : 'ca-app-pub-4266277576724378/3423961991';

// Identifiant pour la publicité récompensée (Avis coach)
export const REWARDED_ID = __DEV__
  ? TestIds.REWARDED
  : 'ca-app-pub-4266277576724378/2043838232';

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
