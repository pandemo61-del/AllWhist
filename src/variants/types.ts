// ─────────────────────────────────────────────
//  TYPE — Configuration d'une variante
// ─────────────────────────────────────────────

import { Carte, ContratJoue } from '../engine/types';
import { ResultatManche } from '../engine/scoring';

export interface ContratConfig {
  id: string;
  nom: string;
  description: string;
  plisMin: number;          // 0 pour misère
  plisMax: number;          // 13 pour abondance déclarée
  seul: boolean;            // joue seul contre tous
  partenaire: boolean;      // a un partenaire (Demande)
  pointsReussite: number;
  pointsEchec: number;
  sanAtout: boolean;        // misère → pas d'atout
  cartesVisibles: boolean;  // misère ouverte → cartes abattues
  priorite: number;         // hiérarchie des enchères
  disponibleSi?: (main: Carte[], enchereActuelle?: ContratJoue | null, joueurId?: number) => boolean;
}

export interface VariantConfig {
  id: string;
  nom: string;
  difficulte: 'debutant' | 'intermediaire' | 'expert';
  couleurBadge: string;     // hex pour l'UI
  description: string;
  regles: string[];         // liste ordonnée de règles à afficher
  contrats: ContratConfig[];

  // Gameplay
  nbJoueurs: number;
  avecJoker: boolean;
  atoutChoisi: boolean;     // true = enchérisseur choisit / false = retournée
  partenaire: 'fixe' | 'as-secret' | 'aucun';
  equipeFixe: boolean;      // true = j0/j2 vs j1/j3 (classique)
  ordreInverse?: boolean;   // Bid Whist descendant
  avecKitty?: boolean;      // Bid Whist : 6 cartes cachées
  plisParManche: number;    // toujours 13

  // Calcul de score personnalisé (optionnel — sinon générique)
  calculScore?: (
    contrat: ContratJoue,
    plisParJoueur: Record<number, number>,
  ) => ResultatManche;
}
