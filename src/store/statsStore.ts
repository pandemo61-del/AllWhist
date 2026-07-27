import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StatErreur {
  type: string;
  titre: string;
  compte: number;
}

interface StatsState {
  totalManches: number;
  totalChutesJoueur: number;
  totalChutesIA: number;
  erreursFrequentesJoueur: StatErreur[];
  precisionMoyenneJoueur: number; // 0..100
  precisionMoyenneIA: number;     // 0..100
  historiquePrecision: number[];  // Dernières 20 manches (joueur)

  enregistrerManche: (reussite: boolean, erreurs: any[], solisteId: number) => void;
  resetStats: () => void;
}

export const useStatsStore = create<StatsState>()(
  persist(
    (set, get) => ({
      totalManches: 0,
      totalChutesJoueur: 0,
      totalChutesIA: 0,
      erreursFrequentesJoueur: [],
      precisionMoyenneJoueur: 0,
      precisionMoyenneIA: 0,
      historiquePrecision: [],

      enregistrerManche: (reussite, erreurs, solisteId) => {
        const state = get();
        const nouveauxTotal = state.totalManches + 1;

        const estJoueurSoliste = solisteId === 0;
        let nouvellesChutesJoueur = state.totalChutesJoueur;
        let nouvellesChutesIA = state.totalChutesIA;

        if (!reussite) {
          if (estJoueurSoliste) nouvellesChutesJoueur++;
          else nouvellesChutesIA++;
        }

        // Mise à jour des erreurs fréquentes du joueur
        let nouvellesErreurs = [...state.erreursFrequentesJoueur];
        erreurs.forEach(err => {
          if (err.joueurId === 0) {
            const index = nouvellesErreurs.findIndex(e => e.titre === err.titre);
            if (index > -1) {
              nouvellesErreurs[index].compte += 1;
            } else {
              nouvellesErreurs.push({ type: err.type, titre: err.titre, compte: 1 });
            }
          }
        });

        // Calcul de précision (13 plis - erreurs) / 13
        const calculerPrecision = (id: number) => {
            const errs = erreurs.filter(e => e.joueurId === id).length;
            return Math.max(0, (13 - errs) / 13) * 100;
        };

        const precJoueur = calculerPrecision(0);
        const precIA = (calculerPrecision(1) + calculerPrecision(2) + calculerPrecision(3)) / 3;

        const nouvellePrecisionJoueur = state.precisionMoyenneJoueur === 0
          ? precJoueur
          : (state.precisionMoyenneJoueur * state.totalManches + precJoueur) / nouveauxTotal;

        const nouvellePrecisionIA = state.precisionMoyenneIA === 0
          ? precIA
          : (state.precisionMoyenneIA * state.totalManches + precIA) / nouveauxTotal;

        const nouvelHistorique = [...state.historiquePrecision, precJoueur].slice(-20);

        set({
          totalManches: nouveauxTotal,
          totalChutesJoueur: nouvellesChutesJoueur,
          totalChutesIA: nouvellesChutesIA,
          erreursFrequentesJoueur: nouvellesErreurs.sort((a, b) => b.compte - a.compte).slice(0, 10),
          precisionMoyenneJoueur: nouvellePrecisionJoueur,
          precisionMoyenneIA: nouvellePrecisionIA,
          historiquePrecision: nouvelHistorique,
        });
      },

      resetStats: () => set({
        totalManches: 0,
        totalChutesJoueur: 0,
        totalChutesIA: 0,
        erreursFrequentesJoueur: [],
        precisionMoyenneJoueur: 0,
        precisionMoyenneIA: 0,
        historiquePrecision: [],
      }),
    }),
    {
      name: 'allwhist-stats-v2',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
