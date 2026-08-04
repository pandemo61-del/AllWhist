import { determinerGagnant, compterPlisParJoueur } from '../engine/rules';
import { evaluerReussite, calculerScoreGenerique, calculerScoreBoston, calculerScoreSolo } from '../engine/scoring';
import { Couleur, Pli, ContratJoue, Carte } from '../engine/types';

// Helper pour créer une carte rapidement
const c = (id: string, couleur: Couleur, valeur: number, estJoker = false): Carte => ({
  id, couleur, valeur, estJoker
});

describe('Moteur de jeu - Règles et Scores', () => {

  describe('Détermination du gagnant du pli', () => {
    test('L\'As de la couleur demandée gagne sans atout', () => {
      const pli: Pli = {
        numero: 1,
        couleurDemandee: Couleur.COEUR,
        cartesJouees: [
          { joueurId: 0, carte: c('c1', Couleur.COEUR, 10) },
          { joueurId: 1, carte: c('c2', Couleur.COEUR, 14) }, // As
          { joueurId: 2, carte: c('c3', Couleur.COEUR, 2) },
          { joueurId: 3, carte: c('c4', Couleur.COEUR, 13) }, // Roi
        ]
      };
      expect(determinerGagnant(pli, null)).toBe(1);
    });

    test('L\'atout gagne même si une autre couleur est plus forte', () => {
      const pli: Pli = {
        numero: 1,
        couleurDemandee: Couleur.TREFLE,
        cartesJouees: [
          { joueurId: 0, carte: c('t1', Couleur.TREFLE, 14) }, // As trèfle
          { joueurId: 1, carte: c('p1', Couleur.PIQUE, 2) },  // 2 pique (atout)
          { joueurId: 2, carte: c('t2', Couleur.TREFLE, 5) },
          { joueurId: 3, carte: c('t3', Couleur.TREFLE, 13) },
        ]
      };
      expect(determinerGagnant(pli, Couleur.PIQUE)).toBe(1);
    });

    test('Le Joker gagne toujours (Bid Whist)', () => {
      const pli: Pli = {
        numero: 1,
        couleurDemandee: Couleur.COEUR,
        cartesJouees: [
          { joueurId: 0, carte: c('c1', Couleur.COEUR, 14) },
          { joueurId: 1, carte: c('j1', Couleur.PIQUE, 0, true) }, // Joker
          { joueurId: 2, carte: c('c2', Couleur.COEUR, 14) },
          { joueurId: 3, carte: c('c3', Couleur.COEUR, 14) },
        ]
      };
      expect(determinerGagnant(pli, Couleur.COEUR)).toBe(1);
    });
  });

  describe('Évaluation de la réussite des contrats', () => {
    const contratSolo: ContratJoue = {
      id: 'solo', nom: 'Solo', joueurId: 0, plisObjectif: 5, pointsReussite: 50, pointsEchec: 50
    };

    test('Réussite Solo si objectif atteint seul', () => {
      const plis = { 0: 5, 1: 3, 2: 3, 3: 2 };
      expect(evaluerReussite(contratSolo, plis)).toBe(true);
    });

    test('Échec Solo si objectif non atteint', () => {
      const plis = { 0: 4, 1: 4, 2: 3, 3: 2 };
      expect(evaluerReussite(contratSolo, plis)).toBe(false);
    });

    test('Réussite Demande avec partenaire secret', () => {
      const contratDemande: ContratJoue = {
        id: 'demande', nom: 'Demande', joueurId: 0, partenaireId: 2, plisObjectif: 8, pointsReussite: 40, pointsEchec: 40
      };
      const plis = { 0: 5, 1: 2, 2: 3, 3: 3 }; // 5 + 3 = 8
      expect(evaluerReussite(contratDemande, plis)).toBe(true);
    });

    test('Réussite Misère (0 pli)', () => {
      const contratMisere: ContratJoue = {
        id: 'misere', nom: 'Misère', joueurId: 0, plisObjectif: 0, pointsReussite: 60, pointsEchec: 60
      };
      expect(evaluerReussite(contratMisere, { 0: 0, 1: 5, 2: 4, 3: 4 })).toBe(true);
      expect(evaluerReussite(contratMisere, { 0: 1, 1: 4, 2: 4, 3: 4 })).toBe(false);
    });
  });

  describe('Calcul des scores (Whist de Gand / Générique)', () => {
    test('Calcul score Solo réussi (0 gagne, les autres perdent)', () => {
      const contrat: ContratJoue = {
        id: 'solo', nom: 'Solo', joueurId: 0, plisObjectif: 5, pointsReussite: 50, pointsEchec: 50
      };
      const res = calculerScoreGenerique(contrat, { 0: 5, 1: 3, 2: 3, 3: 2 });
      expect(res.reussite).toBe(true);
      expect(res.deltaScores[0]).toBe(50);
      expect(res.deltaScores[1]).toBe(-5);
      expect(res.deltaScores[2]).toBe(-5);
      expect(res.deltaScores[3]).toBe(-5);
    });

    test('Calcul score Demande réussi (0 et 2 gagnent)', () => {
      const contrat: ContratJoue = {
        id: 'demande', nom: 'Demande', joueurId: 0, partenaireId: 2, plisObjectif: 8, pointsReussite: 40, pointsEchec: 40
      };
      const res = calculerScoreGenerique(contrat, { 0: 5, 1: 2, 2: 3, 3: 3 });
      expect(res.deltaScores[0]).toBe(40);
      expect(res.deltaScores[2]).toBe(20); // Partenaire gagne la moitié
      expect(res.deltaScores[1]).toBe(-5);
      expect(res.deltaScores[3]).toBe(-5);
    });

    test('Calcul score Solo échoué', () => {
      const contrat: ContratJoue = {
        id: 'solo', nom: 'Solo', joueurId: 0, plisObjectif: 5, pointsReussite: 50, pointsEchec: 60
      };
      const res = calculerScoreGenerique(contrat, { 0: 4, 1: 4, 2: 3, 3: 2 });
      expect(res.reussite).toBe(false);
      expect(res.deltaScores[0]).toBe(-60);
      expect(res.deltaScores[1]).toBe(20); // Bonus défense (60 / 3 défenseurs)
      expect(res.deltaScores[2]).toBe(20);
      expect(res.deltaScores[3]).toBe(20);
    });

    test('Trou (Whist de Gand) : 9 plis avec partenaire', () => {
      const contrat: ContratJoue = {
        id: 'trou', nom: 'Trou', joueurId: 0, partenaireId: 3, plisObjectif: 9, pointsReussite: 60, pointsEchec: 60
      };
      // Réussite : 5 + 4 = 9
      const resOk = calculerScoreGenerique(contrat, { 0: 5, 1: 2, 2: 2, 3: 4 });
      expect(resOk.reussite).toBe(true);
      expect(resOk.deltaScores[0]).toBe(60);
      expect(resOk.deltaScores[3]).toBe(30);

      // Échec : 4 + 4 = 8
      const resFail = calculerScoreGenerique(contrat, { 0: 4, 1: 3, 2: 2, 3: 4 });
      expect(resFail.reussite).toBe(false);
      expect(resFail.deltaScores[0]).toBe(-60);
      expect(resFail.deltaScores[3]).toBe(-30);
    });
  });

  describe('Cas particuliers : Boston et Solo Whist', () => {
    test('Boston : Gain 3x contre la défense', () => {
      const contrat: ContratJoue = {
        id: 'boston', nom: 'Boston', joueurId: 0, plisObjectif: 5, pointsReussite: 10, pointsEchec: 10
      };
      const res = calculerScoreBoston(contrat, { 0: 5, 1: 3, 2: 3, 3: 2 });
      expect(res.deltaScores[0]).toBe(30); // 10 * 3
      expect(res.deltaScores[1]).toBe(-10);
    });

    test('Solo Whist (British) : Proposal réussi', () => {
      const contrat: ContratJoue = {
        id: 'proposal', nom: 'Proposal', joueurId: 0, partenaireId: 1, plisObjectif: 8, pointsReussite: 10, pointsEchec: 10
      };
      const res = calculerScoreSolo(contrat, { 0: 4, 1: 4, 2: 2, 3: 3 }); // 4 + 4 = 8
      expect(res.reussite).toBe(true);
      expect(res.deltaScores[0]).toBe(10);
      expect(res.deltaScores[1]).toBe(10);
      expect(res.deltaScores[2]).toBe(-10);
      expect(res.deltaScores[3]).toBe(-10);
    });
  });

});
