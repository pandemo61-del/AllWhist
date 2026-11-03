import { describe, expect, it } from "vitest";
import type {
  AIPlayer,
  Card,
  ObservedTrick,
  WhistObservation,
} from "./AIPlayer";

const aceSpades: Card = { suit: "spades", rank: "A" };
const tenSpades: Card = { suit: "spades", rank: "10" };
const kingHearts: Card = { suit: "hearts", rank: "K" };

function makeObservation(
  overrides: Partial<WhistObservation> = {},
): WhistObservation {
  return {
    player: 0,
    hand: [aceSpades, tenSpades, kingHearts],
    trump: "hearts",
    currentPlayer: 0,
    currentTrick: {
      leader: 1,
      plays: [
        {
          player: 1,
          card: { suit: "spades", rank: "2" },
        },
      ],
    },
    trickHistory: [],
    tricksWon: {
      0: 0,
      1: 0,
      2: 0,
      3: 0,
    },
    ...overrides,
  };
}

/**
 * Implémentation minimale servant à tester le contrat AIPlayer.
 *
 * Une vraie IA remplacera cette stratégie.
 */
class FirstCardAI implements AIPlayer {
  async chooseCard(
    observation: WhistObservation,
  ): Promise<Card> {
    return observation.hand[0];
  }
}

describe("AIPlayer", () => {
  it("retourne une carte de la main observée", async () => {
    const ai = new FirstCardAI();
    const observation = makeObservation();

    const selected = await ai.chooseCard(observation);

    expect(observation.hand).toContainEqual(selected);
  });

  it("prend sa décision uniquement à partir de WhistObservation", async () => {
    const ai: AIPlayer = new FirstCardAI();

    const selected = await ai.chooseCard(makeObservation());

    expect(selected).toEqual(aceSpades);
  });

  it("supporte un choix asynchrone", async () => {
    const ai: AIPlayer = new FirstCardAI();

    const result = ai.chooseCard(makeObservation());

    expect(result).toBeInstanceOf(Promise);
    await expect(result).resolves.toEqual(aceSpades);
  });
});
