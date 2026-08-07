import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Couleur } from '../engine/types';

export type OrdreTriCouleur = Couleur[];
export type OrdreValeur = 'croissant' | 'decroissant'; // 2 -> A ou A -> 2
export type DirectionTri = 'gauche_droite' | 'droite_gauche';
export type Langue = 'fr' | 'en' | 'nl' | 'de' | 'es' | 'pt';

interface SettingsState {
  ordreCouleurs: OrdreTriCouleur;
  ordreValeur: OrdreValeur;
  directionTri: DirectionTri;
  autoJeu: boolean;
  langue: Langue;
  hasSeenOnboarding: boolean;
  vibration: boolean;
  son: boolean;
  animationDonne: boolean;
  coachCredits: number;
  lastDailyRewardDate: string | null;

  setOrdreCouleurs: (ordre: OrdreTriCouleur) => void;
  setOrdreValeur: (ordre: OrdreValeur) => void;
  setDirectionTri: (direction: DirectionTri) => void;
  setAutoJeu: (auto: boolean) => void;
  setLangue: (langue: Langue) => void;
  setHasSeenOnboarding: (val: boolean) => void;
  setVibration: (val: boolean) => void;
  setSon: (val: boolean) => void;
  setAnimationDonne: (val: boolean) => void;
  useCoachCredit: () => boolean;
  addCoachCredits: (amount: number) => void;
  checkDailyReward: () => void;
}

const DEFAULT_ORDRE_COULEURS: OrdreTriCouleur = [
  Couleur.COEUR,
  Couleur.CARREAU,
  Couleur.TREFLE,
  Couleur.PIQUE,
];

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ordreCouleurs: DEFAULT_ORDRE_COULEURS,
      ordreValeur: 'croissant',
      directionTri: 'gauche_droite',
      autoJeu: false,
      langue: 'fr',
      hasSeenOnboarding: false,
      vibration: true,
      son: true,
      animationDonne: true,
      coachCredits: 5,
      lastDailyRewardDate: null,

      setOrdreCouleurs: (ordre) => set({ ordreCouleurs: ordre }),
      setOrdreValeur: (ordre) => set({ ordreValeur: ordre }),
      setDirectionTri: (direction) => set({ directionTri: direction }),
      setAutoJeu: (auto) => set({ autoJeu: auto }),
      setLangue: (langue) => set({ langue }),
      setHasSeenOnboarding: (val) => set({ hasSeenOnboarding: val }),
      setVibration: (val) => set({ vibration: val }),
      setSon: (val) => set({ son: val }),
      setAnimationDonne: (val) => set({ animationDonne: val }),
      useCoachCredit: () => {
        const { coachCredits } = get();
        if (coachCredits > 0) {
          set({ coachCredits: coachCredits - 1 });
          return true;
        }
        return false;
      },
      addCoachCredits: (amount) => set({ coachCredits: get().coachCredits + amount }),
      checkDailyReward: () => {
        const { lastDailyRewardDate, coachCredits } = get();
        const today = new Date().toISOString().split('T')[0];
        if (lastDailyRewardDate !== today) {
          set({
            coachCredits: coachCredits + 2,
            lastDailyRewardDate: today
          });
        }
      },
    }),
    {
      name: 'allwhist-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
