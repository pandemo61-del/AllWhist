// ─────────────────────────────────────────────
//  IA — 3 NIVEAUX + ENCHÈRES
// ─────────────────────────────────────────────

import { Carte, Couleur, Pli, ContratJoue, Joueur } from '../engine/types';
import { cartesJouables } from '../engine/rules';
import {
  evaluerForceMain,
  couleurLaPlusLongue,
  cartesParCouleur,
  LABEL_VALEUR,
  SYMBOLE,
} from '../engine/deck';
import { VariantConfig, ContratConfig } from '../variants/types';

export type NiveauIA = 'facile' | 'moyen' | 'expert';

// ──────────────────────────────────────────────
//  CHOIX DE CARTE
// ──────────────────────────────────────────────

/**
 * Sélectionne la carte à jouer selon le niveau d'IA.
 */
export function choisirCarte(
  joueur: Joueur,
  pli: Pli,
  atout: Couleur | null,
  contrat: ContratJoue | null,
  cartesDejaJouees: Carte[],
  niveau: NiveauIA,
): Carte {
  const jouables = cartesJouables(joueur.main, pli, atout ?? undefined);

  if (niveau === 'facile') {
    return choisirCarteAleatoire(jouables);
  }
  if (niveau === 'moyen') {
    return choisirCarteMoyen(jouables, pli, atout, contrat, joueur.id);
  }
  return choisirCarteExpert(jouables, pli, atout, contrat, cartesDejaJouees, joueur.main, joueur.id);
}

// ─── Niveau 1 : Aléatoire ──────────────────────

function choisirCarteAleatoire(jouables: Carte[]): Carte {
  return jouables[Math.floor(Math.random() * jouables.length)];
}

// ─── Niveau 2 : Règles de base ─────────────────

function choisirCarteMoyen(
  jouables: Carte[],
  pli: Pli,
  atout: Couleur | null,
  contrat: ContratJoue | null,
  joueurId: number,
): Carte {
  const estSolisteMisere = contrat?.id.startsWith('misere') && contrat.joueurId === joueurId;
  const estContreMisere = contrat?.id.startsWith('misere') && contrat.joueurId !== joueurId;

  // Misère : le soliste évite de prendre, les autres forcent à prendre
  if (estSolisteMisere) {
    return eviterPrendreMain(jouables, pli, atout);
  }
  if (estContreMisere) {
    return forcerPrendreMain(jouables, pli, atout);
  }

  // Entame : jouer une carte forte ou l'As
  if (pli.cartesJouees.length === 0) {
    const as = jouables.find(c => c.valeur === 14);
    return as ?? jouables[jouables.length - 1]; // carte la plus forte
  }

  // Si partenaire est en tête → se défausser d'une petite carte
  const partenaireEnTete = estPartenaireEnTete(pli);
  if (partenaireEnTete) {
    return jouables[0]; // petite carte
  }

  // Essayer de prendre avec la plus petite carte gagnante
  const gagnante = plusPetiteCarteGagnante(jouables, pli, atout);
  return gagnante ?? jouables[0];
}

function forcerPrendreMain(
  jouables: Carte[],
  pli: Pli,
  atout: Couleur | null,
): Carte {
  // Jouer la plus grosse carte possible pour forcer le soliste
  return [...jouables].sort((a, b) => b.valeur - a.valeur)[0];
}

// ─── Niveau 3 : Heuristiques ───────────────────

function choisirCarteExpert(
  jouables: Carte[],
  pli: Pli,
  atout: Couleur | null,
  contrat: ContratJoue | null,
  cartesDejaJouees: Carte[],
  mainComplete: Carte[],
  joueurId: number,
): Carte {
  const estSolisteMisere = contrat?.id.startsWith('misere') && contrat.joueurId === joueurId;
  const estContreMisere = contrat?.id.startsWith('misere') && contrat.joueurId !== joueurId;

  if (estSolisteMisere) {
    return strategieMisere(jouables, pli, atout, cartesDejaJouees);
  }
  if (estContreMisere) {
    return forcerPrendreMain(jouables, pli, atout);
  }

  // Entame intelligente
  if (pli.cartesJouees.length === 0) {
    return meilleurEntame(jouables, atout, cartesDejaJouees, mainComplete);
  }

  // Partenaire en tête → défausse stratégique
  if (estPartenaireEnTete(pli)) {
    return defausseStrategique(jouables, atout, cartesDejaJouees);
  }

  // Sinon : prendre avec la plus petite carte efficace
  const gagnante = plusPetiteCarteGagnante(jouables, pli, atout);
  return gagnante ?? jouables[0];
}

// ─── Helpers jeu ───────────────────────────────

function estPartenaireEnTete(pli: Pli): boolean {
  // Dans un jeu à 4, le partenaire est le joueur en face (id + 2 % 4)
  if (pli.cartesJouees.length === 0) return false;
  const premierId = pli.cartesJouees[0].joueurId;
  const meilleureIdx = pli.cartesJouees.length - 1; // simplification
  const meilleurId = pli.cartesJouees[meilleureIdx].joueurId;
  // Partenaire = même parité
  return (premierId % 2) === (meilleurId % 2);
}

function plusPetiteCarteGagnante(
  jouables: Carte[],
  pli: Pli,
  atout: Couleur | null,
): Carte | null {
  // Trouve la plus petite carte qui bat la carte actuelle en tête
  const actuelleMeilleure = pli.cartesJouees[pli.cartesJouees.length - 1]?.carte;
  if (!actuelleMeilleure) return null;

  const gagnantes = jouables.filter(c => {
    // Atout bat non-atout
    if (atout && c.couleur === atout && actuelleMeilleure.couleur !== atout) return true;
    if (c.couleur === actuelleMeilleure.couleur && c.valeur > actuelleMeilleure.valeur) return true;
    return false;
  });

  return gagnantes.length > 0
    ? gagnantes.sort((a, b) => a.valeur - b.valeur)[0]
    : null;
}

function eviterPrendreMain(
  jouables: Carte[],
  pli: Pli,
  atout: Couleur | null,
): Carte {
  // Pour misère : jouer la plus petite carte non-prenante
  const sans = jouables.filter(c => c.couleur !== atout);
  const petites = (sans.length > 0 ? sans : jouables).sort((a, b) => a.valeur - b.valeur);
  return petites[0];
}

function meilleurEntame(
  jouables: Carte[],
  atout: Couleur | null,
  cartesDejaJouees: Carte[],
  mainComplete: Carte[],
): Carte {
  // Entame : préférer les As, puis les couleurs longues
  const as = jouables.find(c => c.valeur === 14 && c.couleur !== atout);
  if (as) return as;

  const hors_atout = jouables.filter(c => c.couleur !== atout);
  if (hors_atout.length > 0) {
    return hors_atout.sort((a, b) => b.valeur - a.valeur)[0];
  }
  return jouables.sort((a, b) => b.valeur - a.valeur)[0];
}

function defausseStrategique(
  jouables: Carte[],
  atout: Couleur | null,
  cartesDejaJouees: Carte[],
): Carte {
  // Se défausser : petit non-atout d'abord
  const nonAtout = jouables.filter(c => c.couleur !== atout);
  if (nonAtout.length > 0) return nonAtout.sort((a, b) => a.valeur - b.valeur)[0];
  return jouables.sort((a, b) => a.valeur - b.valeur)[0];
}

function strategieMisere(
  jouables: Carte[],
  pli: Pli,
  atout: Couleur | null,
  cartesDejaJouees: Carte[],
): Carte {
  // Pour misère expert : vérifier si on peut passer sans prendre
  if (pli.cartesJouees.length === 0) {
    // Entame : jouer une couleur où on n'a que des petites
    return jouables.sort((a, b) => a.valeur - b.valeur)[0];
  }
  return eviterPrendreMain(jouables, pli, atout);
}

// ──────────────────────────────────────────────
//  ENCHÈRES IA
// ──────────────────────────────────────────────

export interface DecisionEnchere {
  action: 'passe' | 'enchere';
  contratId?: string;
  atout?: Couleur;
  asPartenaire?: string; // id de l'As désigné pour Demande
}

/**
 * L'IA décide si elle enchérit et quel contrat elle choisit.
 */
export function choisirEnchere(
  main: Carte[],
  variante: VariantConfig,
  meilleureEnchere: ContratConfig | null,
  niveau: NiveauIA,
): DecisionEnchere {
  // --- RÈGLES OBLIGATOIRES (Whist de Gand) ---
  if (variante.id === 'whist-gand') {
    const nbAs = main.filter(c => c.valeur === 14).length;
    const currentPriorite = meilleureEnchere?.priorite ?? -1;

    // Si on a 3 As -> Trou obligatoire (priorité 2)
    if (nbAs === 3 && currentPriorite < 2) {
      const asPossedes = main.filter(c => c.valeur === 14).map(c => c.couleur);
      const asManquant = [Couleur.PIQUE, Couleur.COEUR, Couleur.CARREAU, Couleur.TREFLE]
        .find(col => !asPossedes.includes(col));

      return {
        action: 'enchere',
        contratId: 'trou',
        atout: asManquant,
        asPartenaire: asManquant ? `14_${asManquant}` : undefined,
      };
    }

    // Si on a 4 As -> Trou Royal obligatoire (priorité 3)
    if (nbAs === 4 && currentPriorite < 3) {
      return {
        action: 'enchere',
        contratId: 'trou_royal',
        atout: Couleur.COEUR,
        asPartenaire: `13_${Couleur.COEUR}`, // Roi de Cœur par convention
      };
    }
  }

  const force = evaluerForceMain(main);
  const { couleur: meilleureCol } = couleurLaPlusLongue(main);
  const nbAtouts = cartesParCouleur(main, meilleureCol).length;

  // Seuils par niveau
  const seuils = {
    facile:  { demande: 14, solo: 20, abondance: 30, misere: -1 },
    moyen:   { demande: 12, solo: 17, abondance: 26, misere: 2  },
    expert:  { demande: 10, solo: 15, abondance: 24, misere: 3  },
  }[niveau];

  const contratsDisponibles = variante.contrats.filter(c =>
    c.id !== 'passe' &&
    c.priorite > (meilleureEnchere?.priorite ?? 0),
  );

  // Évaluer misère : force très basse ET très peu de grosses cartes
  const nbGrossesCartes = main.filter(c => c.valeur >= 11).length; // Valet et +
  const estTresFaible = force <= (seuils.misere + 2) && nbGrossesCartes === 0;
  const peutMisere = force <= (seuils.misere + 5) && nbGrossesCartes <= 1 && !main.some(c => c.estJoker);

  // Choisir le contrat selon la force (ordre de priorité logique)
  let contratChoisi: ContratConfig | null = null;

  if (force >= seuils.abondance && nbAtouts >= 7) {
    contratChoisi = contratsDisponibles.find(c =>
      c.id === 'abondance' || c.id === 'abondance_declaree',
    ) ?? null;
  } else if (force >= seuils.solo && nbAtouts >= 5) {
    contratChoisi = contratsDisponibles.find(c => c.id === 'solo') ?? null;
  } else if (peutMisere) {
    // Si la main est extrêmement faible, proposer la Misère Ouverte (plus payante)
    if (estTresFaible && contratsDisponibles.some(c => c.id === 'misere_ouverte')) {
      contratChoisi = contratsDisponibles.find(c => c.id === 'misere_ouverte') ?? null;
    } else {
      contratChoisi = contratsDisponibles.find(c => c.id === 'misere') ?? null;
    }
  } else if (force >= seuils.demande) {
    contratChoisi = contratsDisponibles.find(c => c.id === 'demande') ?? null;
  }

  if (!contratChoisi) return { action: 'passe' };

  // Choisir l'As pour la Demande
  let asPartenaire: string | undefined;
  if (contratChoisi.partenaire) {
    const asDispo = main.filter(c => c.valeur === 14);
    const asAbsent = [Couleur.PIQUE, Couleur.COEUR, Couleur.CARREAU, Couleur.TREFLE]
      .find(col => !asDispo.some(c => c.couleur === col));
    asPartenaire = asAbsent ? `14_${asAbsent}` : undefined;
  }

  return {
    action: 'enchere',
    contratId: contratChoisi.id,
    atout: contratChoisi.sanAtout ? undefined : meilleureCol,
    asPartenaire,
  };
}
