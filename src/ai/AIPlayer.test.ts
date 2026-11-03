import { describe, expect, it } from "vitest";
import type {
  Card,
  ObservedTrick,
  WhistObservation,
} from "./AIPlayer";

describe("WhistObservation", () => {
  const trick: ObservedTrick = {
    leader: 1,
    plays: [
      {
        player: 1,
        card: { suit: "clubs", rank: "A" },
      },
      {
        player: 2,
        card: { suit: "clubs", rank: "K" },
      },
      {
        player: 3,
        card: { suit: "clubs", rank: "Q" },
      },
      {
        player: 0,
        card: { suit: "clubs", rank: "2" },
      },
    ],
    winner: 1,
  };

  const observation: WhistObservation = {
    player: 0,
    hand: [
      { suit: "spades", rank: "A" },
      { suit: "hearts", rank: "K" },
    ],
    trump: "hearts",
    currentPlayer: 0,
    currentTrick: {
      leader: 0,
      plays: [],
    },
    trickHistory: [trick],
    tricksWon: {
      0: 0,
      1: 1,
      2: 0,
      3: 0,
    },
  };

  it("identifie le joueur observé", () => {
    expect(observation.player).toBe(0);
  });

  it("n'expose que la main du joueur observé", () => {
    expect(observation.hand).toEqual([
      { suit: "spades", rank: "A" },
      { suit: "hearts", rank: "K" },
    ]);

    // Aucun champ permettant d'accéder aux mains adverses.
    expect("hands" in observation).toBe(false);
    expect("opponentHands" in observation).toBe(false);
  });

  it("expose l'atout", () => {
    expect(observation.trump).toBe("hearts");
  });

  it("identifie le joueur actif", () => {
    expect(observation.currentPlayer).toBe(0);
  });

  it("expose les plis terminés dans l'ordre", () => {
    expect(observation.trickHistory).toHaveLength(1);
    expect(observation.trickHistory[0]).toEqual(trick);
  });

  it("conserve l'ordre des cartes du pli", () => {
    expect(observation.trickHistory[0].plays.map(p => p.player))
      .toEqual([1, 2, 3, 0]);
  });

  it("expose le gagnant d'un pli terminé", () => {
    expect(observation.trickHistory[0].winner).toBe(1);
  });

  it("expose le score en plis de chaque joueur", () => {
    expect(observation.tricksWon).toEqual({
      0: 0,
      1: 1,
      2: 0,
      3: 0,
    });
  });
});
