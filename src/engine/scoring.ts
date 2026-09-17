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
  if (contrat.id.includes('misere')) return total === 0;

  return total >= contrat.plisObjectif;
}

// ─── Score générique Whist (Demande/Solo/Abondance) ─

export function calculerScoreGenerique(
  contrat: ContratJoue,
  plisParJoueur: Record<number, number>,
  _joueurs?: any[],
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

// ─── Score Whist Belge / International ─────────

/**
 * Whist Belge : Somme nulle, gain/perte par adversaire.
 */
export function calculerScoreWhistBelge(
  contrat: ContratJoue,
  plisParJoueur: Record<number, number>,
  _joueurs?: any[],
  nbJoueurs = 4,
): ResultatManche {
  const reussite = evaluerReussite(contrat, plisParJoueur);
  const delta: Record<number, number> = {};
  const joueurIds = Object.keys(plisParJoueur).map(Number);
  joueurIds.forEach(id => delta[id] = 0);

  const defenseIds = joueurIds.filter(
    id => id !== contrat.joueurId && id !== contrat.partenaireId,
  );

  const plisJoueur = plisParJoueur[contrat.joueurId] ?? 0;
  const plisPartenaire = contrat.partenaireId !== undefined
    ? (plisParJoueur[contrat.partenaireId] ?? 0)
    : 0;
  const plisTotal = plisJoueur + plisPartenaire;

  // Calcul du montant de base par adversaire
  let montantParAdversaire = reussite ? contrat.pointsReussite : contrat.pointsEchec;

  // Bonus Surplis (uniquement pour les contrats à l'atout hors Abondance/Trou)
  if (reussite && (contrat.id === 'propose' || contrat.id === 'emballe' || contrat.id.startsWith('solo'))) {
    const surplis = plisTotal - contrat.plisObjectif;
    if (surplis > 0) {
      montantParAdversaire += surplis; // +1 pt par surplis par adversaire
    }
  }

  if (reussite) {
    const totalGagné = montantParAdversaire * defenseIds.length;

    if (contrat.partenaireId !== undefined) {
      // Partage entre partenaires (50/50)
      const part = Math.floor(totalGagné / 2);
      delta[contrat.joueurId] = part;
      delta[contrat.partenaireId] = totalGagné - part;
    } else {
      // Soliste prend tout
      delta[contrat.joueurId] = totalGagné;
    }

    // Défenseurs paient
    for (const id of defenseIds) {
      delta[id] = -montantParAdversaire;
    }
  } else {
    const totalPerdu = montantParAdversaire * defenseIds.length;

    if (contrat.partenaireId !== undefined) {
      // Partenaires paient à la défense
      const part = Math.floor(totalPerdu / 2);
      delta[contrat.joueurId] = -part;
      delta[contrat.partenaireId] = -(totalPerdu - part);
    } else {
      // Soliste paie tout
      delta[contrat.joueurId] = -totalPerdu;
    }

    // Défenseurs reçoivent
    for (const id of defenseIds) {
      delta[id] = montantParAdversaire;
    }
  }

  return {
    reussite,
    plisJoueurEtPartenaire: plisTotal,
    deltaScores: delta,
    details: reussite
      ? `✓ ${contrat.nom} réussi (+${delta[contrat.joueurId]} pts)`
      : `✗ ${contrat.nom} chute (−${Math.abs(delta[contrat.joueurId])} pts)`,
  };
}

// ─── Score Whist Classique ─────────────────────

/**
 * Whist classique : équipe 0/2 vs équipe 1/3.
 * Chaque pli au-delà de 6 = 1 point.
 */
export function calculerScoreClassique(
  plisParJoueur: Record<number, number>,
  _joueurs?: any[],
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
  joueurs?: Joueur[]
): ResultatManche {
  const pts = POINTS_BOSTON[contrat.id] ?? { reussite: contrat.pointsReussite, echec: contrat.pointsEchec };
  const reussite = evaluerReussite(contrat, plisParJoueur);
  const joueurIds = Object.keys(plisParJoueur).map(Number);
  const defenseIds = joueurIds.filter(id => id !== contrat.joueurId);
  const delta: Record<number, number> = {};

  const plisJoueur = plisParJoueur[contrat.joueurId] ?? 0;

  // Calcul des Surplis (Overtricks) : +5 jetons par pli supplémentaire
  let bonusSurplis = 0;
  if (reussite && contrat.id !== 'misere' && contrat.id !== 'misere_ouverte' && contrat.id !== 'piccolo') {
    bonusSurplis = (plisJoueur - contrat.plisObjectif) * 5;
  }

  // Bonus Honneurs : +10 jetons pour 3 honneurs, +20 pour 4
  let bonusHonneurs = 0;
  if (joueurs && contrat.atout) {
    const main = joueurs.find(j => j.id === contrat.joueurId)?.main || [];
    const honneurs = [11, 12, 13, 14]; // V, D, R, A
    const nbHonneurs = main.filter(c => c.couleur === contrat.atout && honneurs.includes(c.valeur)).length;
    if (nbHonneurs === 3) bonusHonneurs = 10;
    else if (nbHonneurs === 4) bonusHonneurs = 20;
  }

  const gainParAdversaire = pts.reussite + bonusSurplis + bonusHonneurs;

  if (reussite) {
    delta[contrat.joueurId] = gainParAdversaire * 3;
    for (const id of defenseIds) delta[id] = -gainParAdversaire;
  } else {
    delta[contrat.joueurId] = -pts.echec * 3;
    for (const id of defenseIds) delta[id] = pts.echec;
  }

  return {
    reussite,
    plisJoueurEtPartenaire: plisJoueur,
    deltaScores: delta,
    details: reussite
      ? `✓ ${contrat.nom} réussi (+${delta[contrat.joueurId]} pts)`
      : `✗ ${contrat.nom} chute (−${Math.abs(delta[contrat.joueurId])} pts)`,
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

  const bareme: Record<string, number> = {
    proposal: 10,
    solo: 10,
    misere: 20,
    abondance: 30,
    misere_ouverte: 40,
    abondance_declaree: 60,
  };

  const pointsBase = bareme[contrat.id] ?? 10;
  const plisTotal = (plisParJoueur[contrat.joueurId] ?? 0) +
    (contrat.partenaireId !== undefined ? (plisParJoueur[contrat.partenaireId] ?? 0) : 0);

  // Calcul des Overtricks (+/- 2 ou 3 par pli de différence)
  let bonusPlis = 0;
  if (contrat.id === 'proposal' || contrat.id === 'solo') {
    bonusPlis = (plisTotal - contrat.plisObjectif) * 2;
  } else if (contrat.id === 'abondance' || contrat.id === 'abondance_declaree') {
    bonusPlis = (plisTotal - contrat.plisObjectif) * 3;
  }

  const pointsFinal = pointsBase + (reussite ? bonusPlis : -Math.abs(bonusPlis));

  if (contrat.id === 'proposal') {
    const gagnants = [contrat.joueurId, contrat.partenaireId!];
    const perdants = joueurIds.filter(id => !gagnants.includes(id));
    if (reussite) {
      gagnants.forEach(id => delta[id] = pointsFinal);
      perdants.forEach(id => delta[id] = -pointsFinal);
    } else {
      gagnants.forEach(id => delta[id] = -pointsBase);
      perdants.forEach(id => delta[id] = pointsBase);
    }
  } else {
    const defenseIds = joueurIds.filter(id => id !== contrat.joueurId);
    if (reussite) {
      delta[contrat.joueurId] = pointsFinal * 3;
      defenseIds.forEach(id => delta[id] = -pointsFinal);
    } else {
      delta[contrat.joueurId] = -pointsBase * 3;
      defenseIds.forEach(id => delta[id] = pointsBase);
    }
  }

  return {
    reussite,
    plisJoueurEtPartenaire: plisTotal,
    deltaScores: delta,
    details: reussite
      ? `✓ ${contrat.nom} réussi (${pointsFinal} pts)`
      : `✗ ${contrat.nom} chute (${pointsBase} pts)`,
  };
}

// ─── Score Bid Whist ───────────────────────────

export function calculerScoreBidWhist(
  contrat: ContratJoue,
  plisParJoueur: Record<number, number>,
  _joueurs?: any[],
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
