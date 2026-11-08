import { Carte, Couleur, Valeur } from '../engine/types';

export interface Scenario {
  id: string;
  titre: string;
  description: string;
  varianteId: string;
  contratId?: string; // ID du contrat / de l'annonce associé(e)
  mains: Carte[][]; // 4 mains de cartes
  atoutInitial?: Couleur;
}

// Helper pour créer une carte rapidement
const c = (valeur: Valeur, couleur: Couleur): Carte => ({
  id: `${valeur}_${couleur}`,
  valeur,
  couleur
});

// Helper pour compléter les mains
function completerMains(mainsDefinies: Carte[][], avecJoker = false, nbCartesParJoueur = 13): Carte[][] {
  const toutesLesCartes: Carte[] = [];
  for (const couleur of Object.values(Couleur)) {
    for (let v = 2; v <= 14; v++) {
      toutesLesCartes.push(c(v as Valeur, couleur));
    }
  }
  if (avecJoker) {
    toutesLesCartes.push({ id: 'JOKER', valeur: 15 as Valeur, couleur: Couleur.PIQUE, estJoker: true });
  }

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
    while (m.length < nbCartesParJoueur && rIdx < cartesRestantes.length) {
      m.push(cartesRestantes[rIdx++]);
    }
  });

  return nouvellesMains;
}

export const SCENARIOS: Scenario[] = [
  // ══════════════════════════════════════════════
  //  WHIST DE GAND
  // ══════════════════════════════════════════════
  {
    id: 'gand-propose',
    titre: 'Je propose',
    description: 'Une main moyenne-forte avec un bel atout. Proposez une alliance pour réaliser 8 plis à deux.',
    varianteId: 'whist-gand',
    contratId: 'propose',
    mains: completerMains([
      [c(Valeur.AS, Couleur.COEUR), c(Valeur.ROI, Couleur.COEUR), c(Valeur.VALET, Couleur.COEUR), c(Valeur.DIX, Couleur.COEUR), c(Valeur.HUIT, Couleur.COEUR), c(Valeur.ROI, Couleur.PIQUE)],
      [c(Valeur.DAME, Couleur.COEUR), c(Valeur.AS, Couleur.PIQUE)],
      [], []
    ])
  },
  {
    id: 'gand-demande',
    titre: 'La Demande à l\'As',
    description: 'Vous avez une main forte en cœur et un As. Idéal pour demander un As partenaire secret.',
    varianteId: 'whist-gand',
    contratId: 'demande',
    mains: completerMains([
      [c(Valeur.AS, Couleur.COEUR), c(Valeur.ROI, Couleur.COEUR), c(Valeur.DAME, Couleur.COEUR), c(Valeur.VALET, Couleur.COEUR), c(Valeur.DIX, Couleur.COEUR), c(Valeur.AS, Couleur.PIQUE)],
      [c(Valeur.AS, Couleur.TREFLE)], // Partenaire secret au trèfle
      [], []
    ])
  },
  {
    id: 'gand-solo-6',
    titre: 'Le Solo (6 plis)',
    description: 'Une couleur très longue et maîtresse en Pique. Tentez d\'emporter 6 plis tout seul.',
    varianteId: 'whist-gand',
    contratId: 'solo_6',
    mains: completerMains([
      [c(Valeur.AS, Couleur.PIQUE), c(Valeur.ROI, Couleur.PIQUE), c(Valeur.DAME, Couleur.PIQUE), c(Valeur.VALET, Couleur.PIQUE), c(Valeur.DIX, Couleur.PIQUE), c(Valeur.NEUF, Couleur.PIQUE), c(Valeur.HUIT, Couleur.PIQUE)],
      [], [], []
    ])
  },
  {
    id: 'gand-solo-7',
    titre: 'Le Solo (7 plis)',
    description: '7 piques majeurs et des As de reprise latérale pour franchir la barre des 7 plis.',
    varianteId: 'whist-gand',
    contratId: 'solo_7',
    mains: completerMains([
      [c(Valeur.AS, Couleur.PIQUE), c(Valeur.ROI, Couleur.PIQUE), c(Valeur.DAME, Couleur.PIQUE), c(Valeur.VALET, Couleur.PIQUE), c(Valeur.DIX, Couleur.PIQUE), c(Valeur.NEUF, Couleur.PIQUE), c(Valeur.SEPT, Couleur.PIQUE), c(Valeur.AS, Couleur.COEUR), c(Valeur.AS, Couleur.CARREAU)],
      [], [], []
    ])
  },
  {
    id: 'gand-solo-8',
    titre: 'Le Solo (8 plis)',
    description: 'Une main puissante de 8 piques maîtres et deux As pour jouer solo contre les 3 autres.',
    varianteId: 'whist-gand',
    contratId: 'solo_8',
    mains: completerMains([
      [c(Valeur.AS, Couleur.PIQUE), c(Valeur.ROI, Couleur.PIQUE), c(Valeur.DAME, Couleur.PIQUE), c(Valeur.VALET, Couleur.PIQUE), c(Valeur.DIX, Couleur.PIQUE), c(Valeur.NEUF, Couleur.PIQUE), c(Valeur.HUIT, Couleur.PIQUE), c(Valeur.SEPT, Couleur.PIQUE), c(Valeur.AS, Couleur.COEUR), c(Valeur.AS, Couleur.TREFLE)],
      [], [], []
    ])
  },
  {
    id: 'gand-petite-misere',
    titre: 'La Petite Misère',
    description: '12 cartes en main après en avoir écarté une. Objectif : zéro pli sans aucun atout !',
    varianteId: 'whist-gand',
    contratId: 'petite_misere',
    mains: completerMains([
      [c(Valeur.DEUX, Couleur.COEUR), c(Valeur.TROIS, Couleur.COEUR), c(Valeur.QUATRE, Couleur.COEUR), c(Valeur.DEUX, Couleur.PIQUE), c(Valeur.TROIS, Couleur.PIQUE), c(Valeur.DEUX, Couleur.CARREAU), c(Valeur.TROIS, Couleur.CARREAU), c(Valeur.DEUX, Couleur.TREFLE), c(Valeur.TROIS, Couleur.TREFLE), c(Valeur.QUATRE, Couleur.TREFLE)],
      [c(Valeur.AS, Couleur.COEUR), c(Valeur.AS, Couleur.PIQUE), c(Valeur.AS, Couleur.CARREAU), c(Valeur.AS, Couleur.TREFLE)],
      [], []
    ])
  },
  {
    id: 'gand-abondance-9',
    titre: 'L\'Abondance (9 plis)',
    description: '9 plis seul. Nécessite une main maîtresse à Trèfle et des reprises d\'As.',
    varianteId: 'whist-gand',
    contratId: 'abondance_9',
    mains: completerMains([
      [c(Valeur.AS, Couleur.TREFLE), c(Valeur.ROI, Couleur.TREFLE), c(Valeur.DAME, Couleur.TREFLE), c(Valeur.VALET, Couleur.TREFLE), c(Valeur.DIX, Couleur.TREFLE), c(Valeur.NEUF, Couleur.TREFLE), c(Valeur.HUIT, Couleur.TREFLE), c(Valeur.AS, Couleur.COEUR), c(Valeur.AS, Couleur.PIQUE)],
      [], [], []
    ])
  },
  {
    id: 'gand-abondance-10',
    titre: 'L\'Abondance (10 plis)',
    description: '10 plis seul avec une très grande longueur et des As de reprise.',
    varianteId: 'whist-gand',
    contratId: 'abondance_10',
    mains: completerMains([
      [c(Valeur.AS, Couleur.TREFLE), c(Valeur.ROI, Couleur.TREFLE), c(Valeur.DAME, Couleur.TREFLE), c(Valeur.VALET, Couleur.TREFLE), c(Valeur.DIX, Couleur.TREFLE), c(Valeur.NEUF, Couleur.TREFLE), c(Valeur.HUIT, Couleur.TREFLE), c(Valeur.SEPT, Couleur.TREFLE), c(Valeur.AS, Couleur.COEUR), c(Valeur.AS, Couleur.PIQUE)],
      [], [], []
    ])
  },
  {
    id: 'gand-trou',
    titre: 'Le Trou (3 As & Bouche-Trou)',
    description: '3 As en main : le Trou est obligatoire au 1er tour. Le détenteur du 4ème As répond « Bouche-Trou » et s\'associe pour 9 plis.',
    varianteId: 'whist-gand',
    contratId: 'trou',
    mains: completerMains([
      [c(Valeur.AS, Couleur.COEUR), c(Valeur.AS, Couleur.PIQUE), c(Valeur.AS, Couleur.CARREAU)],
      [c(Valeur.AS, Couleur.TREFLE)], // Le partenaire au 4ème As
      [], []
    ])
  },
  {
    id: 'gand-trou-royal',
    titre: 'Le Trou Royal (4 As)',
    description: 'Posséder les 4 As est exceptionnel ! Obligatoire au 1er tour, l\'atout est Cœur et le partenaire est le détenteur du Roi de Cœur (9 plis à deux).',
    varianteId: 'whist-gand',
    contratId: 'trou_royal',
    mains: completerMains([
      [c(Valeur.AS, Couleur.COEUR), c(Valeur.AS, Couleur.PIQUE), c(Valeur.AS, Couleur.CARREAU), c(Valeur.AS, Couleur.TREFLE)],
      [], [],
      [c(Valeur.ROI, Couleur.COEUR)] // Partenaire (J3)
    ])
  },
  {
    id: 'gand-misere',
    titre: 'La Grande Misère',
    description: 'L\'objectif est de ne faire AUCUN pli. Évitez les As et les Rois !',
    varianteId: 'whist-gand',
    contratId: 'misere',
    mains: completerMains([
      [c(Valeur.DEUX, Couleur.COEUR), c(Valeur.TROIS, Couleur.COEUR), c(Valeur.DEUX, Couleur.PIQUE), c(Valeur.TROIS, Couleur.PIQUE), c(Valeur.DEUX, Couleur.CARREAU), c(Valeur.TROIS, Couleur.CARREAU), c(Valeur.DEUX, Couleur.TREFLE), c(Valeur.TROIS, Couleur.TREFLE)],
      [c(Valeur.AS, Couleur.COEUR), c(Valeur.AS, Couleur.PIQUE), c(Valeur.AS, Couleur.CARREAU), c(Valeur.AS, Couleur.TREFLE)],
      [], []
    ])
  },
  {
    id: 'gand-misere-ouverte',
    titre: 'Misère sur Table',
    description: 'Le défi ultime. Vous jouez cartes sur table dès le 2ème pli et ne faites aucun pli.',
    varianteId: 'whist-gand',
    contratId: 'misere_ouverte',
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
    id: 'gand-chelem',
    titre: 'Le Chelem (13 plis)',
    description: 'Faire les 13 plis seul. Vous contrôlez toutes les couleurs et imposez votre rythme.',
    varianteId: 'whist-gand',
    contratId: 'chelem',
    mains: completerMains([
      [c(Valeur.AS, Couleur.COEUR), c(Valeur.ROI, Couleur.COEUR), c(Valeur.DAME, Couleur.COEUR), c(Valeur.VALET, Couleur.COEUR), c(Valeur.DIX, Couleur.COEUR), c(Valeur.NEUF, Couleur.COEUR), c(Valeur.HUIT, Couleur.COEUR), c(Valeur.SEPT, Couleur.COEUR), c(Valeur.SIX, Couleur.COEUR), c(Valeur.AS, Couleur.PIQUE), c(Valeur.AS, Couleur.CARREAU), c(Valeur.AS, Couleur.TREFLE), c(Valeur.ROI, Couleur.PIQUE)],
      [], [], []
    ])
  },

  // ══════════════════════════════════════════════
  //  SOLO WHIST
  // ══════════════════════════════════════════════
  {
    id: 'solo-proposal',
    titre: 'Proposal & Acceptance',
    description: 'S\'associer avec un partenaire pour totaliser 8 plis ensemble.',
    varianteId: 'solo-whist',
    contratId: 'proposal',
    mains: completerMains([
      [c(Valeur.AS, Couleur.PIQUE), c(Valeur.ROI, Couleur.PIQUE), c(Valeur.DAME, Couleur.PIQUE), c(Valeur.AS, Couleur.COEUR)],
      [c(Valeur.AS, Couleur.TREFLE), c(Valeur.ROI, Couleur.COEUR)],
      [], []
    ])
  },
  {
    id: 'solo-solo',
    titre: 'Solo (5 plis)',
    description: 'Réaliser 5 plis seul contre les trois autres joueurs.',
    varianteId: 'solo-whist',
    contratId: 'solo',
    mains: completerMains([
      [c(Valeur.AS, Couleur.PIQUE), c(Valeur.ROI, Couleur.PIQUE), c(Valeur.DAME, Couleur.PIQUE), c(Valeur.VALET, Couleur.PIQUE), c(Valeur.AS, Couleur.COEUR)],
      [], [], []
    ])
  },
  {
    id: 'solo-misere',
    titre: 'Solo Misère',
    description: 'Zéro pli sans atout avec une main composée de très petites cartes.',
    varianteId: 'solo-whist',
    contratId: 'misere',
    mains: completerMains([
      [c(Valeur.DEUX, Couleur.COEUR), c(Valeur.TROIS, Couleur.COEUR), c(Valeur.DEUX, Couleur.PIQUE), c(Valeur.TROIS, Couleur.PIQUE), c(Valeur.DEUX, Couleur.CARREAU), c(Valeur.DEUX, Couleur.TREFLE)],
      [c(Valeur.AS, Couleur.COEUR), c(Valeur.AS, Couleur.PIQUE)],
      [], []
    ])
  },
  {
    id: 'solo-abondance',
    titre: 'Abondance Solo',
    description: '9 plis seul dans votre meilleure couleur.',
    varianteId: 'solo-whist',
    contratId: 'abondance',
    mains: completerMains([
      [c(Valeur.AS, Couleur.TREFLE), c(Valeur.ROI, Couleur.TREFLE), c(Valeur.DAME, Couleur.TREFLE), c(Valeur.VALET, Couleur.TREFLE), c(Valeur.DIX, Couleur.TREFLE), c(Valeur.NEUF, Couleur.TREFLE), c(Valeur.AS, Couleur.COEUR), c(Valeur.AS, Couleur.PIQUE)],
      [], [], []
    ])
  },
  {
    id: 'solo-misere-ouverte',
    titre: 'Misère Ouverte',
    description: 'Jouer les cartes visibles et éviter de remporter le moindre pli.',
    varianteId: 'solo-whist',
    contratId: 'misere_ouverte',
    mains: completerMains([
      [c(Valeur.DEUX, Couleur.COEUR), c(Valeur.TROIS, Couleur.COEUR), c(Valeur.DEUX, Couleur.PIQUE), c(Valeur.TROIS, Couleur.PIQUE), c(Valeur.DEUX, Couleur.CARREAU), c(Valeur.TROIS, Couleur.CARREAU), c(Valeur.DEUX, Couleur.TREFLE)],
      [], [], []
    ])
  },
  {
    id: 'solo-abondance-declaree',
    titre: 'Abondance Déclarée (13 plis)',
    description: 'Faire les 13 plis avec l\'atout imposé.',
    varianteId: 'solo-whist',
    contratId: 'abondance_declaree',
    mains: completerMains([
      [c(Valeur.AS, Couleur.COEUR), c(Valeur.ROI, Couleur.COEUR), c(Valeur.DAME, Couleur.COEUR), c(Valeur.VALET, Couleur.COEUR), c(Valeur.DIX, Couleur.COEUR), c(Valeur.NEUF, Couleur.COEUR), c(Valeur.HUIT, Couleur.COEUR), c(Valeur.AS, Couleur.PIQUE), c(Valeur.AS, Couleur.CARREAU), c(Valeur.AS, Couleur.TREFLE)],
      [], [], []
    ])
  },

  // ══════════════════════════════════════════════
  //  BOSTON WHIST
  // ══════════════════════════════════════════════
  {
    id: 'boston-5',
    titre: 'Boston (5 plis)',
    description: 'Réaliser exactement 5 plis en jeu individuel.',
    varianteId: 'boston-whist',
    contratId: 'boston',
    mains: completerMains([
      [c(Valeur.AS, Couleur.PIQUE), c(Valeur.ROI, Couleur.PIQUE), c(Valeur.DAME, Couleur.PIQUE), c(Valeur.AS, Couleur.COEUR), c(Valeur.AS, Couleur.CARREAU)],
      [], [], []
    ])
  },
  {
    id: 'boston-piccolo',
    titre: 'Piccolo (1 pli)',
    description: 'Faire EXACTEMENT 1 pli. Le piège est d\'en faire un deuxième !',
    varianteId: 'boston-whist',
    contratId: 'piccolo',
    mains: completerMains([
      [c(Valeur.AS, Couleur.PIQUE), c(Valeur.DEUX, Couleur.COEUR), c(Valeur.TROIS, Couleur.COEUR), c(Valeur.DEUX, Couleur.CARREAU), c(Valeur.TROIS, Couleur.CARREAU), c(Valeur.DEUX, Couleur.TREFLE)],
      [], [], []
    ])
  },
  {
    id: 'boston-misere',
    titre: 'Boston Misère',
    description: 'Ne faire aucun pli dans ce mode individuel chacun pour soi.',
    varianteId: 'boston-whist',
    contratId: 'misere',
    mains: completerMains([
      [c(Valeur.DEUX, Couleur.COEUR), c(Valeur.TROIS, Couleur.COEUR), c(Valeur.DEUX, Couleur.PIQUE), c(Valeur.TROIS, Couleur.PIQUE), c(Valeur.DEUX, Couleur.CARREAU), c(Valeur.DEUX, Couleur.TREFLE)],
      [], [], []
    ])
  },
  {
    id: 'boston-sur',
    titre: 'Boston Sur (6+ plis)',
    description: 'Surenchérir pour faire au moins 6 plis face à des adversaires coriaces.',
    varianteId: 'boston-whist',
    contratId: 'boston_sur',
    mains: completerMains([
      [c(Valeur.AS, Couleur.PIQUE), c(Valeur.ROI, Couleur.PIQUE), c(Valeur.DAME, Couleur.PIQUE), c(Valeur.VALET, Couleur.PIQUE), c(Valeur.AS, Couleur.COEUR), c(Valeur.AS, Couleur.CARREAU)],
      [], [], []
    ])
  },
  {
    id: 'boston-chelem',
    titre: 'Boston Chelem',
    description: 'Remporter l\'intégralité des 13 plis contre vos 3 rivaux.',
    varianteId: 'boston-whist',
    contratId: 'chelem',
    mains: completerMains([
      [c(Valeur.AS, Couleur.COEUR), c(Valeur.ROI, Couleur.COEUR), c(Valeur.DAME, Couleur.COEUR), c(Valeur.VALET, Couleur.COEUR), c(Valeur.DIX, Couleur.COEUR), c(Valeur.NEUF, Couleur.COEUR), c(Valeur.AS, Couleur.PIQUE), c(Valeur.AS, Couleur.CARREAU), c(Valeur.AS, Couleur.TREFLE)],
      [], [], []
    ])
  },

  // ══════════════════════════════════════════════
  //  BID WHIST
  // ══════════════════════════════════════════════
  {
    id: 'bid-3-montant',
    titre: '3 Montant (Ordre Normal)',
    description: 'Annoncez 3 (9 plis à faire avec le Kitty) dans l\'ordre hiérarchique habituel.',
    varianteId: 'bid-whist',
    contratId: 'bid_3_montant',
    mains: completerMains([
      [c(Valeur.AS, Couleur.PIQUE), c(Valeur.ROI, Couleur.PIQUE), c(Valeur.DAME, Couleur.PIQUE), c(Valeur.AS, Couleur.COEUR)],
      [], [], []
    ], false, 12)
  },
  {
    id: 'bid-3-descendant',
    titre: '3 Descendant (Ordre Inversé)',
    description: 'Mode Inversé : Le 2 bat l\'As et devient la carte la plus forte !',
    varianteId: 'bid-whist',
    contratId: 'bid_3_descendant',
    mains: completerMains([
      [c(Valeur.DEUX, Couleur.PIQUE), c(Valeur.TROIS, Couleur.PIQUE), c(Valeur.QUATRE, Couleur.PIQUE), c(Valeur.DEUX, Couleur.COEUR)],
      [], [], []
    ], false, 12)
  },
  {
    id: 'bid-3-sans',
    titre: '3 Sans-Atout',
    description: 'Viser 9 plis sans aucune couleur d\'atout (points doublés).',
    varianteId: 'bid-whist',
    contratId: 'bid_3_sans',
    mains: completerMains([
      [c(Valeur.AS, Couleur.PIQUE), c(Valeur.ROI, Couleur.PIQUE), c(Valeur.AS, Couleur.COEUR), c(Valeur.ROI, Couleur.COEUR), c(Valeur.AS, Couleur.CARREAU)],
      [], [], []
    ], false, 12)
  },
  {
    id: 'bid-joker',
    titre: 'Le Joker d\'Atout',
    description: 'Apprenez à utiliser le Joker, la carte suprême du Bid Whist.',
    varianteId: 'bid-whist',
    mains: completerMains([
      [{ id: 'JOKER', valeur: 15 as Valeur, couleur: Couleur.PIQUE, estJoker: true }, c(Valeur.AS, Couleur.PIQUE), c(Valeur.ROI, Couleur.PIQUE)],
      [], [], []
    ], true, 12)
  },

  // ══════════════════════════════════════════════
  //  WHIST CLASSIQUE
  // ══════════════════════════════════════════════
  {
    id: 'classique-atout',
    titre: 'Whist Classique',
    description: 'Entraînez-vous au jeu original avec atout retourné et partenaire fixe.',
    varianteId: 'whist-classique',
    contratId: 'classique',
    mains: completerMains([
      [c(Valeur.AS, Couleur.PIQUE), c(Valeur.ROI, Couleur.PIQUE), c(Valeur.DAME, Couleur.PIQUE), c(Valeur.AS, Couleur.COEUR)],
      [], [], []
    ]),
    atoutInitial: Couleur.PIQUE
  }
];
