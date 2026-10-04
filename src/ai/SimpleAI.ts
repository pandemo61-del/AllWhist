// ─────────────────────────────────────────────
//  IA — 3 NIVEAUX + ENCHÈRES
// ─────────────────────────────────────────────

import { Carte, Couleur, Pli, ContratJoue, Joueur } from '../engine/types';
import { cartesJouables, estPlusForte, determinerGagnant, determinerCouleursEpuiseesMisere } from '../engine/rules';
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
  plisTermines: Pli[] = [],
): Carte {
  const jouables = cartesJouables(joueur.main, pli, atout ?? undefined);

  if (jouables.length === 0) {
    // Cas de secours pour éviter le crash
    return joueur.main[0];
  }

  if (niveau === 'facile') {
    return choisirCarteAleatoire(jouables);
  }
  if (niveau === 'moyen') {
    return choisirCarteMoyen(jouables, pli, atout, contrat, joueur.id, plisTermines);
  }
  return choisirCarteExpert(jouables, pli, atout, contrat, cartesDejaJouees, joueur.main, joueur.id, plisTermines);
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
  plisTermines: Pli[] = [],
): Carte {
  const estSolisteMisere = contrat?.id.includes('misere') && contrat.joueurId === joueurId;
  const estContreMisere = contrat?.id.includes('misere') && contrat.joueurId !== joueurId;

  // Misère : le soliste évite de prendre, les autres forcent à prendre
  if (estSolisteMisere) {
    return eviterPrendreMain(jouables, pli, atout);
  }
  if (estContreMisere) {
    return strategieContreMisere(jouables, pli, atout, contrat, plisTermines, joueurId);
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

function strategieContreMisere(
  jouables: Carte[],
  pli: Pli,
  atout: Couleur | null,
  contrat: ContratJoue | null,
  plisTermines: Pli[] = [],
  joueurId: number,
): Carte {
  const solisteId = contrat?.joueurId ?? -1;

  // 1. Déterminer les couleurs que le soliste n'a plus (renonces / chicanes connues)
  const couleursEpuisees = determinerCouleursEpuiseesMisere(solisteId, plisTermines, pli);

  // 2. CAS ENTAME (Premier à jouer dans le pli)
  if (pli.cartesJouees.length === 0) {
    // Ne plus jouer une couleur que le soliste n'a plus !
    const jouablesAutorisees = jouables.filter(c => !couleursEpuisees.has(c.couleur));

    // Si on a le choix (il reste des couleurs que le soliste possède), on ne joue PAS une couleur épuisée
    const candidates = jouablesAutorisees.length > 0 ? jouablesAutorisees : jouables;

    // Parmi les candidates, on joue la carte la plus forte pour forcer le soliste à monter ou prendre
    return [...candidates].sort((a, b) => b.valeur - a.valeur)[0];
  }

  // 3. CAS EN COURS DE PLI
  const couleurDemandee = pli.couleurDemandee;

  // Le soliste a-t-il déjà joué dans ce pli ?
  const carteSoliste = pli.cartesJouees.find(c => c.joueurId === solisteId)?.carte;

  if (carteSoliste) {
    // Si le soliste a fourni la couleur demandée, on essaie de le laisser gagner le pli !
    if (couleurDemandee && carteSoliste.couleur === couleurDemandee) {
      // Trouver les cartes jouables plus PETITES que celle du soliste
      const plusPetitesQueSoliste = jouables.filter(
        c => c.couleur === couleurDemandee && c.valeur < carteSoliste.valeur
      );

      if (plusPetitesQueSoliste.length > 0) {
        // Jouer la plus petite carte sous celle du soliste pour le forcer à garder le pli
        return plusPetitesQueSoliste.sort((a, b) => a.valeur - b.valeur)[0];
      }
    }
  }

  // Par défaut : Jouer la plus forte carte jouable
  return [...jouables].sort((a, b) => b.valeur - a.valeur)[0];
}

function forcerPrendreMain(
  jouables: Carte[],
  pli: Pli,
  atout: Couleur | null,
): Carte {
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
  plisTermines: Pli[] = [],
): Carte {
  const estSolisteMisere = contrat?.id.includes('misere') && contrat.joueurId === joueurId;
  const estContreMisere = contrat?.id.includes('misere') && contrat.joueurId !== joueurId;

  if (estSolisteMisere) {
    return strategieMisere(jouables, pli, atout, cartesDejaJouees);
  }
  if (estContreMisere) {
    return strategieContreMisere(jouables, pli, atout, contrat, plisTermines, joueurId);
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

/** Évalue la force d'une main avec bonus de distribution. */
function evaluerForceAvancee(main: Carte[]): { force: number, meilleureCol: Couleur, nbAtouts: number } {
  const forceBrute = main.reduce((acc, c) => {
    if (c.estJoker)    return acc + 6;
    if (c.valeur === 14) return acc + 4; // As: 4
    if (c.valeur === 13) return acc + 3; // Roi: 3
    if (c.valeur === 12) return acc + 2; // Dame: 2
    if (c.valeur === 11) return acc + 1; // Valet: 1
    return acc;
  }, 0);

  // Analyse distribution (Ordre par défaut : Cœur, Carreau, Trèfle, Pique)
  const repart: Record<string, number> = { [Couleur.COEUR]: 0, [Couleur.CARREAU]: 0, [Couleur.TREFLE]: 0, [Couleur.PIQUE]: 0 };
  main.forEach(c => repart[c.couleur]++);

  let meilleureCol = Couleur.COEUR;
  let nbAtouts = 0;
  Object.entries(repart).forEach(([col, nb]) => {
    if (nb > nbAtouts) {
      nbAtouts = nb;
      meilleureCol = col as Couleur;
    }
  });

  // Bonus distribution : +1 par carte au-delà de 4 dans la couleur la plus longue
  const bonusDistrib = Math.max(0, nbAtouts - 4) * 2;

  // Malus chicane/singleton pour les jeux à l'atout
  let bonusVides = 0;
  Object.values(repart).forEach(nb => {
    if (nb === 0) bonusVides += 3; // Chicane
    if (nb === 1) bonusVides += 1; // Singleton
  });

  return {
    force: forceBrute + bonusDistrib + bonusVides,
    meilleureCol,
    nbAtouts
  };
}

export function choisirEnchere(
  main: Carte[],
  variante: VariantConfig,
  meilleureEnchere: ContratJoue | null,
  niveau: NiveauIA,
  joueurId: number,
  preferenceCouleurs?: Couleur[],
): DecisionEnchere {
  const { force, meilleureCol, nbAtouts } = evaluerForceAvancee(main);
  const currentPriorite = meilleureEnchere?.priorite ?? -1;

  if (variante.id === 'whist-gand') {
    const nbAs = main.filter(c => c.valeur === 14).length;

    // "Trou" (9 plis avec partenaire imposé par le 4ème As)
    if (nbAs === 3 && currentPriorite < 7) {
      const asPossedes = main.filter(c => c.valeur === 14).map(c => c.couleur);
      const asManquant = [Couleur.COEUR, Couleur.CARREAU, Couleur.TREFLE, Couleur.PIQUE]
        .find(col => !asPossedes.includes(col));

      return {
        action: 'enchere',
        contratId: 'trou',
        atout: asManquant,
        asPartenaire: asManquant ? `14_${asManquant}` : undefined,
      };
    }

    // "Trou Royal" (4 As en main, appelle le Roi de Cœur)
    if (nbAs === 4 && currentPriorite < 7.5) {
      return {
        action: 'enchere',
        contratId: 'trou_royal',
        atout: Couleur.COEUR,
        asPartenaire: `13_${Couleur.COEUR}`,
      };
    }
  }

  const seuils = {
    facile:  { propose: 18, solo: 28, abondance: 38, misere: 2 },
    moyen:   { propose: 16, solo: 26, abondance: 35, misere: 4 },
    expert:  { propose: 15, solo: 22, abondance: 30, misere: 6 },
  }[niveau];

  const contratsDisponibles = variante.contrats.filter(c =>
    c.id !== 'passe' &&
    c.priorite > (currentPriorite) &&
    (!c.disponibleSi || c.disponibleSi(main, meilleureEnchere as any, joueurId))
  );

  // --- ANALYSE DE SÉCURITÉ (Anti-Suicide) ---
  const asAtout = main.some(c => c.couleur === meilleureCol && c.valeur === 14);
  const roiAtout = main.some(c => c.couleur === meilleureCol && c.valeur === 13);
  const aHonneurAtout = asAtout || roiAtout;

  // Logique Misère : Plus stricte
  const grossesCartes = main.filter(c => c.valeur >= 10);
  const estDangereuxMisere = grossesCartes.some(gc => {
      const memeCouleur = main.filter(c => c.couleur === gc.couleur);
      return gc.valeur >= 11 && memeCouleur.length <= 3; // Un Valet mal protégé est fatal
  });

  // Indicateur de risque précis pour l'IA en production (aligné sur les résultats des tests d'échec)
  const forceMisereProd = main.reduce((acc, c) => {
    if (c.valeur >= 11) return acc + 10; // Valets, Dames, Rois, As
    if (c.valeur >= 8) return acc + 2;   // 8, 9, 10
    return acc;
  }, 0);

  const peutMisere = forceMisereProd <= 25 && !estDangereuxMisere && main.filter(c => c.valeur === 14).length === 0;

  let contratChoisi: ContratConfig | null = null;

  if (force >= seuils.abondance && nbAtouts >= 7 && aHonneurAtout) {
    // Chercher le meilleur contrat d'Abondance possible selon les points
    if (force >= 48) contratChoisi = contratsDisponibles.find(c => c.id === 'chelem') ?? null;
    if (!contratChoisi && force >= 44) contratChoisi = contratsDisponibles.find(c => c.id === 'abondance_12') ?? null;
    if (!contratChoisi && force >= 40) contratChoisi = contratsDisponibles.find(c => c.id === 'abondance_11') ?? null;
    if (!contratChoisi && force >= 35) contratChoisi = contratsDisponibles.find(c => c.id === 'abondance_10') ?? null;
    if (!contratChoisi && force >= 30 && nbAtouts >= 6) contratChoisi = contratsDisponibles.find(c => c.id === 'abondance_9') ?? null;
  }
  else if (force >= seuils.solo && nbAtouts >= 5 && aHonneurAtout) {
    if (force >= 28 && nbAtouts >= 6) contratChoisi = contratsDisponibles.find(c => c.id === 'solo_8') ?? null;
    if (!contratChoisi && force >= 25) contratChoisi = contratsDisponibles.find(c => c.id === 'solo_7') ?? null;
    if (!contratChoisi) contratChoisi = contratsDisponibles.find(c => c.id === 'solo_6') ?? null;
  }
  else if (peutMisere) {
    // Hiérarchie des misères calée sur les indicateurs de risque fiabilisés sans pénalité pour les chicanes
    if (forceMisereProd === 0) contratChoisi = contratsDisponibles.find(c => c.id === 'misere_ouverte') ?? null;
    if (!contratChoisi && forceMisereProd <= 10) contratChoisi = contratsDisponibles.find(c => c.id === 'misere') ?? null;
    if (!contratChoisi && forceMisereProd <= 20) contratChoisi = contratsDisponibles.find(c => c.id === 'petite_misere') ?? null;
  }
  else if (meilleureEnchere?.id === 'propose') {
    const colProposee = meilleureEnchere.atout!;
    const cartesCol = main.filter(c => c.couleur === colProposee);
    // Emballage : On ne suit que si on a vraiment de quoi aider (As, Roi ou 4 cartes)
    const aGrosHonneur = cartesCol.some(c => c.valeur >= 13);
    if (cartesCol.length >= 4 || (cartesCol.length >= 2 && aGrosHonneur)) {
        contratChoisi = contratsDisponibles.find(c => c.id === 'emballe') ?? null;
    }
  }
  else if (force >= seuils.propose && nbAtouts >= 5) {
    contratChoisi = contratsDisponibles.find(c => c.id === 'propose') ?? null;
  }

  if (!contratChoisi) return { action: 'passe' };

  // Détermination du partenaire (As demandé)
  let asPartenaire: string | undefined;
  if (contratChoisi.partenaire) {
    const asDispo = main.filter(c => c.valeur === Valeur.AS);
    const asAbsent = [Couleur.COEUR, Couleur.CARREAU, Couleur.TREFLE, Couleur.PIQUE]
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
