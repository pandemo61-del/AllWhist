import { Couleur, Valeur, Carte, Pli, ContratJoue, Joueur } from '../engine/types';
import { determinerCouleursEpuiseesMisere } from '../engine/rules';
import { choisirCarte } from '../ai/SimpleAI';
import { analyserPli } from '../engine/analysis';

describe('Logique Misère & IA Défense', () => {

  const carte = (valeur: Valeur, couleur: Couleur): Carte => ({
    id: `${valeur}_${couleur}`,
    valeur,
    couleur,
  });

  const contratMisere: ContratJoue = {
    id: 'misere',
    nom: 'Grande Misère',
    joueurId: 1, // Soliste = joueur 1
    plisObjectif: 0,
    seul: true,
    sanAtout: true,
    cartesVisibles: false,
    pointsReussite: 60,
    pointsEchec: 60,
    priorite: 9,
  };

  test('détecte correctement les couleurs épuisées chez le soliste', () => {
    // Pli 1 : Joueur 0 entame Cœur. Soliste (Joueur 1) joue Carreau (renonce en Cœur).
    const pli1: Pli = {
      numero: 1,
      couleurDemandee: Couleur.COEUR,
      cartesJouees: [
        { joueurId: 0, carte: carte(Valeur.VALET, Couleur.COEUR) },
        { joueurId: 1, carte: carte(Valeur.CINQ, Couleur.CARREAU) }, // Soliste défausse Carreau
        { joueurId: 2, carte: carte(Valeur.ROI, Couleur.COEUR) },
        { joueurId: 3, carte: carte(Valeur.SEPT, Couleur.COEUR) },
      ],
      gagnantId: 2,
    };

    const epuisees = determinerCouleursEpuiseesMisere(contratMisere.joueurId, [pli1]);

    expect(epuisees.has(Couleur.COEUR)).toBe(true);
    expect(epuisees.has(Couleur.CARREAU)).toBe(false);
  });

  test('IA défenseur n’entame pas dans une couleur épuisée chez le soliste', () => {
    // Pli 1 déjà terminé où le soliste (1) a montré qu’il n'a plus de Cœur
    const pli1: Pli = {
      numero: 1,
      couleurDemandee: Couleur.COEUR,
      cartesJouees: [
        { joueurId: 0, carte: carte(Valeur.VALET, Couleur.COEUR) },
        { joueurId: 1, carte: carte(Valeur.TROIS, Couleur.CARREAU) }, // Soliste n'a plus de Cœur
        { joueurId: 2, carte: carte(Valeur.ROI, Couleur.COEUR) },
        { joueurId: 3, carte: carte(Valeur.HUIT, Couleur.COEUR) },
      ],
      gagnantId: 2,
    };

    // Pli 2 : C’est au tour du joueur 2 d’entamer
    const pli2: Pli = {
      numero: 2,
      cartesJouees: [],
    };

    // Main du joueur 2 : contient l’As de Cœur (couleur épuisée) + Pique + Trèfle
    const joueur2: Joueur = {
      id: 2,
      nom: 'IA Défenseur',
      type: 'ia_expert',
      plisGagnesTotal: 1,
      main: [
        carte(Valeur.AS, Couleur.COEUR),      // Couleur épuisée
        carte(Valeur.ROI, Couleur.PIQUE),     // Couleur encore possible
        carte(Valeur.VALET, Couleur.TREFLE),  // Couleur encore possible
      ],
    };

    const carteChoisie = choisirCarte(
      joueur2,
      pli2,
      null,
      contratMisere,
      [],
      'expert',
      [pli1]
    );

    // L'IA NE DOIT PAS choisir l'As de Cœur car le soliste est vide en Cœur
    expect(carteChoisie.couleur).not.toBe(Couleur.COEUR);
    expect([Couleur.PIQUE, Couleur.TREFLE]).toContain(carteChoisie.couleur);
  });

  test('IA défenseur joue sous la carte du soliste quand il a fourni la couleur', () => {
    // Pli 1 : Joueur 0 entame Trèfle. Soliste (Joueur 1) joue le Valet de Trèfle.
    const pli: Pli = {
      numero: 1,
      couleurDemandee: Couleur.TREFLE,
      cartesJouees: [
        { joueurId: 0, carte: carte(Valeur.CINQ, Couleur.TREFLE) },
        { joueurId: 1, carte: carte(Valeur.VALET, Couleur.TREFLE) }, // Soliste joue le Valet
      ],
    };

    // Joueur 2 a le 3, le 9 et le Roi de Trèfle
    const joueur2: Joueur = {
      id: 2,
      nom: 'IA Défenseur',
      type: 'ia_expert',
      plisGagnesTotal: 0,
      main: [
        carte(Valeur.TROIS, Couleur.TREFLE),
        carte(Valeur.NEUF, Couleur.TREFLE),
        carte(Valeur.ROI, Couleur.TREFLE),
      ],
    };

    const carteChoisie = choisirCarte(
      joueur2,
      pli,
      null,
      contratMisere,
      [],
      'expert',
      []
    );

    // L'IA doit jouer sous le Valet du soliste pour le forcer à garder la main
    expect(carteChoisie.valeur).toBeLessThan(Valeur.VALET);
  });

  test('Analyse experte signale une entame dans une couleur épuisée chez le soliste', () => {
    const pli1: Pli = {
      numero: 1,
      couleurDemandee: Couleur.COEUR,
      cartesJouees: [
        { joueurId: 0, carte: carte(Valeur.VALET, Couleur.COEUR) },
        { joueurId: 1, carte: carte(Valeur.DEUX, Couleur.PIQUE) }, // Soliste défausse Pique -> n'a plus de Cœur
        { joueurId: 2, carte: carte(Valeur.ROI, Couleur.COEUR) },
        { joueurId: 3, carte: carte(Valeur.NEUF, Couleur.COEUR) },
      ],
      gagnantId: 2,
    };

    // Pli 2 : Le joueur 2 entame de nouveau à Cœur alors que le soliste n'en a plus
    const pli2: Pli = {
      numero: 2,
      couleurDemandee: Couleur.COEUR,
      cartesJouees: [
        { joueurId: 2, carte: carte(Valeur.DIX, Couleur.COEUR) },
        { joueurId: 3, carte: carte(Valeur.QUATRE, Couleur.COEUR) },
        { joueurId: 0, carte: carte(Valeur.CINQ, Couleur.COEUR) },
        { joueurId: 1, carte: carte(Valeur.ROI, Couleur.PIQUE) }, // Soliste se défausse du Roi de Pique !
      ],
      gagnantId: 2,
    };

    const commentaires = analyserPli(pli2, contratMisere, null, [pli1]);
    const erreurDefausse = commentaires.find(c => c.titre === 'Défausse offerte');

    expect(erreurDefausse).toBeDefined();
    expect(erreurDefausse?.joueurId).toBe(2);
  });

});
