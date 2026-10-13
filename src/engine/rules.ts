// ─────────────────────────────────────────────
//  RÈGLES DE JEU — Plis & validité
// ─────────────────────────────────────────────

import { Carte, Couleur, Pli, ContratJoue } from './types';

// ─── Cartes jouables ───────────────────────────

/**
 * Retourne les cartes que le joueur a le droit de jouer.
 *
 * Règle universelle du Whist :
 *  1. Si le joueur est le premier à jouer → toutes les cartes sont valides.
 *  2. Si une couleur est demandée → le joueur doit la fournir s'il en a.
 *  3. S'il ne peut pas fournir → il peut couper (atout) ou se défausser librement.
 */
export function cartesJouables(
  main: Carte[],
  pli: Pli,
  _atout?: Couleur | null,
): Carte[] {
  if (main.length === 0) return [];
  if (pli.cartesJouees.length === 0) return main;

  const { couleurDemandee } = pli;
  if (!couleurDemandee) return main;

  const memeCouleur = main.filter(c => c.couleur === couleurDemandee);
  return memeCouleur.length > 0 ? memeCouleur : main;
}

// ─── Gagnant du pli ────────────────────────────

/**
 * Détermine le gagnant d'un pli terminé.
 *
 * @param pli         Pli avec ses 4 cartes jouées
 * @param atout       Couleur d'atout (undefined = sans atout)
 * @param ordreInverse true pour Bid Whist "descendant" (2 bat l'As)
 */
export function determinerGagnant(
  pli: Pli,
  atout?: Couleur | null,
  ordreInverse = false,
): number {
  const { cartesJouees, couleurDemandee } = pli;
  if (cartesJouees.length === 0) throw new Error('Pli vide');

  let meilleure = cartesJouees[0];

  for (let i = 1; i < cartesJouees.length; i++) {
    const challenger = cartesJouees[i];
    if (
      estPlusForte(challenger.carte, meilleure.carte, couleurDemandee!, atout, ordreInverse)
    ) {
      meilleure = challenger;
    }
  }
  return meilleure.joueurId;
}

function forceValeur(valeur: number, ordreInverse: boolean): number {
  return ordreInverse ? (16 - valeur) : valeur;
}

export function estPlusForte(
  challenger: Carte,
  actuelle: Carte,
  couleurDemandee: Couleur,
  atout?: Couleur | null,
  ordreInverse = false,
): boolean {
  // Joker bat tout
  if (challenger.estJoker) return true;
  if (actuelle.estJoker)   return false;

  const fChallenger = forceValeur(challenger.valeur, ordreInverse);
  const fActuelle   = forceValeur(actuelle.valeur,   ordreInverse);

  // Gestion de l'atout
  if (atout) {
    const cAtout = challenger.couleur === atout;
    const aAtout = actuelle.couleur   === atout;
    if (cAtout && !aAtout) return true;
    if (!cAtout && aAtout) return false;
    if (cAtout && aAtout)  return fChallenger > fActuelle;
  }

  // Pas d'atout impliqué
  if (challenger.couleur !== couleurDemandee) return false;
  if (actuelle.couleur   !== couleurDemandee) return true;
  return fChallenger > fActuelle;
}

// ─── Vérification fin de misère ────────────────

/**
 * Retourne true si le soliste (joueurId) a déjà pris un pli
 * → la misère est immédiatement perdue.
 */
export function misereEchouee(
  plisTermines: Pli[],
  joueurId: number,
): boolean {
  return plisTermines.some(p => p.gagnantId === joueurId);
}

// ─── Révélation du partenaire (Whist de Gand) ───

/**
 * Vérifie si la carte jouée révèle le partenaire secret.
 * Le partenaire est le joueur qui joue la carte appelée.
 */
export function estRevélationPartenaire(
  carte: Carte,
  contrat: ContratJoue,
): boolean {
  return (
    (contrat.id === 'demande' || contrat.id === 'trou' || contrat.id === 'trou_royal') &&
    contrat.asPartenaire !== undefined &&
    carte.id === contrat.asPartenaire.id
  );
}

// ─── Compte des plis par joueur ────────────────

export function compterPlisParJoueur(
  plisTermines: Pli[],
  nbJoueurs = 4,
): Record<number, number> {
  const compte: Record<number, number> = {};
  for (let i = 0; i < nbJoueurs; i++) compte[i] = 0;
  for (const pli of plisTermines) {
    if (pli.gagnantId !== undefined) {
      compte[pli.gagnantId] = (compte[pli.gagnantId] ?? 0) + 1;
    }
  }
  return compte;
}

// ─── Vérification fin de manche ────────────────

export function mancheTerminee(plisTermines: Pli[], contrat?: ContratJoue): boolean {
  const totalAttendu = (contrat?.id === 'petite_misere') ? 12 : 13;
  return plisTermines.length >= totalAttendu;
}

// ─── Couleurs épuisées chez le soliste (Misère) ───

/**
 * Détermine les couleurs que le soliste de la misère n'a plus (renonces / chicanes connues).
 */
export function determinerCouleursEpuiseesMisere(
  solisteId: number,
  plisTermines: Pli[] = [],
  pliEnCours?: Pli,
): Set<Couleur> {
  const epuisees = new Set<Couleur>();

  for (const p of plisTermines) {
    if (!p.couleurDemandee) continue;
    const carteSoliste = p.cartesJouees.find(c => c.joueurId === solisteId);
    if (carteSoliste && carteSoliste.carte.couleur !== p.couleurDemandee) {
      epuisees.add(p.couleurDemandee);
    }
  }

  if (pliEnCours && pliEnCours.couleurDemandee) {
    const carteSoliste = pliEnCours.cartesJouees.find(c => c.joueurId === solisteId);
    if (carteSoliste && carteSoliste.carte.couleur !== pliEnCours.couleurDemandee) {
      epuisees.add(pliEnCours.couleurDemandee);
    }
  }

  return epuisees;
}
