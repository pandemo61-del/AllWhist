import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { chooseMisereDiscard, chooseWhistCard } from '../../shared/whist-ai.js';

const report = JSON.parse(
  readFileSync(new URL('../../web/allwhist-echecs-2026-10-13.json', import.meta.url), 'utf8'),
);

function beats(challenger, current, ledSuit, trump) {
  if (challenger.estJoker) return true;
  if (current.estJoker) return false;
  const challengerTrump = trump && challenger.couleur === trump;
  const currentTrump = trump && current.couleur === trump;
  if (challengerTrump !== currentTrump) return challengerTrump;
  if (challengerTrump) return challenger.valeur > current.valeur;
  if (challenger.couleur !== ledSuit) return false;
  if (current.couleur !== ledSuit) return true;
  return challenger.valeur > current.valeur;
}

function findPartner(contract, hands, game) {
  if (Number.isInteger(contract.partenaireId)) return contract.partenaireId;
  if (contract.id === 'emballe') {
    const proposal = game.historiqueEncheres?.find(entry =>
      entry.contrat?.id === 'propose' || entry.contrat?.contratId === 'propose'
    );
    if (Number.isInteger(proposal?.joueurId)) return proposal.joueurId;
  }
  const called = contract.asPartenaire;
  if (!called) return undefined;
  const match = typeof called === 'object'
    ? [called.valeur, called.couleur]
    : String(called).match(/^(\d+)[_-](COEUR|CARREAU|TREFLE|PIQUE)$/)?.slice(1);
  if (!match) return undefined;
  const [value, suit] = match;
  const partnerId = hands.findIndex((hand, playerId) =>
    playerId !== contract.joueurId &&
    hand.some(card => card.valeur === Number(value) && card.couleur === suit)
  );
  return partnerId < 0 ? undefined : partnerId;
}

function replayFailedDeal(game) {
  const contract = { ...game.contrat };
  contract.id ??= contract.contratId;
  contract.joueurId = Number(contract.joueurId);
  contract.atout ??= game.atout ?? null;
  contract.sanAtout = contract.sanAtout === true || contract.sa === true;
  const hands = [...game.donne]
    .sort((a, b) => a.joueurId - b.joueurId)
    .map(player => player.mainInitiale.map(card => ({
      ...card,
      id: card.id.replace('-', '_'),
    })));
  if (hands.length !== 4 || hands.some(hand => !hand.length)) {
    throw new Error(`Donne exacte incomplète pour le contrat ${contract.id}.`);
  }

  if (contract.id === 'petite_misere') {
    for (const hand of hands) {
      const discarded = chooseMisereDiscard(hand);
      if (discarded) hand.splice(hand.findIndex(card => card.id === discarded.id), 1);
    }
  }
  contract.partenaireId = findPartner(contract, hands, game);

  let leaderId = game.plis?.[0]?.cartesJouees?.[0]?.joueurId ?? 0;
  const trickCount = Math.min(...hands.map(hand => hand.length));
  const completedTricks = [];
  const wonTricks = [0, 0, 0, 0];

  for (let index = 0; index < trickCount; index++) {
    const trick = { numero: index + 1, cartesJouees: [] };
    for (let offset = 0; offset < 4; offset++) {
      const playerId = (leaderId + offset) % 4;
      const hand = hands[playerId];
      const card = chooseWhistCard(
        hand,
        playerId,
        trick,
        contract.atout,
        contract,
        completedTricks.flatMap(done => done.cartesJouees.map(play => play.carte)),
        completedTricks,
      );
      assert.ok(card && hand.some(held => held.id === card.id), 'AI must select a card in its hand');
      hand.splice(hand.findIndex(held => held.id === card.id), 1);
      trick.couleurDemandee ??= card.couleur;
      trick.cartesJouees.push({ joueurId: playerId, carte: card });
    }

    let winner = trick.cartesJouees[0];
    const trump = contract.sanAtout || contract.id.includes('misere') ? null : contract.atout;
    for (const play of trick.cartesJouees.slice(1)) {
      if (beats(play.carte, winner.carte, trick.couleurDemandee, trump)) winner = play;
    }
    trick.gagnantId = winner.joueurId;
    wonTricks[winner.joueurId]++;
    completedTricks.push(trick);
    leaderId = winner.joueurId;
  }

  const soloTricks = wonTricks[contract.joueurId] ?? 0;
  const teamTricks = soloTricks +
    (!contract.seul && Number.isInteger(contract.partenaireId)
      ? wonTricks[contract.partenaireId]
      : 0);
  return {
    contractId: contract.id,
    success: contract.id.includes('misere')
      ? soloTricks === 0
      : teamTricks >= Number(contract.plisObjectif ?? contract.obj ?? 8),
    teamTricks,
  };
}

test('rejoue les mains exactes sans mélanger les données versionnées et historiques', () => {
  assert.equal(report.mainsExactes, report.games.length);
  const sources = new Map();
  const outcomes = new Map();

  for (const game of report.games) {
    const sourceKey = `${game.sourcePlatform ?? 'legacy'}@${game.aiVersion ?? 'unversioned'}`;
    sources.set(sourceKey, (sources.get(sourceKey) ?? 0) + 1);
    const result = replayFailedDeal(game);
    const outcome = outcomes.get(result.contractId) ?? { deals: 0, successes: 0 };
    outcome.deals++;
    outcome.successes += Number(result.success);
    outcomes.set(result.contractId, outcome);
  }

  assert.equal(sources.get('web-lab@1.0.0'), 108);
  assert.equal(sources.get('legacy@unversioned'), 59);
  assert.deepEqual(outcomes.get('trou'), { deals: 81, successes: 12 });
  assert.deepEqual(outcomes.get('trou_royal'), { deals: 8, successes: 2 });
  assert.deepEqual(outcomes.get('petite_misere'), { deals: 29, successes: 24 });
  assert.deepEqual(outcomes.get('misere'), { deals: 10, successes: 9 });
  assert.deepEqual(outcomes.get('emballe'), { deals: 26, successes: 6 });
});
