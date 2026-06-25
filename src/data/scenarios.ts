import { Carte, Couleur, Valeur } from '../engine/types';

export interface Scenario {
  id: string;
  titre: string;
  description: string;
  varianteId: string;
  mains: Carte[][]; // 4 mains de 13 cartes
  atoutInitial?: Couleur;
}

// Helper pour créer une carte rapidement
const c = (valeur: Valeur, couleur: Couleur): Carte => ({
  id: `${valeur}_${couleur}`,
  valeur,
  couleur
});

// Helper pour compléter une main avec des cartes restantes du paquet
function completerMains(mainsDefinies: Carte[][], avecJoker = false): Carte[][] {
  const toutesLesCartes: Carte[] = [];
  for (const couleur of Object.values(Couleur)) {
    for (let v = 2; v <= 14; v++) {
      toutesLesCartes.push(c(v as Valeur, couleur));
    }
  }
  if (avecJoker) toutesLesCartes.push({ id: 'JOKER', valeur: 15 as Valeur, couleur: Couleur.PIQUE, estJoker: true });

  const cartesUtilisees = new Set(mainsDefinies.flat().map(k => k.id));
  const cartesRestantes = toutesLesCartes.filter(k => !cartesUtilisees.has(k.id));

  // Mélanger les restes pour boucher les trous
  for (let i = cartesRestantes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cartesRestantes[i], cartesRestantes[j]] = [cartesRestantes[j], cartesRestantes[i]];
  }

  const nouvellesMains = mainsDefinies.map(m => [...m]);
  let rIdx = 0;
  nouvellesMains.forEach(m => {
    while (m.length < 13 && rIdx < cartesRestantes.length) {
      m.push(cartesRestantes[rIdx++]);
    }
  });

  return nouvellesMains;
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'gand-demande',
    titre: 'La Demande',
    description: 'Vous avez une main forte en cœur et un As. Idéal pour proposer une Demande.',
    varianteId: 'whist-gand',
    mains: completerMains([
      [c(Valeur.AS, Couleur.COEUR), c(Valeur.ROI, Couleur.COEUR), c(Valeur.DAME, Couleur.COEUR), c(Valeur.VALET, Couleur.COEUR), c(Valeur.DIX, Couleur.COEUR), c(Valeur.AS, Couleur.PIQUE)],
      [c(Valeur.AS, Couleur.TREFLE)], // Partenaire potentiel
      [], []
    ])
  },
  {
    id: 'gand-trou',
    titre: 'Le Trou (3 As)',
    description: '3 As en main : le Trou est obligatoire. L\'atout sera la couleur du 4ème As.',
    varianteId: 'whist-gand',
    mains: completerMains([
      [c(Valeur.AS, Couleur.COEUR), c(Valeur.AS, Couleur.PIQUE), c(Valeur.AS, Couleur.CARREAU)],
      [c(Valeur.AS, Couleur.TREFLE)], // Le partenaire au 4ème As
      [], []
    ])
  },
  {
    id: 'gand-trou-royal',
    titre: 'Le Trou Royal (4 As)',
    description: 'Posséder les 4 As est rare ! Annoncez le Trou Royal, le partenaire a le Roi de Cœur.',
    varianteId: 'whist-gand',
    mains: completerMains([
      [c(Valeur.AS, Couleur.COEUR), c(Valeur.AS, Couleur.PIQUE), c(Valeur.AS, Couleur.CARREAU), c(Valeur.AS, Couleur.TREFLE)],
      [], [],
      [c(Valeur.ROI, Couleur.COEUR)] // Partenaire (J3)
    ])
  },
  {
    id: 'gand-solo',
    titre: 'Le Solo (6 plis)',
    description: 'Une couleur très longue et forte. Tentez de faire 6 plis tout seul contre les 3 autres.',
    varianteId: 'whist-gand',
    mains: completerMains([
      [c(Valeur.AS, Couleur.PIQUE), c(Valeur.ROI, Couleur.PIQUE), c(Valeur.DAME, Couleur.PIQUE), c(Valeur.VALET, Couleur.PIQUE), c(Valeur.DIX, Couleur.PIQUE), c(Valeur.NEUF, Couleur.PIQUE), c(Valeur.HUIT, Couleur.PIQUE)],
      [], [], []
    ])
  },
  {
    id: 'gand-abondance',
    titre: 'L\'Abondance (9 plis)',
    description: '9 plis seul. Nécessite une main quasi-parfaite dans votre couleur d\'atout.',
    varianteId: 'whist-gand',
    mains: completerMains([
      [c(Valeur.AS, Couleur.TREFLE), c(Valeur.ROI, Couleur.TREFLE), c(Valeur.DAME, Couleur.TREFLE), c(Valeur.VALET, Couleur.TREFLE), c(Valeur.DIX, Couleur.TREFLE), c(Valeur.NEUF, Couleur.TREFLE), c(Valeur.HUIT, Couleur.TREFLE), c(Valeur.AS, Couleur.COEUR), c(Valeur.AS, Couleur.PIQUE)],
      [], [], []
    ])
  },
  {
    id: 'gand-misere',
    titre: 'La Misère',
    description: 'L\'objectif est de ne faire AUCUN pli. Évitez les As et les Rois !',
    varianteId: 'whist-gand',
    mains: completerMains([
      [c(Valeur.DEUX, Couleur.COEUR), c(Valeur.TROIS, Couleur.COEUR), c(Valeur.DEUX, Couleur.PIQUE), c(Valeur.TROIS, Couleur.PIQUE), c(Valeur.DEUX, Couleur.CARREAU), c(Valeur.TROIS, Couleur.CARREAU), c(Valeur.DEUX, Couleur.TREFLE), c(Valeur.TROIS, Couleur.TREFLE)],
      [c(Valeur.AS, Couleur.COEUR), c(Valeur.AS, Couleur.PIQUE), c(Valeur.AS, Couleur.CARREAU), c(Valeur.AS, Couleur.TREFLE)], // Les adversaires ont les As
      [], []
    ])
  },
  {
    id: 'gand-misere-ouverte',
    titre: 'Expert : Misère Ouverte',
    description: 'Le défi ultime. Vous jouez cartes sur table et ne faites aucun pli.',
    varianteId: 'whist-gand',
    mains: completerMains([
      [
        c(Valeur.DEUX, Couleur.TREFLE), c(Valeur.TROIS, Couleur.TREFLE), c(Valeur.QUATRE, Couleur.TREFLE), c(Valeur.CINQ, Couleur.TREFLE),
        c(Valeur.DEUX, Couleur.COEUR), c(Valeur.TROIS, Couleur.COEUR), c(Valeur.QUATRE, Couleur.COEUR),
        c(Valeur.DEUX, Couleur.PIQUE), c(Valeur.TROIS, Couleur.PIQUE), c(Valeur.QUATRE, Couleur.PIQUE),
        c(Valeur.DEUX, Couleur.CARREAU), c(Valeur.TROIS, Couleur.CARREAU), c(Valeur.QUATRE, Couleur.CARREAU)
      ],
      [c(Valeur.AS, Couleur.TREFLE), c(Valeur.AS, Couleur.PIQUE), c(Valeur.AS, Couleur.COEUR), c(Valeur.AS, Couleur.CARREAU)],
      [], []
    ])
  },
  {
    id: 'gand-abondance-declaree',
    titre: 'Abondance Déclarée',
    description: 'Faire les 13 plis seul. Vous annoncez l\'atout et vous devez tout rafler.',
    varianteId: 'whist-gand',
    mains: completerMains([
      [c(Valeur.AS, Couleur.COEUR), c(Valeur.ROI, Couleur.COEUR), c(Valeur.DAME, Couleur.COEUR), c(Valeur.VALET, Couleur.COEUR), c(Valeur.DIX, Couleur.COEUR), c(Valeur.NEUF, Couleur.COEUR), c(Valeur.HUIT, Couleur.COEUR), c(Valeur.SEPT, Couleur.COEUR), c(Valeur.SIX, Couleur.COEUR), c(Valeur.AS, Couleur.PIQUE), c(Valeur.AS, Couleur.CARREAU), c(Valeur.AS, Couleur.TREFLE), c(Valeur.ROI, Couleur.PIQUE)],
      [], [], []
    ])
  },
  {
    id: 'bid-whist-joker',
    titre: 'Bid Whist : Le Joker',
    description: 'Apprenez à utiliser le Joker, la carte la plus forte, dans cette variante américaine.',
    varianteId: 'bid-whist',
    mains: completerMains([
      [{ id: 'JOKER', valeur: 15 as Valeur, couleur: Couleur.PIQUE, estJoker: true }, c(Valeur.AS, Couleur.PIQUE), c(Valeur.ROI, Couleur.PIQUE)],
      [], [], []
    ], true)
  },
  {
    id: 'classique-atout',
    titre: 'Whist Classique',
    description: 'Entraînez-vous au jeu de base avec atout retourné et partenaire fixe.',
    varianteId: 'whist-classique',
    mains: completerMains([
      [c(Valeur.AS, Couleur.PIQUE), c(Valeur.ROI, Couleur.PIQUE), c(Valeur.DAME, Couleur.PIQUE), c(Valeur.AS, Couleur.COEUR)],
      [], [], []
    ]),
    atoutInitial: Couleur.PIQUE
  }
];
