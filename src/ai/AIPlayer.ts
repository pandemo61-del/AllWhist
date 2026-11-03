it("suit la couleur demandée lorsqu'elle est disponible", async () => {
  const observation = makeObservation({
    currentTrick: {
      leader: 1,
      plays: [
        {
          player: 1,
          card: { suit: "spades", rank: "2" },
        },
      ],
    },
    hand: [
      { suit: "spades", rank: "A" },
      { suit: "spades", rank: "10" },
      { suit: "hearts", rank: "K" },
    ],
  });

  const selected = await ai.chooseCard(observation);

  expect(selected.suit).toBe("spades");
});
