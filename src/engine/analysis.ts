// ─────────────────────────────────────────────
//  ANALYSE EXPERTE — AllWhist
// ─────────────────────────────────────────────

import { Pli, ContratJoue, Couleur, Carte } from './types';
import { determinerGagnant, determinerCouleursEpuiseesMisere } from './rules';
import { LABEL_VALEUR } from './deck';

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
    if (id1 === id2) return false;

    // Cas spécial Whist de Gand
    if (contrat.partenaireId !== undefined) {
      const estEquipeA = (id: number) => id === contrat.joueurId || id === contrat.partenaireId;
      return estEquipeA(id1) === estEquipeA(id2);
    }

    // Cas Solo
    if (contrat.seul) {
      if (id1 === contrat.joueurId || id2 === contrat.joueurId) return false;
      return true; // Les 3 autres sont partenaires
    }

    // Par défaut
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

    // --- ANALYSE : SOUS-COUPE INUTILE ---
    // Ne s'applique que si on coupe (couleurDemandee != atout)
    if (atout && couleurDemandee !== atout && !partenaireEnTete && carte.couleur === atout && meilleurActuel.carte.couleur === atout) {
      if (carte.valeur < meilleurActuel.carte.valeur) {
        commentaires.push({
          type: 'error',
          titre: 'Sous-coupe inutile',
          description: `Vous avez joué un atout plus faible que celui de l'adversaire. Vous perdez votre atout sans gagner le pli.`,
          joueurId
        });
      }
    }

    // --- ANALYSE : COUPE MANQUÉE ---
    if (atout && !partenaireEnTete && carte.couleur !== atout && carte.couleur !== couleurDemandee) {
      // Le joueur a défaussé. S'il avait de l'atout dans sa main (on ne le sait pas ici sans mainComplete)
      // mais on peut au moins vérifier si l'atout était une option plus forte
      if (meilleurActuel.carte.couleur !== atout && pli.numero < 11) {
          // Note: Cette règle est perfectible car on n'a pas la main complète dans cette fonction
          // On pourrait ajouter un tag 'warning' pour inviter à la réflexion
      }
    }

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

    // --- ANALYSE : SACRIFICE D'AS ---
    if (!contrat.id.includes('misere') && carte.valeur === 14 && carte.couleur !== couleurDemandee && carte.couleur !== atout) {
        commentaires.push({
          type: 'error',
          titre: "Sacrifice d'As",
          description: `Vous avez défaussé un As alors que vous ne pouviez pas gagner le pli. C'est une carte maîtresse perdue.`,
          joueurId
        });
    }

    // --- ANALYSE : SURMONTER SON PARTENAIRE ---
    if (partenaireEnTete && carte.valeur > meilleurActuel.carte.valeur && carte.couleur === meilleurActuel.carte.couleur) {
      if (!contrat.id.includes('misere')) {
        const estAs = carte.valeur === 14;
        if (i === 3 || !peutEtreBattu(meilleurActuel.carte, pli, atout)) {
          commentaires.push({
            type: estAs ? 'error' : 'warning',
            titre: estAs ? "Sacrifice d'As" : 'Surpasse inutile',
            description: estAs
              ? `Vous avez jeté un As sur le pli de votre partenaire qui gagnait déjà. C'est un énorme gaspillage.`
              : `Vous avez joué une carte plus forte que votre partenaire alors qu'il gagnait déjà le pli.`,
            joueurId
          });
        }
      }
    }

    // --- ANALYSE : DÉFAUSSE D'AS INUTILE ---
    if (!contrat.id.includes('misere') && !partenaireEnTete && carte.valeur === 14 && carte.couleur !== couleurDemandee && carte.couleur !== atout) {
        commentaires.push({
          type: 'error',
          titre: "Sacrifice d'As",
          description: `Vous avez défaussé un As sur un pli perdu. Vous auriez dû le garder pour prendre la main plus tard.`,
          joueurId
        });
    }

    // --- ANALYSE : GASPILLAGE DE PETITE CARTE (MISÈRE) ---
    if (contrat.id.includes('misere') && estSoliste(joueurId) && !partenaireEnTete) {
      const estDernier = i === 3;

      // Si on joue une carte très basse (2, 3, 4) alors que la carte en tête est haute (10+)
      // et qu'on est le dernier à parler -> On aurait dû jeter une grosse carte !
      if (estDernier && carte.valeur <= 6 && meilleurActuel.carte.valeur >= 10) {
        commentaires.push({
          type: 'warning',
          titre: 'Gaspillage de sécurité',
          description: `En misère, quand vous êtes le dernier à parler et que le pli est déjà gagné par un autre, profitez-en pour jeter vos plus grosses cartes.`,
          joueurId
        });
      }

      // À l'inverse, si on joue haut alors qu'on n'est pas le dernier
      if (!estDernier && carte.valeur >= 10 && !estPlusForte(carte, meilleurActuel.carte, couleurDemandee!, atout)) {
         // Si la carte maîtresse était encore plus haute (ex: Valet), c'est du nettoyage !
         if (meilleurActuel.carte.valeur > carte.valeur) {
            commentaires.push({
              type: 'good',
              titre: 'Bon nettoyage de main',
              description: `En misère, jeter un ${LABEL_VALEUR[carte.valeur]} sous un ${LABEL_VALEUR[meilleurActuel.carte.valeur]} adverse est un excellent coup pour purger votre main.`,
              joueurId
            });
         } else {
            commentaires.push({
              type: 'error',
              titre: 'Prise de risque inutile',
              description: `En misère, si vous n'êtes pas le dernier à parler, jouez vos plus petites cartes pour éviter qu'un joueur suivant ne vous force à prendre le pli.`,
              joueurId
            });
         }
      }
    }

    // --- ANALYSE : MISERE (Entame du soliste) ---
    if (contrat.id.includes('misere') && estSoliste(joueurId) && i === 0) {
      if (carte.valeur >= 9) {
        commentaires.push({
          type: 'error',
          titre: 'Entame dangereuse',
          description: `Entamer avec une carte haute (${LABEL_VALEUR[carte.valeur]}) en misère est très risqué. Privilégiez vos plus petites cartes.`,
          joueurId
        });
      }
    }

    // --- ANALYSE : MISERE (Entame des défenseurs) ---
    if (contrat.id.includes('misere') && !estSoliste(entame.joueurId) && i === 0) {
      const couleursEpuisees = determinerCouleursEpuiseesMisere(contrat.joueurId, historiquePlis);
      if (couleursEpuisees.has(entame.carte.couleur)) {
        commentaires.push({
          type: 'error',
          titre: 'Défausse offerte',
          description: `Vous avez entamé dans une couleur que le soliste n'a plus. Cela lui permet de se défausser gratuitement de ses cartes dangereuses.`,
          joueurId: entame.joueurId,
        });
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
