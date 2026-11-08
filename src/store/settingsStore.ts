import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Couleur } from '../engine/types';

export type OrdreTriCouleur = Couleur[];
export type OrdreValeur = 'croissant' | 'decroissant'; // 2 -> A ou A -> 2
export type DirectionTri = 'gauche_droite' | 'droite_gauche';
export type Langue = 'fr' | 'en' | 'nl' | 'de' | 'es' | 'pt';

const COULEURS = ['Rouge', 'Bleu', 'Vert', 'Jaune', 'Noir', 'Blanc', 'Violet', 'Orange'];
const ADJECTIFS = ['Grand', 'Petit', 'Fort', 'Rapide', 'Sage', 'Brave', 'Fier', 'Calme'];
const NOMS = ['Lion', 'Aigle', 'Loup', 'Ours', 'Renard', 'Faucon', 'Tigre', 'Lynx'];

const genererPseudoAleatoire = () => {
  const c = COULEURS[Math.floor(Math.random() * COULEURS.length)];
  const a = ADJECTIFS[Math.floor(Math.random() * ADJECTIFS.length)];
  const n = NOMS[Math.floor(Math.random() * NOMS.length)];
  return `${c} ${a} ${n}`;
};

interface SettingsState {
  pseudo: string;
  nbManchesParPartie: number;
  ordreCouleurs: OrdreTriCouleur;
  ordreValeur: OrdreValeur;
  directionTri: DirectionTri;
  autoJeu: boolean;
  autoEnchere: boolean;
  langue: Langue;
  hasSeenOnboarding: boolean;
  vibration: boolean;
  son: boolean;
  animationDonne: boolean;
  coachCredits: number;
  lastDailyRewardDate: string | null;

  setPseudo: (pseudo: string) => void;
  setNbManchesParPartie: (nb: number) => void;
  setOrdreCouleurs: (ordre: OrdreTriCouleur) => void;
  setOrdreValeur: (ordre: OrdreValeur) => void;
  setDirectionTri: (direction: DirectionTri) => void;
  setAutoJeu: (auto: boolean) => void;
  setAutoEnchere: (auto: boolean) => void;
  setLangue: (langue: Langue) => void;
  setHasSeenOnboarding: (val: boolean) => void;
  setVibration: (val: boolean) => void;
  setSon: (val: boolean) => void;
  setAnimationDonne: (val: boolean) => void;
  useCoachCredit: () => boolean;
  addCoachCredits: (amount: number) => void;
  checkDailyReward: () => void;
  genererPseudoAleatoire: () => string;
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
      pseudo: genererPseudoAleatoire(),
      nbManchesParPartie: 13,
      ordreCouleurs: DEFAULT_ORDRE_COULEURS,
      ordreValeur: 'croissant',
      directionTri: 'gauche_droite',
      autoJeu: false,
      autoEnchere: false,
      langue: 'fr',
      hasSeenOnboarding: false,
      vibration: true,
      son: true,
      animationDonne: true,
      coachCredits: 5,
      lastDailyRewardDate: null,

      setPseudo: (pseudo) => set({ pseudo }),
      setNbManchesParPartie: (nb) => set({ nbManchesParPartie: nb }),
      setOrdreCouleurs: (ordre) => set({ ordreCouleurs: ordre }),
      setOrdreValeur: (ordre) => set({ ordreValeur: ordre }),
      setDirectionTri: (direction) => set({ directionTri: direction }),
      setAutoJeu: (auto) => {
        set({ autoJeu: auto });
        if (auto) {
          const { useGameStore } = require('./gameStore');
          const gameStore = useGameStore.getState();
          if (gameStore.phase === 'jeu' && gameStore.tourDeJoueur === 0) {
            setTimeout(() => gameStore._faireProchaineActionIA(), 200);
          }
        }
      },
      setAutoEnchere: (auto) => {
        set({ autoEnchere: auto });
        if (auto) {
          const { useGameStore } = require('./gameStore');
          const gameStore = useGameStore.getState();
          if (gameStore.phase === 'encheres' && gameStore.etatEnchere.joueurCourantId === 0) {
            setTimeout(() => gameStore._avancerEncheres(), 200);
          }
        }
      },
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
      genererPseudoAleatoire: () => genererPseudoAleatoire(),
    }),
    {
      name: 'allwhist-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
