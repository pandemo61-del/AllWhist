// ─────────────────────────────────────────────
//  CALCUL DES SCORES
// ─────────────────────────────────────────────

import { ContratJoue } from './types';
import { ScoreManche } from './types';

export interface ResultatManche {
  reussite: boolean;
  plisJoueurEtPartenaire: number;
  deltaScores: Record<number, number>;
  details: string;
}

// ─── Évaluation de la réussite ─────────────────

export function evaluerReussite(
  contrat: ContratJoue,
  plisParJoueur: Record<number, number>,
): boolean {
  const plisJoueur     = plisParJoueur[contrat.joueurId] ?? 0;
  const plisPartenaire = contrat.partenaireId !== undefined
    ? (plisParJoueur[contrat.partenaireId] ?? 0)
    : 0;
  const total = plisJoueur + plisPartenaire;

  // Misère / Misère ouverte : aucun pli
  if (contrat.id.startsWith('misere')) return total === 0;

  return total >= contrat.plisObjectif;
}

// ─── Score générique Whist (Demande/Solo/Abondance) ─

export function calculerScoreGenerique(
  contrat: ContratJoue,
  plisParJoueur: Record<number, number>,
  nbJoueurs = 4,
): ResultatManche {
  const reussite = evaluerReussite(contrat, plisParJoueur);
  const delta: Record<number, number> = {};
  const joueurIds = Object.keys(plisParJoueur).map(Number);

  const defenseIds = joueurIds.filter(
    id => id !== contrat.joueurId && id !== contrat.partenaireId,
  );

  if (reussite) {
    // Joueur principal
    delta[contrat.joueurId] = contrat.pointsReussite;
    // Partenaire (Demande) : demi-points
    if (contrat.partenaireId !== undefined) {
      delta[contrat.partenaireId] = Math.floor(contrat.pointsReussite / 2);
    }
    // Défenseurs : légère pénalité
    for (const id of defenseIds) {
      delta[id] = -5;
    }
  } else {
    // Joueur chute
    delta[contrat.joueurId] = -contrat.pointsEchec;
    if (contrat.partenaireId !== undefined) {
      delta[contrat.partenaireId] = -Math.floor(contrat.pointsEchec / 2);
    }
    // Défenseurs gagnent des points
    const bonusDefense = Math.floor(contrat.pointsEchec / defenseIds.length);
    for (const id of defenseIds) {
      delta[id] = bonusDefense;
    }
  }

  const plisTotal = (plisParJoueur[contrat.joueurId] ?? 0) +
    (contrat.partenaireId !== undefined ? (plisParJoueur[contrat.partenaireId] ?? 0) : 0);

  return {
    reussite,
    plisJoueurEtPartenaire: plisTotal,
    deltaScores: delta,
    details: reussite
      ? `✓ ${contrat.nom} réussi — ${plisTotal} plis (objectif: ${contrat.plisObjectif})`
      : `✗ ${contrat.nom} chute — ${plisTotal}/${contrat.plisObjectif} plis`,
  };
}

// ─── Score Whist Classique ─────────────────────

/**
 * Whist classique : équipe 0/2 vs équipe 1/3.
 * Chaque pli au-delà de 6 = 1 point.
 */
export function calculerScoreClassique(
  plisParJoueur: Record<number, number>,
): ResultatManche {
  const plisEquipeA = (plisParJoueur[0] ?? 0) + (plisParJoueur[2] ?? 0);
  const plisEquipeB = (plisParJoueur[1] ?? 0) + (plisParJoueur[3] ?? 0);
  const ptA = Math.max(0, plisEquipeA - 6);
  const ptB = Math.max(0, plisEquipeB - 6);
  const delta: Record<number, number> = {
    0: ptA, 1: ptB, 2: ptA, 3: ptB,
  };
  const reussite = ptA > 0 || ptB > 0;
  return {
    reussite,
    plisJoueurEtPartenaire: plisEquipeA,
    deltaScores: delta,
    details: `Équipe A: ${plisEquipeA} plis (+${ptA} pt) | Équipe B: ${plisEquipeB} plis (+${ptB} pt)`,
  };
}

// ─── Score Boston Whist ────────────────────────

const POINTS_BOSTON: Record<string, { reussite: number; echec: number }> = {
  boston:        { reussite: 10,  echec: 10  },
  piccolo:       { reussite: 15,  echec: 15  },
  misere:        { reussite: 20,  echec: 20  },
  boston_sur:    { reussite: 20,  echec: 20  },
  misere_ouverte:{ reussite: 40,  echec: 40  },
  chelem:        { reussite: 100, echec: 100 },
};

export function calculerScoreBoston(
  contrat: ContratJoue,
  plisParJoueur: Record<number, number>,
): ResultatManche {
  const pts = POINTS_BOSTON[contrat.id] ?? { reussite: contrat.pointsReussite, echec: contrat.pointsEchec };
  const reussite = evaluerReussite(contrat, plisParJoueur);
  const joueurIds = Object.keys(plisParJoueur).map(Number);
  const defenseIds = joueurIds.filter(id => id !== contrat.joueurId);
  const delta: Record<number, number> = {};

  if (reussite) {
    delta[contrat.joueurId] = pts.reussite * 3; // gagne 3× (des 3 adversaires)
    for (const id of defenseIds) delta[id] = -pts.reussite;
  } else {
    delta[contrat.joueurId] = -pts.echec * 3;
    for (const id of defenseIds) delta[id] = pts.echec;
  }

  return {
    reussite,
    plisJoueurEtPartenaire: plisParJoueur[contrat.joueurId] ?? 0,
    deltaScores: delta,
    details: reussite
      ? `✓ ${contrat.nom} réussi (+${pts.reussite * 3} pts)`
      : `✗ ${contrat.nom} chute (−${pts.echec * 3} pts)`,
  };
}

// ─── Construction du ScoreManche ───────────────

// ─── Score Solo Whist (British) ────────────────

export function calculerScoreSolo(
  contrat: ContratJoue,
  plisParJoueur: Record<number, number>,
): ResultatManche {
  const reussite = evaluerReussite(contrat, plisParJoueur);
  const delta: Record<number, number> = {};
  const joueurIds = Object.keys(plisParJoueur).map(Number);

  // Barème officiel en unités (ex: 1, 2, 3, 4, 6)
  // On multiplie par 10 pour l'affichage
  const bareme: Record<string, number> = {
    proposal: 10,
    solo: 20,
    misere: 30,
    abondance: 40,
    misere_ouverte: 60,
    abondance_declaree: 100,
  };

  const points = bareme[contrat.id] ?? 10;

  if (contrat.id === 'proposal') {
    // Jeu à deux : les 2 gagnants reçoivent 'points' des 2 perdants
    const gagnants = [contrat.joueurId, contrat.partenaireId!];
    const perdants = joueurIds.filter(id => !gagnants.includes(id));

    if (reussite) {
      gagnants.forEach(id => delta[id] = points);
      perdants.forEach(id => delta[id] = -points);
    } else {
      gagnants.forEach(id => delta[id] = -points);
      perdants.forEach(id => delta[id] = points);
    }
  } else {
    // Jeu seul contre 3
    const defenseIds = joueurIds.filter(id => id !== contrat.joueurId);
    if (reussite) {
      delta[contrat.joueurId] = points * 3;
      defenseIds.forEach(id => delta[id] = -points);
    } else {
      delta[contrat.joueurId] = -points * 3;
      defenseIds.forEach(id => delta[id] = points);
    }
  }

  const plisTotal = (plisParJoueur[contrat.joueurId] ?? 0) +
    (contrat.partenaireId !== undefined ? (plisParJoueur[contrat.partenaireId] ?? 0) : 0);

  return {
    reussite,
    plisJoueurEtPartenaire: plisTotal,
    deltaScores: delta,
    details: reussite ? `✓ ${contrat.nom} réussi` : `✗ ${contrat.nom} chute`,
  };
}

// ─── Score Bid Whist ───────────────────────────

export function calculerScoreBidWhist(
  contrat: ContratJoue,
  plisParJoueur: Record<number, number>,
): ResultatManche {
  const reussite = evaluerReussite(contrat, plisParJoueur);
  const delta: Record<number, number> = {};

  // Équipes fixes 0/2 vs 1/3
  const equipeA = [0, 2];
  const equipeB = [1, 3];
  const estEquipeA = equipeA.includes(contrat.joueurId);

  const plisEquipeA = (plisParJoueur[0] ?? 0) + (plisParJoueur[2] ?? 0);
  const plisEquipeB = (plisParJoueur[1] ?? 0) + (plisParJoueur[3] ?? 0);

  let scoreA = 0;
  let scoreB = 0;

  if (reussite) {
    // Gagnant : 1 pt par pli au-delà de 6
    const pts = (estEquipeA ? plisEquipeA : plisEquipeB) - 6;
    const finalPts = contrat.sanAtout ? pts * 2 : pts;
    if (estEquipeA) scoreA = finalPts; else scoreB = finalPts;
  } else {
    // Perdant : perd le montant de l'enchère (plisObjectif - 6)
    const enchere = contrat.plisObjectif - 6;
    const finalLoss = contrat.sanAtout ? enchere * 2 : enchere;
    if (estEquipeA) scoreA = -finalLoss; else scoreB = -finalLoss;
  }

  equipeA.forEach(id => delta[id] = scoreA);
  equipeB.forEach(id => delta[id] = scoreB);

  return {
    reussite,
    plisJoueurEtPartenaire: estEquipeA ? plisEquipeA : plisEquipeB,
    deltaScores: delta,
    details: reussite ? `✓ Contrat rempli (+${estEquipeA ? scoreA : scoreB})` : `✗ Chute (${estEquipeA ? scoreA : scoreB})`,
  };
}

// ─── Construction du ScoreManche ───────────────

export function construireScoreManche(
  manche: number,
  contrat: ContratJoue,
  plisParJoueur: Record<number, number>,
  resultat: ResultatManche,
): ScoreManche {
  return {
    manche,
    contrat,
    plisParJoueur,
    deltaScores: resultat.deltaScores,
    reussite: resultat.reussite,
    details: resultat.details,
  };
}
