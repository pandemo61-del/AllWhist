// ─────────────────────────────────────────────
//  GESTION DU JEU DE CARTES
// ─────────────────────────────────────────────

import { Carte, Couleur, Valeur } from './types';

// ─── Labels affichage ──────────────────────────

export const SYMBOLE: Record<Couleur, string> = {
  [Couleur.PIQUE]:   '♠',
  [Couleur.COEUR]:   '♥',
  [Couleur.CARREAU]: '♦',
  [Couleur.TREFLE]:  '♣',
};

export const LABEL_VALEUR: Record<number, string> = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6',
  7: '7', 8: '8', 9: '9', 10: '10',
  11: 'V', 12: 'D', 13: 'R', 14: 'A',
};

export const COULEUR_ROUGE = new Set([Couleur.COEUR, Couleur.CARREAU]);
export const estRouge = (c: Couleur) => COULEUR_ROUGE.has(c);

// ─── Création ──────────────────────────────────

export function creerJeu(avecJoker = false): Carte[] {
  const cartes: Carte[] = [];
  for (const couleur of Object.values(Couleur)) {
    for (const valeur of [2,3,4,5,6,7,8,9,10,11,12,13,14]) {
      cartes.push({
        id: `${valeur}_${couleur}`,
        valeur: valeur as Valeur,
        couleur: couleur as Couleur,
      });
    }
  }
  if (avecJoker) {
    cartes.push({ id: 'JOKER', valeur: 15 as Valeur, couleur: Couleur.PIQUE, estJoker: true });
  }
  return cartes;
}

// ─── Mélange (Fisher-Yates) ────────────────────

export function melanger<T>(tableau: T[]): T[] {
  const t = [...tableau];
  for (let i = t.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [t[i], t[j]] = [t[j], t[i]];
  }
  return t;
}

// ─── Distribution ──────────────────────────────

/**
 * Distribue `nbCartes` cartes à chaque joueur, en commençant par `premier`.
 * Retourne les mains dans l'ordre des joueurs [0..nbJoueurs-1].
 */
export function distribuer(
  jeu: Carte[],
  nbJoueurs: number,
  premier = 0,
): Carte[][] {
  const mains: Carte[][] = Array.from({ length: nbJoueurs }, () => []);
  jeu.forEach((carte, i) => {
    const joueurIdx = (premier + i) % nbJoueurs;
    mains[joueurIdx].push(carte);
  });
  return mains;
}

// ─── Tri de la main ────────────────────────────

const ORDRE_COULEUR_DEFAUT = [Couleur.COEUR, Couleur.CARREAU, Couleur.TREFLE, Couleur.PIQUE];

export interface OptionsTri {
  ordreCouleurs?: Couleur[];
  ordreValeur?: 'croissant' | 'decroissant';
  direction?: 'gauche_droite' | 'droite_gauche';
}

/**
 * Trie les cartes selon les préférences de l'utilisateur.
 */
export function trierMain(
  main: Carte[],
  atout?: Couleur | null,
  options: OptionsTri = {}
): Carte[] {
  const {
    ordreCouleurs = ORDRE_COULEUR_DEFAUT,
    ordreValeur = 'croissant',
    direction = 'gauche_droite'
  } = options;

  const triees = [...main].sort((a, b) => {
    // 1. Trier par couleur selon l'ordre défini
    // L'atout est mis à la fin de l'ordre pour être à droite (si gauche_droite)
    const getCouleurScore = (c: Couleur) => {
      if (c === atout) return 100; // Atout toujours en dernier
      const idx = ordreCouleurs.indexOf(c);
      return idx === -1 ? 0 : idx;
    };

    const aCol = getCouleurScore(a.couleur);
    const bCol = getCouleurScore(b.couleur);

    if (aCol !== bCol) return aCol - bCol;

    // 2. Trier par valeur au sein de la couleur
    return ordreValeur === 'croissant'
      ? a.valeur - b.valeur
      : b.valeur - a.valeur;
  });

  // 3. Inverser si direction droite -> gauche
  return direction === 'gauche_droite' ? triees : triees.reverse();
}

// ─── Utilitaires ───────────────────────────────

/** Cherche la carte par id dans une main. */
export function trouverCarte(main: Carte[], id: string): Carte | undefined {
  return main.find(c => c.id === id);
}

/** Retourne les cartes d'une couleur donnée. */
export function cartesParCouleur(main: Carte[], couleur: Couleur): Carte[] {
  return main.filter(c => c.couleur === couleur);
}

/** Évalue la force d'une main (pour l'IA des enchères). */
export function evaluerForceMain(main: Carte[]): number {
  return main.reduce((acc, c) => {
    if (c.estJoker)    return acc + 5;
    if (c.valeur === Valeur.AS)   return acc + 3;
    if (c.valeur === Valeur.ROI)  return acc + 2;
    if (c.valeur === Valeur.DAME) return acc + 1.5;
    if (c.valeur === Valeur.VALET)return acc + 1;
    if (c.valeur >= Valeur.DIX)   return acc + 0.5;
    return acc;
  }, 0);
}

/** Couleur la plus longue dans une main. */
export function couleurLaPlusLongue(main: Carte[]): { couleur: Couleur; nb: number } {
  const compte: Partial<Record<Couleur, number>> = {};
  for (const c of main) {
    compte[c.couleur] = (compte[c.couleur] ?? 0) + 1;
  }
  let best: Couleur = Couleur.PIQUE;
  let bestNb = 0;
  for (const [col, nb] of Object.entries(compte) as [Couleur, number][]) {
    if (nb > bestNb) { best = col; bestNb = nb; }
  }
  return { couleur: best, nb: bestNb };
}
