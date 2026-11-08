import { auth, saveUserSettings, saveUserStats, getUserSettings, getUserStats } from './firebase';
import { useSettingsStore } from '../store/settingsStore';
import { useStatsStore } from '../store/statsStore';

let isInitialLoad = false;

export const initializeSync = () => {
  // Listen for auth changes to load data
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      console.log("User logged in:", user.uid);

      isInitialLoad = true;
      try {
        // Load settings from Firebase
        const cloudSettings = await getUserSettings(user.uid);
        if (cloudSettings) {
          useSettingsStore.setState(cloudSettings);
        }

        // Load stats from Firebase
        const cloudStats = await getUserStats(user.uid);
        if (cloudStats) {
          useStatsStore.setState(cloudStats);
        }
      } finally {
        isInitialLoad = false;
      }
    }
  });

  // Subscribe to store changes to save to Firebase
  useSettingsStore.subscribe((state) => {
    if (isInitialLoad) return;
    const user = auth.currentUser;
    if (user) {
      // Filtrer pour ne garder que les données, pas les fonctions de Zustand
      const {
        ordreCouleurs, ordreValeur, directionTri,
        autoJeu, autoEnchere, langue, hasSeenOnboarding,
        vibration, son
      } = state;

      saveUserSettings(user.uid, {
        ordreCouleurs, ordreValeur, directionTri,
        autoJeu, autoEnchere, langue, hasSeenOnboarding,
        vibration, son
      });
    }
  });

  useStatsStore.subscribe((state) => {
    if (isInitialLoad) return;
    const user = auth.currentUser;
    if (user) {
      // Filtrer les données des stats
      const {
        totalManches, totalChutesJoueur, totalChutesIA,
        erreursFrequentesJoueur, precisionMoyenneJoueur,
        precisionMoyenneIA, historiquePrecision
      } = state;

      saveUserStats(user.uid, {
        totalManches, totalChutesJoueur, totalChutesIA,
        erreursFrequentesJoueur, precisionMoyenneJoueur,
        precisionMoyenneIA, historiquePrecision
      });
    }
  });
};
