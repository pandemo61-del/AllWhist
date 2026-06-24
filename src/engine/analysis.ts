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
  atout: Couleur | null
): CommentaireExpert[] {
  const commentaires: CommentaireExpert[] = [];
  const { cartesJouees, couleurDemandee } = pli;

  if (cartesJouees.length < 4) return [];

  // 1. Identifier les partenaires (simplifié : Sud(0)/Nord(2) et Est(1)/Ouest(3))
  const sontPartenaires = (id1: number, id2: number) => {
    // Cas spécifique pour le partenaire révélé dans le contrat
    if (contrat.partenaireId !== undefined) {
      if (id1 === contrat.joueurId) return id2 === contrat.partenaireId;
      if (id1 === contrat.partenaireId) return id2 === contrat.joueurId;
      // Les deux autres sont partenaires par défaut
      const defenseurs = [0,1,2,3].filter(id => id !== contrat.joueurId && id !== contrat.partenaireId);
      return defenseurs.includes(id1) && defenseurs.includes(id2);
    }
    // Cas classique
    return (id1 % 2) === (id2 % 2);
  };

  // Parcourir les cartes jouées dans l'ordre (de la 2ème à la 4ème)
  let meilleurActuel = cartesJouees[0];

  for (let i = 1; i < cartesJouees.length; i++) {
    const { joueurId, carte } = cartesJouees[i];
    const prevJoueurId = meilleurActuel.joueurId;
    const partenaireEnTete = sontPartenaires(joueurId, prevJoueurId);

    // --- ANALYSE : COUPER SUR SON PARTENAIRE ---
    if (partenaireEnTete && atout && carte.couleur === atout && meilleurActuel.carte.couleur !== atout) {
      commentaires.push({
        type: 'error',
        titre: 'Coupe fratricide',
        description: `${joueursNoms[joueurId]} a coupé alors que son partenaire ${joueursNoms[prevJoueurId]} avait déjà le pli. C'est une perte d'atout inutile !`,
        joueurId
      });
    }

    // --- ANALYSE : SURMONTER SON PARTENAIRE INUTILEMENT ---
    if (partenaireEnTete && carte.valeur > meilleurActuel.carte.valeur && carte.couleur === meilleurActuel.carte.couleur) {
      // Si c'est le dernier joueur ou s'il n'y a pas de risque de l'adversaire
      if (i === 3 || !peutEtreBattu(meilleurActuel.carte, pli, atout)) {
        commentaires.push({
          type: 'warning',
          titre: 'Surpasse inutile',
          description: `${joueursNoms[joueurId]} a joué une carte plus forte que son partenaire inutilement. Mieux vaut garder ses grosses cartes.`,
          joueurId
        });
      }
    }

    // --- ANALYSE : DÉFAUSSE INTELLIGENTE ---
    if (carte.couleur !== couleurDemandee && (!atout || carte.couleur !== atout)) {
      if (carte.valeur <= 5) {
        commentaires.push({
          type: 'good',
          titre: 'Bonne défausse',
          description: `${joueursNoms[joueurId]} se débarrasse d'une petite carte inutile pour garder ses forces ailleurs.`,
          joueurId
        });
      }
    }

    // Mettre à jour le meilleur actuel pour la suite de l'analyse
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
