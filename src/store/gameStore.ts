// ─────────────────────────────────────────────
//  STORE ZUSTAND — État global de la partie
// ─────────────────────────────────────────────
//
//  Usage :
//    const { phase, jouerCarte } = useGameStore();

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import {
  EtatPartie, PhaseJeu, Joueur, Pli, ContratJoue,
  Carte, Couleur, EtatEnchere,
} from '../engine/types';
import { creerJeu, melanger, distribuer, trierMain } from '../engine/deck';
import {
  cartesJouables, determinerGagnant,
  compterPlisParJoueur, mancheTerminee,
  estRevélationPartenaire,
} from '../engine/rules';
import { calculerScoreGenerique, construireScoreManche } from '../engine/scoring';
import { getVariante, getContrat, VariantConfig } from '../variants/index';
import { choisirCarte, choisirEnchere, NiveauIA } from '../ai/SimpleAI';
import { analyserPli } from '../engine/analysis';
import { useStatsStore } from './statsStore';
import { translations } from '../i18n/translations';
import { useSettingsStore } from './settingsStore';
import { auth, saveGame } from '../services/firebase';

import { Scenario } from '../data/scenarios';

// ─── Types du store ────────────────────────────

interface GameStore extends EtatPartie {
  // ──── Setters / Actions ────────────────────

  /** Initialise une nouvelle partie avec la variante donnée. */
  initialiserPartie: (varianteId: string, nomJoueur?: string) => void;

  /** Initialise une partie à partir d'un scénario prédéfini. */
  chargerScenario: (scenario: Scenario, nomJoueur?: string) => void;

  /** Le joueur humain joue une carte. */
  jouerCarte: (carte: Carte) => void;

  /** L'humain place une enchère. */
  placerEnchere: (contratId: string, atout?: Couleur, asPartenaire?: Carte) => void;

  /** L'humain passe son tour d'enchère. */
  passerEnchere: () => void;

  /** Passe au pli suivant (après affichage du résultat). */
  avancerPli: () => void;

  /** Passe à la manche suivante ou redistribue si tout le monde a passé. */
  avancerManche: (estRedistribution?: boolean) => void;

  /** Quitte immédiatement la phase d'annonce de contrat. */
  passerAnnonceContrat: () => void;

  /** Réinitialise tout. */
  resetPartie: () => void;

  /** Marque la partie comme terminée (toutes les manches finies). */
  terminerPartie: () => void;

  /** Trie la main du joueur humain selon les préférences actuelles. */
  appliquerTriParametres: () => void;

  /** Termine la phase de distribution et lance les enchères ou le jeu. */
  finaliserDistribution: () => void;

  // ──── Helpers lecture ─────────────────────

  variante: () => VariantConfig | null;
  cartesJouablesHumain: () => Carte[];
}

// ─── État initial ──────────────────────────────

const ETAT_INITIAL: EtatPartie = {
  varianteId: '',
  phase: 'idle',
  joueurs: [],
  manche: 0,
  scores: [0, 0, 0, 0],
  pliEnCours: { numero: 0, cartesJouees: [] },
  plisTermines: [],
  atout: null,
  tourDeJoueur: 0,
  donneur: 0,
  contratEnCours: null,
  etatEnchere: {
    joueurCourantId: 0,
    meilleureEnchere: null,
    passesConsecutifs: 0,
    historique: [],
  },
  historiqueManches: [],
  partenaireRévélé: false,
  estScenario: false,
  sessionGameId: '',
  notification: null,
};

// ─── Noms IA ───────────────────────────────────

const NOMS_IA = ['Marc', 'Julie', 'Paul'];
const NIVEAUX_IA: NiveauIA[] = ['moyen', 'moyen', 'expert'];

// ─── Store ─────────────────────────────────────

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...ETAT_INITIAL,

  // ──────────────────────────────────────────
  //  INITIALISATION
  // ──────────────────────────────────────────

  initialiserPartie(varianteId, nomJoueur) {
    const variante = getVariante(varianteId);
    const settings = useSettingsStore.getState();
    const pseudoEffective = nomJoueur || settings.pseudo || 'Vous';
    const donneur = Math.floor(Math.random() * 4); // Premier donneur aléatoire
    const sessionGameId = `G-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    const joueurs: Joueur[] = Array.from({ length: 4 }, (_, i) => ({
      id: i,
      nom: i === 0 ? pseudoEffective : NOMS_IA[i - 1],
      type: i === 0 ? 'humain' : `ia_${NIVEAUX_IA[i - 1]}` as any,
      main: [],
      plisGagnesTotal: 0,
    }));

    const jeu = melanger(creerJeu(variante.avecJoker));
    const mains = distribuer(jeu, 4, (donneur + 1) % 4);

    // Atout par retournement (Whist classique)
    let atout: Couleur | null = null;
    if (!variante.atoutChoisi) {
      const derniereCarte = jeu[jeu.length - 1];
      atout = derniereCarte.couleur;
    }

    joueurs.forEach((j, i) => {
      j.main = trierMain(mains[i], atout, i === 0 ? {
        ordreCouleurs: settings.ordreCouleurs,
        ordreValeur: settings.ordreValeur,
        direction: settings.directionTri,
      } : {});
      (j as any).mainInitiale = [...mains[i]]; // Sauvegarde pour Firebase
    });

    const phaseInitiale: PhaseJeu = settings.animationDonne ? 'distribution' : (variante.atoutChoisi ? 'encheres' : 'jeu');

    set({
      ...ETAT_INITIAL,
      varianteId,
      sessionGameId,
      phase: phaseInitiale,
      joueurs,
      manche: 1,
      scores: [0, 0, 0, 0],
      atout,
      donneur,
      tourDeJoueur: (donneur + 1) % 4,
      etatEnchere: {
        joueurCourantId: (donneur + 1) % 4,
        meilleureEnchere: null,
        passesConsecutifs: 0,
        historique: [],
      },
      estScenario: false,
    });

    // Lancer l'IA si elle commence (ou autoEnchere / autoJeu)
    if (phaseInitiale !== 'distribution' && variante.atoutChoisi && ((donneur + 1) % 4 !== 0 || useSettingsStore.getState().autoEnchere)) {
      setTimeout(() => get()._faireProchaineActionIA(), 600);
    }
  },

  chargerScenario(scenario, nomJoueur) {
    const variante = getVariante(scenario.varianteId);
    const settings = useSettingsStore.getState();
    const pseudoEffective = nomJoueur || settings.pseudo || 'Vous';
    const donneur = 0;
    const sessionGameId = `S-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    const joueurs: Joueur[] = Array.from({ length: 4 }, (_, i) => ({
      id: i,
      nom: i === 0 ? pseudoEffective : NOMS_IA[i - 1],
      type: i === 0 ? 'humain' : `ia_${NIVEAUX_IA[i - 1]}` as any,
      main: i === 0
        ? trierMain(scenario.mains[i], scenario.atoutInitial, {
            ordreCouleurs: settings.ordreCouleurs,
            ordreValeur: settings.ordreValeur,
            direction: settings.directionTri,
          })
        : [...scenario.mains[i]],
      plisGagnesTotal: 0,
    }));

    const atout = scenario.atoutInitial ?? null;

    const phaseInitiale: PhaseJeu = settings.animationDonne ? 'distribution' : (variante.atoutChoisi ? 'encheres' : 'jeu');

    set({
      ...ETAT_INITIAL,
      varianteId: scenario.varianteId,
      sessionGameId,
      phase: phaseInitiale,
      joueurs,
      manche: 1,
      scores: [0, 0, 0, 0],
      atout,
      donneur,
      tourDeJoueur: (donneur + 1) % 4,
      etatEnchere: {
        joueurCourantId: (donneur + 1) % 4,
        meilleureEnchere: null,
        passesConsecutifs: 0,
        historique: [],
      },
      estScenario: true,
    });

    if (phaseInitiale !== 'distribution' && variante.atoutChoisi && ((donneur + 1) % 4 !== 0 || useSettingsStore.getState().autoEnchere)) {
      setTimeout(() => get()._faireProchaineActionIA(), 600);
    }
  },

  // ──────────────────────────────────────────
  //  ENCHÈRES
  // ──────────────────────────────────────────

  placerEnchere(contratId, atout, asPartenaire) {
    const state = get();
    const variante = getVariante(state.varianteId);
    const contratConfig = getContrat(variante, contratId);

    const contrat: ContratJoue = {
      id: contratId,
      nom: contratConfig.nom,
      joueurId: state.etatEnchere.joueurCourantId,
      atout: contratConfig.sanAtout ? undefined : atout,
      asPartenaire,
      plisObjectif: contratConfig.plisMin,
      seul: contratConfig.seul,
      sanAtout: contratConfig.sanAtout,
      cartesVisibles: contratConfig.cartesVisibles,
      pointsReussite: contratConfig.pointsReussite,
      pointsEchec: contratConfig.pointsEchec,
      priorite: contratConfig.priorite,
    };

    const nouvelEtat: EtatEnchere = {
      ...state.etatEnchere,
      meilleureEnchere: contrat,
      passesConsecutifs: 0,
      historique: [
        ...state.etatEnchere.historique,
        { joueurId: state.etatEnchere.joueurCourantId, action: 'enchere', contrat },
      ],
      joueurCourantId: (state.etatEnchere.joueurCourantId + 1) % 4,
    };

    set({ etatEnchere: nouvelEtat });

    // Avancer les enchères
    setTimeout(() => get()._avancerEncheres(), 400);
  },

  passerEnchere() {
    const state = get();
    const { etatEnchere, joueurs } = state;

    let partenaireRévélé = state.partenaireRévélé;
    let contratEnCours = state.contratEnCours;

    // Si on passe alors qu'un Trou est annoncé et qu'on a le 4ème As, on "bouche"
    if (etatEnchere.meilleureEnchere?.id === 'trou' || etatEnchere.meilleureEnchere?.id === 'trou_royal') {
      const targetAce = etatEnchere.meilleureEnchere.asPartenaire;
      const aLAs = joueurs[etatEnchere.joueurCourantId].main.some(c =>
        c.valeur === targetAce?.valeur && c.couleur === targetAce?.couleur
      );

      if (aLAs) {
        // Le joueur accepte tacitement (ou via le bouton "Je bouche")
        partenaireRévélé = true;
        // On ne fixe pas encore contratEnCours car l'enchère n'est pas techniquement finie
        // (quelqu'un pourrait dire Solo par dessus), mais on pourra utiliser cette info
      }
    }

    const nouvelEtat: EtatEnchere = {
      ...state.etatEnchere,
      passesConsecutifs: state.etatEnchere.passesConsecutifs + 1,
      historique: [
        ...state.etatEnchere.historique,
        { joueurId: state.etatEnchere.joueurCourantId, action: 'passe' },
      ],
      joueurCourantId: (state.etatEnchere.joueurCourantId + 1) % 4,
    };

    set({ etatEnchere: nouvelEtat, partenaireRévélé });

    // On force l'avancement immédiat pour débloquer l'action
    get()._avancerEncheres();
  },

  // ──────────────────────────────────────────
  //  JEU
  // ──────────────────────────────────────────

  jouerCarte(carte) {
    const state = get();
    if (state.phase !== 'jeu') return;
    if (state.tourDeJoueur !== 0) return; // pas le tour de l'humain

    get()._poserCarte(carte, 0);
  },

  avancerPli() {
    const state = get();
    if (state.phase !== 'fin_pli') return;

    const gagnant = state.pliEnCours.gagnantId!;
    const pliTermine = state.pliEnCours;
    const nouveauxPlis = [...state.plisTermines, pliTermine];

    // On attend que les animations de ramassage (2s + 1s mouvement) soient finies avant de nettoyer la table
    setTimeout(() => {
      const contrat = state.contratEnCours!;
      const estMisere = contrat?.id.startsWith('misere');
      const miserePerdue = estMisere && gagnant === contrat.joueurId;

      const settings = useSettingsStore.getState();
      const MAX_MANCHES = settings.nbManchesParPartie;

      if (mancheTerminee(nouveauxPlis) || miserePerdue) {
        // Analyser toutes les erreurs de la manche
        const toutesErreurs = nouveauxPlis.flatMap(p => analyserPli(p, state.contratEnCours!, state.atout, nouveauxPlis));

        // Calculer le score de la manche
        const plisCpte = compterPlisParJoueur(nouveauxPlis);
        const variante = getVariante(state.varianteId);
        const contrat = state.contratEnCours!;
        const resultat = (variante.calculScore ?? calculerScoreGenerique)(contrat, plisCpte, state.joueurs);
        const scoreManche = construireScoreManche(state.manche, contrat, plisCpte, resultat);
        scoreManche.erreurs = toutesErreurs;

        const nouveauxScores = state.estScenario
          ? state.scores // Pas de changement pour les scénarios
          : state.scores.map((s, i) => s + (resultat.deltaScores[i] ?? 0));

        // Enregistrer les stats si ce n'est pas un scénario
        if (!state.estScenario) {
          useStatsStore.getState().enregistrerManche(resultat.reussite, toutesErreurs, contrat.joueurId);
        }

        set({
          phase: 'fin_manche',
          plisTermines: nouveauxPlis,
          scores: nouveauxScores,
          historiqueManches: [...state.historiqueManches, scoreManche],
        });

        // Sauvegarde Firebase
        const user = auth.currentUser;
        if (user && !state.estScenario) {
          saveGame(user.uid, {
            sessionGameId: state.sessionGameId,
            varianteId: state.varianteId,
            manche: state.manche,
            scores: nouveauxScores,
            atout: state.atout,
            contrat: state.contratEnCours,
            donne: state.joueurs.map(j => ({
              joueurId: j.id,
              nom: j.nom,
              mainInitiale: (j as any).mainInitiale
            })),
            plis: nouveauxPlis,
            resultat: resultat,
            erreurs: toutesErreurs,
            historiqueEncheres: state.etatEnchere.historique,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        // Prochain pli
        const nouveauPli: Pli = {
          numero: pliTermine.numero + 1,
          cartesJouees: [],
        };
        set({
          phase: 'jeu',
          plisTermines: nouveauxPlis,
          pliEnCours: nouveauPli,
          tourDeJoueur: gagnant,
        });
        // IA si ce n'est pas l'humain
        const settings = useSettingsStore.getState();
        if (gagnant !== 0 || settings.autoJeu) {
          get()._faireProchaineActionIA();
        }
      }
    }, 3200); // 2s pause + ~1s animation
  },

  avancerManche(estRedistribution = false) {
    const state = get();
    const settings = useSettingsStore.getState();
    const MAX = settings.nbManchesParPartie;

    if (!estRedistribution && state.manche >= MAX) {
      set({ phase: 'fin_partie' });
      return;
    }

    const settings = useSettingsStore.getState();
    const nouveauDonneur = (state.donneur + 1) % 4;
    const variante = getVariante(state.varianteId);
    const jeu = melanger(creerJeu(variante.avecJoker));
    const mains = distribuer(jeu, 4, (nouveauDonneur + 1) % 4);

    let atout: Couleur | null = null;
    if (!variante.atoutChoisi) {
      atout = jeu[jeu.length - 1].couleur;
    }

    const joueurs = state.joueurs.map((j, i) => ({
      ...j,
      main: trierMain(mains[i], atout, i === 0 ? {
        ordreCouleurs: settings.ordreCouleurs,
        ordreValeur: settings.ordreValeur,
        direction: settings.directionTri,
      } : {}),
      mainInitiale: [...mains[i]], // Sauvegarde pour Firebase
    }));

    const nextManche = estRedistribution ? state.manche : state.manche + 1;
    if (!estRedistribution && nextManche > MAX) {
      set({ phase: 'fin_partie' });
      return;
    }

    const phaseSuivante: PhaseJeu = settings.animationDonne ? 'distribution' : (variante.atoutChoisi ? 'encheres' : 'jeu');

    set({
      phase: phaseSuivante,
      joueurs,
      manche: nextManche,
      pliEnCours: { numero: 0, cartesJouees: [] },
      plisTermines: [],
      atout,
      donneur: nouveauDonneur,
      tourDeJoueur: (nouveauDonneur + 1) % 4,
      contratEnCours: null,
      partenaireRévélé: false,
      etatEnchere: {
        joueurCourantId: (nouveauDonneur + 1) % 4,
        meilleureEnchere: null,
        passesConsecutifs: 0,
        historique: [],
      },
    });

    if (phaseSuivante !== 'distribution' && variante.atoutChoisi && ((nouveauDonneur + 1) % 4 !== 0 || settings.autoJeu)) {
      setTimeout(() => get()._faireProchaineActionIA(), 600);
    }
  },

  resetPartie() {
    set({ ...ETAT_INITIAL });
  },

  terminerPartie() {
    set({ phase: 'fin_partie' });
  },

  passerAnnonceContrat() {
    const state = get();
    if (state.phase !== 'annonce_contrat') return;

    // Annuler le timeout existant si possible (ou simplement forcer le passage)
    const settings = useSettingsStore.getState();
    set({
      phase: 'jeu',
      tourDeJoueur: (state.donneur + 1) % 4,
      pliEnCours: { numero: 0, cartesJouees: [] },
    });
    if ((state.donneur + 1) % 4 !== 0 || settings.autoJeu) {
      get()._faireProchaineActionIA();
    }
  },

  finaliserDistribution() {
    const state = get();
    if (state.phase !== 'distribution') return;

    const variante = getVariante(state.varianteId);
    const settings = useSettingsStore.getState();
    const phaseSuivante = variante.atoutChoisi ? 'encheres' : 'jeu';

    set({ phase: phaseSuivante });

    if (phaseSuivante === 'encheres' || (state.tourDeJoueur !== 0 || settings.autoJeu)) {
      setTimeout(() => get()._faireProchaineActionIA(), 400);
    }
  },

  appliquerTriParametres() {
    const state = get();
    const settings = useSettingsStore.getState();
    const { joueurs, atout } = state;
    if (joueurs.length === 0) return;

    const nouveauxJoueurs = joueurs.map((j, i) => {
      if (i !== 0) return j; // On ne trie que l'humain pour l'instant (ou tous ?)
      return {
        ...j,
        main: trierMain(j.main, atout, {
          ordreCouleurs: settings.ordreCouleurs,
          ordreValeur: settings.ordreValeur,
          direction: settings.directionTri,
        })
      };
    });

    set({ joueurs: nouveauxJoueurs });
  },

  // ──────────────────────────────────────────
  //  HELPERS LECTURE
  // ──────────────────────────────────────────

  variante() {
    const id = get().varianteId;
    if (!id) return null;
    try { return getVariante(id); } catch { return null; }
  },

  cartesJouablesHumain() {
    const state = get();
    const humain = state.joueurs[0];
    if (!humain || state.tourDeJoueur !== 0) return [];
    return cartesJouables(humain.main, state.pliEnCours, state.atout ?? undefined);
  },

  // ──────────────────────────────────────────
  //  ACTIONS INTERNES
  // ──────────────────────────────────────────

  _poserCarte(carte: Carte, joueurId: number) {
    const state = get();

    if (!carte) {
      if (__DEV__) console.warn(`_poserCarte appelée avec une carte indéfinie pour le joueur ${joueurId}.`);
      return;
    }

    // GARDE-FOU : Vérifier si le joueur a déjà posé une carte dans ce pli
    if (state.pliEnCours.cartesJouees.some(cp => cp.joueurId === joueurId)) {
      if (__DEV__) console.warn(`Joueur ${joueurId} a tenté de jouer deux fois dans le même pli.`);
      return;
    }

    const joueur = state.joueurs[joueurId];
    const couleurDemandee = state.pliEnCours.cartesJouees.length === 0
      ? carte.couleur
      : state.pliEnCours.couleurDemandee;

    // Révélation partenaire (Demande Gand)
    let partenaireRévélé = state.partenaireRévélé;
    let contrat = state.contratEnCours;
    if (contrat && estRevélationPartenaire(carte, contrat)) {
      contrat = { ...contrat, partenaireId: joueurId };
      partenaireRévélé = true;
    }

    const nouvelleCarte = { joueurId, carte };
    const nouvelleMain = joueur.main.filter(c => c.id !== carte.id);
    const nouveauxJoueurs = state.joueurs.map(j =>
      j.id === joueurId ? { ...j, main: nouvelleMain } : j,
    );

    const pliMisAJour: Pli = {
      ...state.pliEnCours,
      couleurDemandee,
      cartesJouees: [...state.pliEnCours.cartesJouees, nouvelleCarte],
    };

    if (pliMisAJour.cartesJouees.length === 4) {
      // Pli complet → déterminer le gagnant
      const gagnantId = determinerGagnant(pliMisAJour, state.atout ?? undefined);
      const pliTermine = { ...pliMisAJour, gagnantId };

      set({
        phase: 'fin_pli',
        pliEnCours: pliTermine,
        joueurs: nouveauxJoueurs,
        contratEnCours: contrat,
        partenaireRévélé,
      });
    } else {
      // Pli en cours → prochain joueur
      const prochain = (joueurId + 1) % 4;
      set({
        pliEnCours: pliMisAJour,
        joueurs: nouveauxJoueurs,
        tourDeJoueur: prochain,
        contratEnCours: contrat,
        partenaireRévélé,
      });

      const settings = useSettingsStore.getState();
      if (prochain !== 0 || settings.autoJeu) {
        setTimeout(() => get()._faireProchaineActionIA(), 500);
      }
    }
  },

  _avancerEncheres() {
    const state = get();
    const { etatEnchere } = state;
    const variante = getVariante(state.varianteId);

    // Les enchères se terminent quand 3 joueurs consécutifs ont passé
    const totalJoueurs = 4;
    const enchereTerminee = etatEnchere.passesConsecutifs >= totalJoueurs - 1 &&
      etatEnchere.meilleureEnchere !== null;

    const tousPassé = etatEnchere.passesConsecutifs >= totalJoueurs &&
      etatEnchere.meilleureEnchere === null;

    if (tousPassé) {
      const { langue } = useSettingsStore.getState();
      set({
        notification: {
          title: translations[langue].alerts.biddingOverTitle,
          message: translations[langue].alerts.allPassedMessage,
        }
      });

      // Avancer la manche après 5 secondes et effacer la notification
      setTimeout(() => {
        set({ notification: null });
        get().avancerManche(true);
      }, 5000);
      return;
    }

    if (enchereTerminee) {
      const contratFinal = etatEnchere.meilleureEnchere;

      // Sécurité Whist de Gand : une Proposition seule ne peut pas lancer le jeu
      if (contratFinal?.id === 'propose' && !state.etatEnchere.historique.some(h => h.action === 'enchere' && h.contrat?.id === 'emballe')) {
        // On rend la main au proposant pour qu'il change son fusil d'épaule ou passe
        const proposantId = state.etatEnchere.historique.find(h => h.contrat?.id === 'propose')?.joueurId ?? state.donneur;
        set({
          etatEnchere: {
            ...state.etatEnchere,
            joueurCourantId: proposantId,
            passesConsecutifs: 0 // Reset pour permettre de nouvelles actions
          }
        });
        return;
      }

      if (!contratFinal) {
        // Obligation de jouer pour le donneur (Whist de Gand)
        set({ etatEnchere: { ...etatEnchere, joueurCourantId: state.donneur } });
        return;
      }

      // Phase de transition pour annoncer le contrat final
      const historique = state.etatEnchere.historique;
      const emballeurId = historique.find(h => h.contrat?.id === 'emballe')?.joueurId;
      const proposantId = historique.find(h => h.contrat?.id === 'propose')?.joueurId;

      set({
        phase: 'annonce_contrat',
        contratEnCours: {
          ...contratFinal,
          // Le partenaire est soit l'emballeur, soit celui déterminé par l'As (Trou)
          partenaireId: emballeurId !== undefined ? (contratFinal.joueurId === emballeurId ? proposantId : emballeurId) : (state.partenaireRévélé ? (state.etatEnchere.historique.find(h => h.action === 'passe' && state.joueurs[h.joueurId].main.some(c => c.valeur === contratFinal.asPartenaire?.valeur && c.couleur === contratFinal.asPartenaire?.couleur))?.joueurId) : undefined)
        },
        atout: contratFinal.atout ?? null,
      });

      // Après un délai, on commence le jeu
      setTimeout(() => {
        const currentSettings = useSettingsStore.getState();
        set({
          phase: 'jeu',
          tourDeJoueur: (state.donneur + 1) % 4,
          pliEnCours: { numero: 0, cartesJouees: [] },
        });
        if ((state.donneur + 1) % 4 !== 0 || currentSettings.autoJeu) {
          get()._faireProchaineActionIA();
        }
      }, 3000);
      return;
    }

    // C'est au tour d'un joueur humain ?
    if (etatEnchere.joueurCourantId === 0 && !useSettingsStore.getState().autoEnchere) return;

    // IA ou Humain en mode autoEnchere
    const iaJoueur = state.joueurs[etatEnchere.joueurCourantId];
    const niveau = iaJoueur.type === 'humain' ? 'expert' : iaJoueur.type.replace('ia_', '') as NiveauIA;

    const decision = choisirEnchere(
      iaJoueur.main,
      variante,
      etatEnchere.meilleureEnchere,
      niveau,
      etatEnchere.joueurCourantId,
    );

    if (decision.action === 'passe') {
      get().passerEnchere();
    } else {
      const asPartenaire = decision.asPartenaire
        ? state.joueurs
            .flatMap(j => j.main)
            .find(c => c.id === decision.asPartenaire)
        : undefined;
      get().placerEnchere(decision.contratId!, decision.atout, asPartenaire);
    }
  },

  _faireProchaineActionIA() {
    const state = get();
    const settings = useSettingsStore.getState();
    if (state.phase === 'encheres') {
      get()._avancerEncheres();
      return;
    }
    if (state.phase !== 'jeu') return;
    if (state.tourDeJoueur === 0 && !settings.autoJeu) return;

    const iaJoueur = state.joueurs[state.tourDeJoueur];
    if (!iaJoueur || iaJoueur.main.length === 0) return;

    const niveau = iaJoueur.type === 'humain' ? 'expert' : iaJoueur.type.replace('ia_', '') as NiveauIA;
    const cartesJouees = state.plisTermines.flatMap(p => p.cartesJouees.map(c => c.carte));

    const carte = choisirCarte(
      iaJoueur,
      state.pliEnCours,
      state.atout,
      state.contratEnCours,
      cartesJouees,
      niveau,
    );

    get()._poserCarte(carte, state.tourDeJoueur);
  },
}), {
  name: 'allwhist-game-state',
  storage: createJSONStorage(() => AsyncStorage),
}));

// ─── Fix typo dans avancerManche ───────────────
// Note: "jey" → "jeu" (corrigé dans le vrai fichier)
