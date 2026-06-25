// ─────────────────────────────────────────────
//  VARIANTES : Classique · Solo · Boston · Bid
// ─────────────────────────────────────────────

import { VariantConfig } from './types';
import {
  calculerScoreGenerique,
  calculerScoreClassique,
  calculerScoreBoston,
  calculerScoreSolo,
  calculerScoreBidWhist,
} from '../engine/scoring';

// ══════════════════════════════════════════════
//  WHIST CLASSIQUE
// ══════════════════════════════════════════════

export const WhistClassique: VariantConfig = {
  id: 'whist-classique',
  nom: 'Whist classique',
  difficulte: 'debutant',
  couleurBadge: '#1D9E75',
  description:
    'La forme originale du Whist, née au XVIIIe siècle en Angleterre. ' +
    'Pas d\'enchères, deux équipes fixes, et l\'atout est révélé par la dernière carte distribuée.',
  regles: [
    'Deux équipes fixes : joueurs 0 et 2 contre joueurs 1 et 3.',
    'Chaque joueur reçoit 13 cartes. La 52e carte est retournée face visible : c\'est l\'atout.',
    'Le joueur à gauche du donneur entame.',
    'Chaque joueur doit fournir la couleur demandée s\'il le peut.',
    'S\'il ne peut pas fournir, il peut couper (jouer atout) ou se défausser.',
    'Le pli est remporté par la carte la plus forte de la couleur demandée, ou par le meilleur atout.',
    'Le gagnant d\'un pli entame le suivant.',
    'Chaque pli au-delà de 6 rapporte 1 point à l\'équipe. La partie se joue en 7 points.',
    'Le jeu se déroule en silence — aucune communication entre partenaires.',
  ],
  contrats: [
    {
      id: 'classique',
      nom: 'Partie classique',
      description: 'Faire le maximum de plis avec son partenaire.',
      plisMin: 7, plisMax: 13,
      seul: false, partenaire: true,
      pointsReussite: 1, pointsEchec: 0,
      sanAtout: false, cartesVisibles: false,
      priorite: 1,
    },
  ],
  nbJoueurs: 4,
  avecJoker: false,
  atoutChoisi: false,   // atout = dernière carte retournée
  partenaire: 'fixe',
  equipeFixe: true,
  plisParManche: 13,
  calculScore: (_, plisParJoueur) => calculerScoreClassique(plisParJoueur),
};

// ══════════════════════════════════════════════
//  SOLO WHIST
// ══════════════════════════════════════════════

export const SoloWhist: VariantConfig = {
  id: 'solo-whist',
  nom: 'Solo Whist',
  difficulte: 'intermediaire',
  couleurBadge: '#378ADD',
  description:
    'La version britannique moderne, très jouée en club. Un contre trois, ' +
    'avec une hiérarchie d\'enchères allant du simple Proposal jusqu\'à l\'Abondance déclarée.',
  regles: [
    'Chaque joueur reçoit 13 cartes.',
    'Les enchères se font dans l\'ordre. Le contrat le plus élevé remporte les enchères.',
    'Proposal & Acceptance : deux joueurs s\'associent pour faire 8 plis ensemble.',
    'Solo : un joueur seul fait 5 plis avec l\'atout de son choix.',
    'Misère : un joueur seul ne fait aucun pli, sans atout.',
    'Abondance : un joueur seul fait 9 plis avec l\'atout de son choix.',
    'Misère ouverte : comme la Misère mais les cartes sont abattues sur table.',
    'Abondance déclarée : 13 plis, l\'atout est imposé par la distribution (dernière carte).',
    'Les 3 défenseurs peuvent librement collaborer pour contrer le soliste.',
  ],
  contrats: [
    {
      id: 'passe',
      nom: 'Passe',
      description: 'Je passe.',
      plisMin: 0, plisMax: 0,
      seul: false, partenaire: false,
      pointsReussite: 0, pointsEchec: 0,
      sanAtout: false, cartesVisibles: false,
      priorite: 0,
    },
    {
      id: 'proposal',
      nom: 'Proposal',
      description: 'Cherche un partenaire pour faire 8 plis ensemble.',
      plisMin: 8, plisMax: 13,
      seul: false, partenaire: true,
      pointsReussite: 10, pointsEchec: 10,
      sanAtout: false, cartesVisibles: false,
      priorite: 1,
    },
    {
      id: 'solo',
      nom: 'Solo',
      description: 'Faire 5 plis seul.',
      plisMin: 5, plisMax: 13,
      seul: true, partenaire: false,
      pointsReussite: 20, pointsEchec: 20,
      sanAtout: false, cartesVisibles: false,
      priorite: 2,
    },
    {
      id: 'misere',
      nom: 'Misère',
      description: 'Zéro pli, sans atout.',
      plisMin: 0, plisMax: 0,
      seul: true, partenaire: false,
      pointsReussite: 30, pointsEchec: 30,
      sanAtout: true, cartesVisibles: false,
      priorite: 3,
    },
    {
      id: 'abondance',
      nom: 'Abondance',
      description: 'Faire 9 plis seul.',
      plisMin: 9, plisMax: 13,
      seul: true, partenaire: false,
      pointsReussite: 40, pointsEchec: 40,
      sanAtout: false, cartesVisibles: false,
      priorite: 4,
    },
    {
      id: 'misere_ouverte',
      nom: 'Misère ouverte',
      description: 'Zéro pli, cartes abattues.',
      plisMin: 0, plisMax: 0,
      seul: true, partenaire: false,
      pointsReussite: 60, pointsEchec: 60,
      sanAtout: true, cartesVisibles: true,
      priorite: 5,
    },
    {
      id: 'abondance_declaree',
      nom: 'Abondance déclarée',
      description: 'Faire 13 plis. Atout imposé par distribution.',
      plisMin: 13, plisMax: 13,
      seul: true, partenaire: false,
      pointsReussite: 80, pointsEchec: 80,
      sanAtout: false, cartesVisibles: false,
      priorite: 6,
    },
  ],
  nbJoueurs: 4,
  avecJoker: false,
  atoutChoisi: true,
  partenaire: 'as-secret',
  equipeFixe: false,
  plisParManche: 13,
  calculScore: calculerScoreSolo,
};

// ══════════════════════════════════════════════
//  BOSTON WHIST
// ══════════════════════════════════════════════

export const BostonWhist: VariantConfig = {
  id: 'boston-whist',
  nom: 'Boston Whist',
  difficulte: 'expert',
  couleurBadge: '#E24B4A',
  description:
    'La variante aristocratique du XVIIIe siècle. Jeu individuel avec une hiérarchie ' +
    'd\'enchères très élaborée, des surenchères possibles, et une prise de risque centrale.',
  regles: [
    'Chaque joueur joue pour lui-même — aucune équipe permanente.',
    'Hiérarchie des contrats (du plus faible au plus fort) : Boston, Piccolo, Misère, Boston sur, Misère ouverte, Chelem.',
    'Boston : faire exactement 5 plis spécifiés.',
    'Piccolo : faire exactement 1 pli.',
    'Misère : ne faire aucun pli, sans atout.',
    'Misère ouverte : idem, cartes visibles.',
    'Chelem : faire les 13 plis.',
    'Chaque contrat peut être surenchéri par un joueur suivant.',
    'En cas de réussite, le soliste gagne des points aux 3 adversaires (et inversement si chute).',
    'Le tableau de points est fixe par type de contrat.',
  ],
  contrats: [
    {
      id: 'passe',
      nom: 'Passe',
      description: 'Je passe.',
      plisMin: 0, plisMax: 0,
      seul: true, partenaire: false,
      pointsReussite: 0, pointsEchec: 0,
      sanAtout: false, cartesVisibles: false,
      priorite: 0,
    },
    {
      id: 'boston',
      nom: 'Boston',
      description: 'Faire exactement 5 plis.',
      plisMin: 5, plisMax: 5,
      seul: true, partenaire: false,
      pointsReussite: 10, pointsEchec: 10,
      sanAtout: false, cartesVisibles: false,
      priorite: 1,
    },
    {
      id: 'piccolo',
      nom: 'Piccolo',
      description: 'Faire exactement 1 pli.',
      plisMin: 1, plisMax: 1,
      seul: true, partenaire: false,
      pointsReussite: 15, pointsEchec: 15,
      sanAtout: false, cartesVisibles: false,
      priorite: 2,
    },
    {
      id: 'misere',
      nom: 'Misère',
      description: 'Zéro pli, sans atout.',
      plisMin: 0, plisMax: 0,
      seul: true, partenaire: false,
      pointsReussite: 20, pointsEchec: 20,
      sanAtout: true, cartesVisibles: false,
      priorite: 3,
    },
    {
      id: 'boston_sur',
      nom: 'Boston sur',
      description: 'Boston surenchéri : 6 plis minimum.',
      plisMin: 6, plisMax: 13,
      seul: true, partenaire: false,
      pointsReussite: 20, pointsEchec: 20,
      sanAtout: false, cartesVisibles: false,
      priorite: 4,
    },
    {
      id: 'misere_ouverte',
      nom: 'Misère ouverte',
      description: 'Zéro pli, cartes abattues sur table.',
      plisMin: 0, plisMax: 0,
      seul: true, partenaire: false,
      pointsReussite: 40, pointsEchec: 40,
      sanAtout: true, cartesVisibles: true,
      priorite: 5,
    },
    {
      id: 'chelem',
      nom: 'Chelem',
      description: 'Faire les 13 plis.',
      plisMin: 13, plisMax: 13,
      seul: true, partenaire: false,
      pointsReussite: 160, pointsEchec: 160,
      sanAtout: false, cartesVisibles: false,
      priorite: 6,
    },
  ],
  nbJoueurs: 4,
  avecJoker: false,
  atoutChoisi: true,
  partenaire: 'aucun',
  equipeFixe: false,
  plisParManche: 13,
  calculScore: calculerScoreBoston,
};

// ══════════════════════════════════════════════
//  BID WHIST
// ══════════════════════════════════════════════

export const BidWhist: VariantConfig = {
  id: 'bid-whist',
  nom: 'Bid Whist',
  difficulte: 'expert',
  couleurBadge: '#9C6EDD',
  description:
    'La version américaine avec Joker. Le gagnant des enchères récupère 6 cartes cachées (le Kitty) ' +
    'et peut jouer en "descendant" — où le 2 bat l\'As !',
  regles: [
    'Deux équipes fixes : joueurs 0/2 contre joueurs 1/3.',
    'Un Joker est inclus dans le jeu (la carte la plus forte).',
    'Chaque joueur reçoit 12 cartes. Les 6 restantes forment le Kitty (face cachée).',
    'Les enchères indiquent le nombre de plis à faire (minimum 3, enchère "6").',
    'Le gagnant des enchères récupère le Kitty et en défausse 6 cartes.',
    'L\'enchère précise aussi le mode : Montant (ordre normal), Descendant (2 > A) ou Sans-atout.',
    'En mode Descendant, l\'ordre est inversé : 2, 3, 4... > ..., R, A.',
    'Le Joker est toujours la plus forte, quel que soit le mode.',
    'L\'équipe enchérisseuse doit atteindre son contrat ou perdre des points.',
  ],
  contrats: [
    {
      id: 'passe',
      nom: 'Passe',
      description: 'Je passe.',
      plisMin: 0, plisMax: 0,
      seul: false, partenaire: false,
      pointsReussite: 0, pointsEchec: 0,
      sanAtout: false, cartesVisibles: false,
      priorite: 0,
    },
    {
      id: 'bid_3_montant',
      nom: '3 Montant',
      description: 'Faire 9 plis (6+3) en ordre normal.',
      plisMin: 9, plisMax: 13,
      seul: false, partenaire: true,
      pointsReussite: 3, pointsEchec: 3,
      sanAtout: false, cartesVisibles: false,
      priorite: 1,
    },
    {
      id: 'bid_3_descendant',
      nom: '3 Descendant',
      description: 'Faire 9 plis en ordre inversé (2 bat l\'As).',
      plisMin: 9, plisMax: 13,
      seul: false, partenaire: true,
      pointsReussite: 3, pointsEchec: 3,
      sanAtout: false, cartesVisibles: false,
      ordreInverse: true,
      priorite: 2,
    } as any,
    {
      id: 'bid_3_sans',
      nom: '3 Sans-atout',
      description: 'Faire 9 plis sans atout (points doublés).',
      plisMin: 9, plisMax: 13,
      seul: false, partenaire: true,
      pointsReussite: 6, pointsEchec: 6,
      sanAtout: true, cartesVisibles: false,
      priorite: 3,
    },
    {
      id: 'bid_6_sans',
      nom: '6 Sans-atout',
      description: 'Faire 12 plis sans atout — points doublés.',
      plisMin: 12, plisMax: 13,
      seul: false, partenaire: true,
      pointsReussite: 12, pointsEchec: 12,
      sanAtout: true, cartesVisibles: false,
      priorite: 10,
    },
    {
      id: 'bid_7_sans',
      nom: '7 Sans-atout (Chelem)',
      description: 'Faire les 13 plis sans atout — points doublés.',
      plisMin: 13, plisMax: 13,
      seul: false, partenaire: true,
      pointsReussite: 14, pointsEchec: 14,
      sanAtout: true, cartesVisibles: false,
      priorite: 12,
    },
  ],
  nbJoueurs: 4,
  avecJoker: true,
  avecKitty: true,
  atoutChoisi: true,
  partenaire: 'fixe',
  equipeFixe: true,
  plisParManche: 13,
  calculScore: calculerScoreBidWhist,
};
