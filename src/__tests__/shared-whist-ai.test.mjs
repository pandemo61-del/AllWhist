import assert from 'node:assert/strict';
import test from 'node:test';
import { chooseMisereDiscard, chooseWhistBid, chooseWhistCard, WHIST_AI_VERSION } from '../../shared/whist-ai.js';
import { getWhistContractName } from '../../shared/whist-contracts.js';

const card = (value, suit) => ({
  id: `${value}_${suit}`,
  valeur: value,
  couleur: suit,
});

const contracts = [
  ['propose', 1, 8, false],
  ['emballe', 1.5, 8, false],
  ['solo_6', 2, 6, true],
  ['solo_7', 3, 7, true],
  ['petite_misere', 4, 0, true],
  ['solo_8', 5, 8, true],
  ['abondance_9', 6, 9, true],
  ['trou', 7, 9, false],
  ['trou_royal', 7.5, 9, false],
  ['abondance_10', 8, 10, true],
  ['misere', 9, 0, true],
  ['abondance_11', 10, 11, true],
  ['abondance_12', 10.5, 12, true],
  ['misere_ouverte', 11, 0, true],
  ['chelem', 12, 13, true],
].map(([id, priorite, obj, seul]) => ({
  id,
  priorite,
  plisMin: obj,
  seul,
  sanAtout: id.includes('misere'),
  disponibleSi: hand => id === 'trou'
    ? hand.filter(candidate => candidate.valeur === 14).length === 3
    : id === 'trou_royal'
      ? hand.filter(candidate => candidate.valeur === 14).length === 4
      : true,
}));

test('versionne les nouvelles décisions partagées', () => {
  assert.equal(WHIST_AI_VERSION, '1.3.4');
});

test('affiche le libellé des anciens contrats sans nom enregistré', () => {
  assert.equal(getWhistContractName({ id: 'trou' }), 'Trou');
  assert.equal(getWhistContractName({ id: 'trou_royal', nom: 'Nom personnalisé' }), 'Nom personnalisé');
  assert.equal(getWhistContractName({ id: 'contrat_inconnu' }), 'contrat_inconnu');
  assert.equal(getWhistContractName({ id: 'toString' }), 'toString');
});

test('annonce le Trou avec la couleur de l’As appelé', () => {
  const hand = [
    card(14, 'COEUR'), card(14, 'CARREAU'), card(14, 'TREFLE'),
    card(13, 'PIQUE'), card(12, 'PIQUE'), card(11, 'PIQUE'),
    card(10, 'PIQUE'), card(9, 'PIQUE'), card(8, 'COEUR'),
    card(7, 'CARREAU'), card(6, 'TREFLE'), card(5, 'COEUR'), card(4, 'CARREAU'),
  ];

  const bid = chooseWhistBid(hand, null, 'expert', 0, contracts);
  assert.equal(bid.contratId, 'trou');
  assert.equal(bid.atout, 'PIQUE');
  assert.equal(bid.asPartenaire, '14_PIQUE');
});

test('l’annonceur du Trou entame dans la couleur appelée pour établir le partenaire', () => {
  const hand = [card(14, 'COEUR'), card(13, 'TREFLE'), card(2, 'PIQUE')];
  const chosen = chooseWhistCard(
    hand,
    0,
    { numero: 1, cartesJouees: [] },
    'PIQUE',
    { id: 'trou', joueurId: 0, atout: 'PIQUE', asPartenaire: '14_PIQUE' },
  );
  assert.equal(chosen.couleur, 'PIQUE');
});

test('le partenaire du Trou joue l’As appelé pour protéger le pli des adversaires suivants', () => {
  const hand = [card(14, 'PIQUE'), card(2, 'PIQUE')];
  const trick = {
    numero: 1,
    couleurDemandee: 'PIQUE',
    cartesJouees: [{ joueurId: 0, carte: card(10, 'PIQUE') }],
  };
  const chosen = chooseWhistCard(
    hand,
    1,
    trick,
    'PIQUE',
    { id: 'trou', joueurId: 0, atout: 'PIQUE', asPartenaire: '14_PIQUE' },
  );
  assert.equal(chosen.valeur, 14);
});

test('ne surenchérit pas sur un contrat de priorité supérieure', () => {
  const hand = Array.from({ length: 13 }, (_, index) => card(index + 2, 'COEUR'));
  const bid = chooseWhistBid(hand, { id: 'chelem', priorite: 12 }, 'expert', 0, contracts);
  assert.deepEqual(bid, { action: 'passe' });
});

test('reconnaît une couleur d’atout maîtresse avant un Chelem', () => {
  const hand = Array.from({ length: 13 }, (_, index) => card(index + 2, 'COEUR'));
  const bid = chooseWhistBid(hand, null, 'expert', 0, contracts);
  assert.equal(bid.contratId, 'chelem');
  assert.equal(bid.atout, 'COEUR');
});

test('emballe une proposition avec une couleur suffisamment longue', () => {
  const hand = [
    ...[2, 3, 4, 13, 14].map(value => card(value, 'PIQUE')),
    card(13, 'COEUR'),
    card(13, 'CARREAU'),
    ...[2, 3, 4, 5, 6, 7].map((value, index) => card(value, ['COEUR', 'CARREAU', 'TREFLE'][index % 3])),
  ];
  const bid = chooseWhistBid(
    hand,
    { id: 'propose', joueurId: 1, priorite: 1, atout: 'PIQUE' },
    'expert',
    2,
    contracts,
  );
  assert.equal(bid.contratId, 'emballe');
  assert.equal(bid.atout, 'PIQUE');
});

test('ne s’engage pas dans Emballe avec cinq atouts et un seul honneur', () => {
  const hand = [
    ...[2, 3, 4, 5, 13].map(value => card(value, 'PIQUE')),
    ...[2, 3, 4, 5, 6, 7, 8, 9].map((value, index) => card(value, ['COEUR', 'CARREAU', 'TREFLE'][index % 3])),
  ];
  const bid = chooseWhistBid(
    hand,
    { id: 'propose', joueurId: 1, priorite: 1, atout: 'PIQUE' },
    'expert',
    2,
    contracts.filter(candidate => ['propose', 'emballe'].includes(candidate.id)),
  );
  assert.deepEqual(bid, { action: 'passe' });
});

test('écarte la carte la plus dangereuse pour une Petite Misère', () => {
  const hand = [card(14, 'COEUR'), card(13, 'PIQUE'), card(12, 'TREFLE'), card(2, 'CARREAU')];
  assert.equal(chooseMisereDiscard(hand).valeur, 14);
});

test('suit la couleur demandée même si une carte plus forte est disponible ailleurs', () => {
  const hand = [card(3, 'COEUR'), card(14, 'PIQUE')];
  const trick = {
    numero: 1,
    couleurDemandee: 'COEUR',
    cartesJouees: [{ joueurId: 1, carte: card(5, 'COEUR') }],
  };
  assert.equal(chooseWhistCard(hand, 0, trick, 'PIQUE', { id: 'solo_6', joueurId: 2, seul: true }).couleur, 'COEUR');
});

test('défausse au plus bas quand le partenaire gagne déjà le pli', () => {
  const hand = [card(2, 'COEUR'), card(14, 'COEUR')];
  const trick = {
    numero: 1,
    couleurDemandee: 'COEUR',
    cartesJouees: [{ joueurId: 1, carte: card(13, 'COEUR') }],
  };
  const chosen = chooseWhistCard(
    hand,
    0,
    trick,
    null,
    { id: 'emballe', joueurId: 0, partenaireId: 1, seul: false },
  );
  assert.equal(chosen.valeur, 2);
});

test('ne prend pas une carte hors couleur parce qu’elle bat une défausse adverse', () => {
  const hand = [card(14, 'TREFLE'), card(2, 'PIQUE')];
  const trick = {
    numero: 1,
    couleurDemandee: 'COEUR',
    cartesJouees: [
      { joueurId: 0, carte: card(2, 'COEUR') },
      { joueurId: 1, carte: card(3, 'TREFLE') },
      { joueurId: 2, carte: card(4, 'TREFLE') },
    ],
  };
  const chosen = chooseWhistCard(
    hand,
    3,
    trick,
    null,
    { id: 'emballe', joueurId: 0, partenaireId: 3, seul: false },
  );
  assert.equal(chosen.couleur, 'PIQUE');
});

test('le soliste en Misère conserve une carte sûre au lieu de prendre', () => {
  const hand = [card(2, 'COEUR'), card(3, 'COEUR'), card(12, 'COEUR')];
  const trick = {
    numero: 1,
    couleurDemandee: 'COEUR',
    cartesJouees: [{ joueurId: 0, carte: card(5, 'COEUR') }],
  };
  const chosen = chooseWhistCard(hand, 1, trick, null, { id: 'misere', joueurId: 1, seul: true });
  assert.equal(chosen.valeur, 3);
});

test('le soliste en Misère défausse sa plus forte carte sûre', () => {
  const hand = [card(2, 'COEUR'), card(10, 'COEUR')];
  const trick = {
    numero: 1,
    couleurDemandee: 'COEUR',
    cartesJouees: [{ joueurId: 0, carte: card(13, 'COEUR') }],
  };
  const chosen = chooseWhistCard(hand, 1, trick, null, { id: 'misere', joueurId: 1, seul: true });
  assert.equal(chosen.valeur, 10);
});

test('la défense surcoupe le soliste pour lui faire gagner le moins de plis possible', () => {
  const hand = [card(11, 'COEUR'), card(4, 'PIQUE')];
  const trick = {
    numero: 1,
    couleurDemandee: 'COEUR',
    cartesJouees: [
      { joueurId: 0, carte: card(2, 'COEUR') },
      { joueurId: 1, carte: card(10, 'COEUR') },
    ],
  };
  const chosen = chooseWhistCard(hand, 2, trick, null, { id: 'misere', joueurId: 1, seul: true });
  assert.equal(chosen.valeur, 11);
});

test('la défense évite en entame une couleur dont le soliste a montré la chicane', () => {
  const hand = [card(14, 'COEUR'), card(13, 'PIQUE'), card(11, 'TREFLE')];
  const previousTrick = {
    numero: 1,
    couleurDemandee: 'COEUR',
    cartesJouees: [
      { joueurId: 0, carte: card(10, 'COEUR') },
      { joueurId: 1, carte: card(2, 'CARREAU') },
      { joueurId: 2, carte: card(12, 'COEUR') },
      { joueurId: 3, carte: card(9, 'COEUR') },
    ],
  };
  const chosen = chooseWhistCard(
    hand,
    2,
    { numero: 2, cartesJouees: [] },
    null,
    { id: 'misere', joueurId: 1, seul: true },
    [],
    [previousTrick],
  );
  assert.notEqual(chosen.couleur, 'COEUR');
});
