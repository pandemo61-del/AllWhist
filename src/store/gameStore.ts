// ─────────────────────────────────────────────
//  STORE ZUSTAND — État global de la partie
// ─────────────────────────────────────────────
//
//  Usage :
//    const { phase, jouerCarte } = useGameStore();

import { create } from 'zustand';
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
import { translations } from '../i18n/translations';
import { useSettingsStore } from './settingsStore';

// ─── Types du store ────────────────────────────

interface GameStore extends EtatPartie {
  // ──── Setters / Actions ────────────────────

  /** Initialise une nouvelle partie avec la variante donnée. */
  initialiserPartie: (varianteId: string, nomJoueur?: string) => void;

  /** Le joueur humain joue une carte. */
  jouerCarte: (carte: Carte) => void;

  /** L'humain place une enchère. */
  placerEnchere: (contratId: string, atout?: Couleur, asPartenaire?: Carte) => void;

  /** L'humain passe son tour d'enchère. */
  passerEnchere: () => void;

  /** Passe au pli suivant (après affichage du résultat). */
  avancerPli: () => void;

  /** Passe à la manche suivante. */
  avancerManche: () => void;

  /** Quitte immédiatement la phase d'annonce de contrat. */
  passerAnnonceContrat: () => void;

  /** Réinitialise tout. */
  resetPartie: () => void;

  /** Trie la main du joueur humain selon les préférences actuelles. */
  appliquerTriParametres: () => void;

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
};

// ─── Noms IA ───────────────────────────────────

const NOMS_IA = ['Marc', 'Julie', 'Paul'];
const NIVEAUX_IA: NiveauIA[] = ['moyen', 'moyen', 'expert'];

// ─── Store ─────────────────────────────────────

export const useGameStore = create<GameStore>((set, get) => ({
  ...ETAT_INITIAL,

  // ──────────────────────────────────────────
  //  INITIALISATION
  // ──────────────────────────────────────────

  initialiserPartie(varianteId, nomJoueur = 'Vous') {
    const variante = getVariante(varianteId);
    const settings = useSettingsStore.getState();
    const donneur = 0;

    const joueurs: Joueur[] = Array.from({ length: 4 }, (_, i) => ({
      id: i,
      nom: i === 0 ? nomJoueur : NOMS_IA[i - 1],
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
    });

    set({
      ...ETAT_INITIAL,
      varianteId,
      phase: variante.atoutChoisi ? 'encheres' : 'jeu',
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
    });

    // Lancer l'IA si elle commence (ou autoJeu)
    if (variante.atoutChoisi && ((donneur + 1) % 4 !== 0 || settings.autoJeu)) {
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
    };

    const nouvelEtat: EtatEnchere = {
      ...state.etatEnchere,
      meilleureEnchere: contrat as any,
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
    const nouvelEtat: EtatEnchere = {
      ...state.etatEnchere,
      passesConsecutifs: state.etatEnchere.passesConsecutifs + 1,
      historique: [
        ...state.etatEnchere.historique,
        { joueurId: state.etatEnchere.joueurCourantId, action: 'passe' },
      ],
      joueurCourantId: (state.etatEnchere.joueurCourantId + 1) % 4,
    };

    set({ etatEnchere: nouvelEtat });

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
      if (mancheTerminee(nouveauxPlis)) {
        // Calculer le score de la manche
        const plisCpte = compterPlisParJoueur(nouveauxPlis);
        const variante = getVariante(state.varianteId);
        const contrat = state.contratEnCours!;
        const resultat = (variante.calculScore ?? calculerScoreGenerique)(contrat, plisCpte);
        const scoreManche = construireScoreManche(state.manche, contrat, plisCpte, resultat);
        const nouveauxScores = state.scores.map(
          (s, i) => s + (resultat.deltaScores[i] ?? 0),
        );

        set({
          phase: 'fin_manche',
          plisTermines: nouveauxPlis,
          scores: nouveauxScores,
          historiqueManches: [...state.historiqueManches, scoreManche],
        });
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

  avancerManche() {
    const state = get();
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
    }));

    set({
      phase: variante.atoutChoisi ? 'encheres' : 'jeu',
      joueurs,
      manche: state.manche + 1,
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

    if (variante.atoutChoisi && ((nouveauDonneur + 1) % 4 !== 0 || settings.autoJeu)) {
      setTimeout(() => get()._faireProchaineActionIA(), 600);
    }
  },

  resetPartie() {
    set({ ...ETAT_INITIAL });
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
      Alert.alert(
        translations[langue].alerts.biddingOverTitle,
        translations[langue].alerts.allPassedMessage,
        [{ text: translations[langue].common.ok, onPress: () => get().avancerManche() }]
      );
      return;
    }

    if (enchereTerminee) {
      const contrat = etatEnchere.meilleureEnchere as ContratJoue | null;
      if (!contrat) {
        // Obligation de jouer pour le donneur
        set({ etatEnchere: { ...etatEnchere, joueurCourantId: state.donneur } });
        return;
      }

      // Phase de transition pour annoncer le contrat final
      set({
        phase: 'annonce_contrat',
        contratEnCours: contrat,
        atout: contrat.atout ?? null,
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
    if (etatEnchere.joueurCourantId === 0) return;

    // IA enchérit
    const iaJoueur = state.joueurs[etatEnchere.joueurCourantId];
    const niveau = iaJoueur.type.replace('ia_', '') as NiveauIA;
    const meilleureConfig = etatEnchere.meilleureEnchere
      ? getContrat(variante, (etatEnchere.meilleureEnchere as any).id).priorite
      : -1;

    const decision = choisirEnchere(
      iaJoueur.main,
      variante,
      etatEnchere.meilleureEnchere ? { priorite: meilleureConfig } as any : null,
      niveau,
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
} as any));

// ─── Fix typo dans avancerManche ───────────────
// Note: "jey" → "jeu" (corrigé dans le vrai fichier)
