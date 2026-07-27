// ─────────────────────────────────────────────
//  ANALYSE EXPERTE — AllWhist
// ─────────────────────────────────────────────

import { Pli, ContratJoue, Couleur, Carte } from './types';
import { determinerGagnant } from './rules';

export type AnalyseType = 'error' | 'warning' | 'good';

export interface CommentaireExpert {
  type: AnalyseType;
  titre: string;
  description: string;
  joueurId: number;
}

/**
 * Analyse un pli terminé pour identifier les bons coups et les erreurs.
 */
export function analyserPli(
  pli: Pli,
  contrat: ContratJoue,
  atout: Couleur | null,
  historiquePlis: Pli[] = []
): CommentaireExpert[] {
  const commentaires: CommentaireExpert[] = [];
  const { cartesJouees, couleurDemandee } = pli;

  if (cartesJouees.length < 4) return [];

  // 1. Identifier les partenaires
  const sontPartenaires = (id1: number, id2: number) => {
    if (contrat.partenaireId !== undefined) {
      if (id1 === contrat.joueurId) return id2 === contrat.partenaireId;
      if (id1 === contrat.partenaireId) return id2 === contrat.joueurId;
      const defenseurs = [0, 1, 2, 3].filter(id => id !== contrat.joueurId && id !== contrat.partenaireId);
      return defenseurs.includes(id1) && defenseurs.includes(id2);
    }
    if (contrat.seul) {
      if (id1 === contrat.joueurId || id2 === contrat.joueurId) return false;
      return true;
    }
    return (id1 % 2) === (id2 % 2);
  };

  const estSoliste = (id: number) => id === contrat.joueurId;

  // Parcourir les cartes jouées
  let meilleurActuel = cartesJouees[0];

  // --- ANALYSE : ENTAME (1ère carte) ---
  const entame = cartesJouees[0];
  if (entame.carte.valeur < 14 && entame.carte.couleur !== atout && !contrat.id.includes('misere')) {
    // Si on entame une couleur où on n'a pas l'As mais qu'on a le Roi (par exemple), c'est risqué
    // Note: sans la main complète, on se base sur les cartes jouées
  }

  for (let i = 1; i < cartesJouees.length; i++) {
    const { joueurId, carte } = cartesJouees[i];
    const prevJoueurId = meilleurActuel.joueurId;
    const partenaireEnTete = sontPartenaires(joueurId, prevJoueurId);

    // --- ANALYSE : COUPER SUR SON PARTENAIRE ---
    if (partenaireEnTete && atout && carte.couleur === atout && meilleurActuel.carte.couleur !== atout) {
      if (!contrat.id.includes('misere') && pli.numero < 10) {
        commentaires.push({
          type: 'error',
          titre: 'Coupe fratricide',
          description: `Vous avez coupé alors que votre partenaire avait déjà le pli. C'est un atout gaspillé.`,
          joueurId
        });
      }
    }

    // --- ANALYSE : SURMONTER SON PARTENAIRE ---
    if (partenaireEnTete && carte.valeur > meilleurActuel.carte.valeur && carte.couleur === meilleurActuel.carte.couleur) {
      if (!contrat.id.includes('misere')) {
        if (i === 3 || !peutEtreBattu(meilleurActuel.carte, pli, atout)) {
          commentaires.push({
            type: 'warning',
            titre: 'Surpasse inutile',
            description: `Vous avez joué une carte plus forte que votre partenaire alors qu'il gagnait déjà le pli.`,
            joueurId
          });
        }
      }
    }

    // --- ANALYSE : GASPILLAGE DE PETITE CARTE (MISÈRE) ---
    if (contrat.id.includes('misere') && estSoliste(joueurId) && !partenaireEnTete) {
      // Si on joue une carte très basse (2, 3, 4) alors que la carte en tête est haute (10+)
      if (carte.valeur <= 4 && meilleurActuel.carte.valeur >= 10) {
        commentaires.push({
          type: 'warning',
          titre: 'Gaspillage de sécurité',
          description: `En misère, ne jouez pas vos plus petites cartes trop tôt. Essayez de jouer une carte juste en-dessous de la plus forte du pli.`,
          joueurId
        });
      }
    }

    // --- ANALYSE : MISERE (Défausse risquée) ---
    if (contrat.id.includes('misere') && estSoliste(joueurId)) {
      if (carte.valeur >= 10 && i < 3) {
         // Le soliste joue une grosse carte trop tôt ?
      }
    }

    // --- ANALYSE : APPEL À L'ATOUT ---
    if (atout && !estSoliste(joueurId) && !contrat.id.includes('misere')) {
        const partenaireSoliste = sontPartenaires(joueurId, contrat.joueurId);
        if (partenaireSoliste && carte.couleur !== atout && pli.numero < 5) {
            // Un partenaire de soliste devrait essayer de faire tomber les atouts ou de ne pas défausser n'importe comment
        }
    }

    if (estPlusForte(carte, meilleurActuel.carte, couleurDemandee!, atout)) {
      meilleurActuel = cartesJouees[i];
    }
  }

  return commentaires;
}

// Helpers locaux
const joueursNoms = ['Vous', 'Marc', 'Julie', 'Paul'];

function estPlusForte(challenger: Carte, actuelle: Carte, couleurDemandee: Couleur, atout?: Couleur | null): boolean {
  if (challenger.estJoker) return true;
  if (actuelle.estJoker) return false;
  if (atout) {
    if (challenger.couleur === atout && actuelle.couleur !== atout) return true;
    if (challenger.couleur !== atout && actuelle.couleur === atout) return false;
  }
  if (challenger.couleur !== couleurDemandee) return false;
  if (actuelle.couleur !== couleurDemandee) return true;
  return challenger.valeur > actuelle.valeur;
}

function peutEtreBattu(carte: Carte, pli: Pli, atout: Couleur | null): boolean {
  // Simplification : est-ce qu'un As ou un atout non encore joué pourrait battre cette carte ?
  // Dans le cadre de l'analyse immédiate, on vérifie juste si c'est déjà un As.
  return carte.valeur < 14;
}
