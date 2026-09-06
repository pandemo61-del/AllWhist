// ─────────────────────────────────────────────
//  IA — 3 NIVEAUX + ENCHÈRES
// ─────────────────────────────────────────────

import { Carte, Couleur, Pli, ContratJoue, Joueur } from '../engine/types';
import { cartesJouables, estPlusForte, determinerGagnant } from '../engine/rules';
import {
  evaluerForceMain,
  couleurLaPlusLongue,
  cartesParCouleur,
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

  // Si partenaire est en tête → se défausser d'une petite carte inutile
  if (estPartenaireEnTete(pli, contrat)) {
    return choisirPetiteCarteInutile(jouables, atout);
  }

  // Essayer de prendre avec la plus petite carte gagnante
  const gagnante = plusPetiteCarteGagnante(jouables, pli, atout);

  if (gagnante) return gagnante;

  // Si on ne peut pas gagner le pli, NE PAS SOUS-COUPER
  return choisirPetiteCarteInutile(jouables, atout);
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
  if (estPartenaireEnTete(pli, contrat)) {
    return choisirPetiteCarteInutile(jouables, atout);
  }

  // Sinon : prendre avec la plus petite carte efficace
  const gagnante = plusPetiteCarteGagnante(jouables, pli, atout);
  if (gagnante) return gagnante;

  // Pas de gain possible -> défausse sécurisée
  return choisirPetiteCarteInutile(jouables, atout);
}

// ─── Helpers jeu ───────────────────────────────

/**
 * Choisit la plus petite carte inutile pour une défausse (Sécurité Anti-Sacrifice).
 */
function choisirPetiteCarteInutile(jouables: Carte[], atout: Couleur | null): Carte {
  // 1. On cherche d'abord dans les couleurs qui ne sont pas l'atout
  const horsAtout = jouables.filter(c => c.couleur !== atout).sort((a, b) => a.valeur - b.valeur);
  if (horsAtout.length > 0) return horsAtout[0];

  // 2. Si on n'a que de l'atout, on prend le plus petit
  return [...jouables].sort((a, b) => a.valeur - b.valeur)[0];
}

function estPartenaireEnTete(pli: Pli, contrat: ContratJoue | null): boolean {
  if (pli.cartesJouees.length === 0) return false;

  // 1. Déterminer qui gagne actuellement le pli selon les vraies règles
  const atout = contrat?.atout ?? null;
  const gagnantId = determinerGagnant(pli, atout);

  const quiJoueMaintenant = (pli.cartesJouees[pli.cartesJouees.length - 1].joueurId + 1) % 4;

  // 2. Vérifier si ce joueur est le partenaire de celui qui doit jouer
  if (contrat) {
    if (quiJoueMaintenant === contrat.joueurId) return gagnantId === contrat.partenaireId;
    if (quiJoueMaintenant === contrat.partenaireId) return gagnantId === contrat.joueurId;

    // Pour les défenseurs
    const defenseurs = [0, 1, 2, 3].filter(id => id !== contrat.joueurId && id !== contrat.partenaireId);
    return defenseurs.includes(quiJoueMaintenant) && defenseurs.includes(gagnantId) && quiJoueMaintenant !== gagnantId;
  }

  return (quiJoueMaintenant % 2) === (gagnantId % 2) && quiJoueMaintenant !== gagnantId;
}

function plusPetiteCarteGagnante(
  jouables: Carte[],
  pli: Pli,
  atout: Couleur | null,
): Carte | null {
  if (pli.cartesJouees.length === 0) return null;

  let meilleureSurTable = pli.cartesJouees[0].carte;
  for (let i = 1; i < pli.cartesJouees.length; i++) {
    if (estPlusForte(pli.cartesJouees[i].carte, meilleureSurTable, pli.couleurDemandee!, atout)) {
      meilleureSurTable = pli.cartesJouees[i].carte;
    }
  }

  const gagnantes = jouables.filter(c => {
    if (atout && c.couleur === atout) {
        if (meilleureSurTable.couleur !== atout) return true;
        return c.valeur > meilleureSurTable.valeur;
    }
    return c.couleur === meilleureSurTable.couleur && c.valeur > meilleureSurTable.valeur;
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
  if (pli.cartesJouees.length === 0) {
    return [...jouables].sort((a, b) => a.valeur - b.valeur)[0];
  }

  let meilleurePli = pli.cartesJouees[0].carte;
  for (let i = 1; i < pli.cartesJouees.length; i++) {
    if (estPlusForte(pli.cartesJouees[i].carte, meilleurePli, pli.couleurDemandee!, atout)) {
      meilleurePli = pli.cartesJouees[i].carte;
    }
  }

  const nonPrenantes = jouables.filter(c =>
    !estPlusForte(c, meilleurePli, pli.couleurDemandee!, atout)
  );

  if (nonPrenantes.length > 0) {
    // STRATÉGIE SÉCURISÉE & AGRESSIVE (Nettoyage de main) :
    // - Si je suis le DERNIER (4ème), je jette ma plus GROSSE carte qui ne prend pas (décharge).
    // - Si je ne suis pas le dernier, mais que la carte maîtresse est HAUTE (>= 10),
    //   je peux tenter de jeter une carte moyenne (>= 7) pour "nettoyer" ma main.
    // - Sinon, je joue ma plus PETITE pour rester sous tout le monde.
    const estDernier = pli.cartesJouees.length === 3;
    const maitreValeur = meilleurePli.valeur;

    if (estDernier) {
      return nonPrenantes.sort((a, b) => b.valeur - a.valeur)[0]; // Jeter la plus grosse possible
    } else if (maitreValeur >= 10) {
      // Opportunité de nettoyage : on cherche la plus grosse carte < maitreValeur
      const dechargePossible = nonPrenantes.filter(c => c.valeur >= 7).sort((a, b) => b.valeur - a.valeur);
      return dechargePossible.length > 0 ? dechargePossible[0] : nonPrenantes[0];
    } else {
      return nonPrenantes.sort((a, b) => a.valeur - b.valeur)[0]; // Jouer la plus petite pour la sécurité
    }
  }

  return jouables.sort((a, b) => b.valeur - a.valeur)[0];
}

function meilleurEntame(
  jouables: Carte[],
  atout: Couleur | null,
  cartesDejaJouees: Carte[],
  mainComplete: Carte[],
): Carte {
  const as = jouables.find(c => c.valeur === 14 && c.couleur !== atout);
  if (as) return as;

  const hors_atout = jouables.filter(c => c.couleur !== atout);
  if (hors_atout.length > 0) {
    return hors_atout.sort((a, b) => b.valeur - a.valeur)[0];
  }
  return jouables.sort((a, b) => b.valeur - a.valeur)[0];
}

function strategieMisere(
  jouables: Carte[],
  pli: Pli,
  atout: Couleur | null,
  cartesDejaJouees: Carte[],
): Carte {
  if (pli.cartesJouees.length === 0) {
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
  asPartenaire?: string;
}

export function choisirEnchere(
  main: Carte[],
  variante: VariantConfig,
  meilleureEnchere: ContratJoue | null,
  niveau: NiveauIA,
  joueurId: number,
  preferenceCouleurs?: Couleur[],
): DecisionEnchere {
  if (variante.id === 'whist-gand') {
    const nbAs = main.filter(c => c.valeur === 14).length;
    const currentPriorite = meilleureEnchere?.priorite ?? -1;
    const forceTotale = evaluerForceMain(main);

    // Un "Trou" demande 9 plis. Avec 3 As, il faut un peu de force à côté.
    if (nbAs === 3 && currentPriorite < 2 && forceTotale >= 11.5) {
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

    if (nbAs === 4 && currentPriorite < 3) {
      return {
        action: 'enchere',
        contratId: 'trou_royal',
        atout: Couleur.COEUR,
        asPartenaire: `13_${Couleur.COEUR}`,
      };
    }
  }

  const force = evaluerForceMain(main);
  const { couleur: meilleureCol } = couleurLaPlusLongue(main, preferenceCouleurs);
  const nbAtouts = cartesParCouleur(main, meilleureCol).length;

  const seuils = {
    facile:  { demande: 14, solo: 20, abondance: 30, misere: -1 },
    moyen:   { demande: 13, solo: 18, abondance: 27, misere: 1  },
    expert:  { demande: 12, solo: 17, abondance: 26, misere: 1  },
  }[niveau];

  const contratsDisponibles = variante.contrats.filter(c =>
    c.id !== 'passe' &&
    c.priorite > (meilleureEnchere?.priorite ?? 0) &&
    (!c.disponibleSi || c.disponibleSi(main, meilleureEnchere as any, joueurId))
  );

  const nbGrossesCartes = main.filter(c => c.valeur >= 11).length;
  // Misère : on évite si on a des As ou Rois, et on durcit le seuil de force
  const aAsOuRoi = main.some(c => c.valeur >= 13);
  const peutMisere = force <= (seuils.misere + 5) && nbGrossesCartes <= 1 && !aAsOuRoi && !main.some(c => c.estJoker);

  let contratChoisi: ContratConfig | null = null;

  if (force >= seuils.abondance && nbAtouts >= 7) {
    contratChoisi = contratsDisponibles.find(c =>
      c.id === 'abondance' || c.id === 'abondance_declaree',
    ) ?? null;
  } else if (force >= seuils.solo && nbAtouts >= 5) {
    contratChoisi = contratsDisponibles.find(c => c.id === 'solo') ?? null;
  } else if (peutMisere) {
    contratChoisi = contratsDisponibles.find(c => c.id === 'misere' || c.id === 'misere_ouverte') ?? null;
  } else if (force >= seuils.demande) {
    contratChoisi = contratsDisponibles.find(c => c.id === 'demande') ?? null;
  }

  if (!contratChoisi) return { action: 'passe' };

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
