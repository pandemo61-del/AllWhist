import { determinerGagnant, compterPlisParJoueur } from '../engine/rules';
import { evaluerReussite, calculerScoreGenerique, calculerScoreWhistBelge, calculerScoreBoston, calculerScoreSolo } from '../engine/scoring';
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

  describe('Calcul des scores Whist Belge (calculerScoreWhistBelge)', () => {
    test('Propose & Emballe réussi sans surplis (8 plis)', () => {
      const contrat: ContratJoue = {
        id: 'emballe', nom: "J'emballe", joueurId: 0, partenaireId: 2, plisObjectif: 8, pointsReussite: 10, pointsEchec: 10, priorite: 1.5, seul: false, sanAtout: false, cartesVisibles: false
      };
      const res = calculerScoreWhistBelge(contrat, { 0: 5, 1: 2, 2: 3, 3: 3 });
      expect(res.reussite).toBe(true);
      expect(res.deltaScores[0]).toBe(10);
      expect(res.deltaScores[2]).toBe(10);
      expect(res.deltaScores[1]).toBe(-10);
      expect(res.deltaScores[3]).toBe(-10);
      // Somme nulle
      expect(Object.values(res.deltaScores).reduce((a, b) => a + b, 0)).toBe(0);
    });

    test('Propose & Emballe réussi avec 2 surplis (10 plis)', () => {
      const contrat: ContratJoue = {
        id: 'emballe', nom: "J'emballe", joueurId: 0, partenaireId: 2, plisObjectif: 8, pointsReussite: 10, pointsEchec: 10, priorite: 1.5, seul: false, sanAtout: false, cartesVisibles: false
      };
      const res = calculerScoreWhistBelge(contrat, { 0: 6, 1: 2, 2: 4, 3: 1 });
      expect(res.reussite).toBe(true);
      expect(res.deltaScores[0]).toBe(12); // 10 + 2 surplis
      expect(res.deltaScores[2]).toBe(12);
      expect(res.deltaScores[1]).toBe(-12);
      expect(res.deltaScores[3]).toBe(-12);
      expect(Object.values(res.deltaScores).reduce((a, b) => a + b, 0)).toBe(0);
    });

    test('Solo 6 réussi avec 2 surplis (8 plis = 17 pts/défenseur)', () => {
      const contrat: ContratJoue = {
        id: 'solo_6', nom: 'Solo 6', joueurId: 0, plisObjectif: 6, pointsReussite: 15, pointsEchec: 15, priorite: 2, seul: true, sanAtout: false, cartesVisibles: false
      };
      const res = calculerScoreWhistBelge(contrat, { 0: 8, 1: 2, 2: 2, 3: 1 });
      expect(res.reussite).toBe(true);
      expect(res.deltaScores[0]).toBe(51); // (15 + 2) * 3 = 51
      expect(res.deltaScores[1]).toBe(-17);
      expect(res.deltaScores[2]).toBe(-17);
      expect(res.deltaScores[3]).toBe(-17);
      expect(Object.values(res.deltaScores).reduce((a, b) => a + b, 0)).toBe(0);
    });

    test('Trou réussi avec 1 surplis (10 plis = 31 pts par partenaire)', () => {
      const contrat: ContratJoue = {
        id: 'trou', nom: 'Trou', joueurId: 0, partenaireId: 3, plisObjectif: 9, pointsReussite: 30, pointsEchec: 30, priorite: 7, seul: false, sanAtout: false, cartesVisibles: false
      };
      const res = calculerScoreWhistBelge(contrat, { 0: 6, 1: 2, 2: 1, 3: 4 });
      expect(res.reussite).toBe(true);
      expect(res.deltaScores[0]).toBe(31); // 30 + 1
      expect(res.deltaScores[3]).toBe(31);
      expect(res.deltaScores[1]).toBe(-31);
      expect(res.deltaScores[2]).toBe(-31);
      expect(Object.values(res.deltaScores).reduce((a, b) => a + b, 0)).toBe(0);
    });

    test('Trou Royal réussi sans surplis (9 plis)', () => {
      const contrat: ContratJoue = {
        id: 'trou_royal', nom: 'Trou Royal', joueurId: 0, partenaireId: 3, plisObjectif: 9, pointsReussite: 60, pointsEchec: 60, priorite: 7.5, seul: false, sanAtout: false, cartesVisibles: false
      };
      const res = calculerScoreWhistBelge(contrat, { 0: 5, 1: 2, 2: 2, 3: 4 });
      expect(res.reussite).toBe(true);
      expect(res.deltaScores[0]).toBe(60);
      expect(res.deltaScores[3]).toBe(60);
      expect(res.deltaScores[1]).toBe(-60);
      expect(res.deltaScores[2]).toBe(-60);
      expect(Object.values(res.deltaScores).reduce((a, b) => a + b, 0)).toBe(0);
    });

    test('Petite Misère réussie (30 pts par défenseur)', () => {
      const contrat: ContratJoue = {
        id: 'petite_misere', nom: 'Petite Misère', joueurId: 0, plisObjectif: 0, pointsReussite: 30, pointsEchec: 30, priorite: 4, seul: true, sanAtout: true, cartesVisibles: false
      };
      const res = calculerScoreWhistBelge(contrat, { 0: 0, 1: 5, 2: 4, 3: 3 });
      expect(res.reussite).toBe(true);
      expect(res.deltaScores[0]).toBe(90); // 30 * 3
      expect(res.deltaScores[1]).toBe(-30);
      expect(res.deltaScores[2]).toBe(-30);
      expect(res.deltaScores[3]).toBe(-30);
      expect(Object.values(res.deltaScores).reduce((a, b) => a + b, 0)).toBe(0);
    });

    test('Chelem réussi (250 pts par défenseur)', () => {
      const contrat: ContratJoue = {
        id: 'chelem', nom: 'Chelem', joueurId: 0, plisObjectif: 13, pointsReussite: 250, pointsEchec: 250, priorite: 12, seul: true, sanAtout: false, cartesVisibles: false
      };
      const res = calculerScoreWhistBelge(contrat, { 0: 13, 1: 0, 2: 0, 3: 0 });
      expect(res.reussite).toBe(true);
      expect(res.deltaScores[0]).toBe(750); // 250 * 3
      expect(res.deltaScores[1]).toBe(-250);
      expect(res.deltaScores[2]).toBe(-250);
      expect(res.deltaScores[3]).toBe(-250);
      expect(Object.values(res.deltaScores).reduce((a, b) => a + b, 0)).toBe(0);
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
