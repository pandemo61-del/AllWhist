# Fix Display of the 4th Played Card

The 4th card (played by the player on the right, Est/Paul) is often hidden or missing from the display because it is rendered behind the player's slot component due to React Native's sibling ordering and z-index handling.

## Proposed Changes

### [Component Name] UI Rendering Fix

#### [MODIFY] [GameTable.tsx](file:///C:/Projects/allwhist/src/components/GameTable.tsx)
- Move the trick card overlay (`pliOverlayInternal`) to the end of the `middleRow` container to ensure it is rendered on top of both the Ouest and Est player slots.
- Add `zIndex` and `elevation` to the card overlay and individual cards to ensure they stay on top of other UI elements.
- Add `overflow: 'visible'` to parent containers to prevent clipping of animated cards.

## Verification Plan

### Automated Tests
- Run simulation tests to ensure the game logic still populates `pliEnCours.cartesJouees` correctly.
- Verify that the number of cards in `pliEnCours` reaches 4.

### Manual Verification
- Play a game and verify that when the 4th player (Est) plays, the card is visible on top of their slot and moves correctly to the center.
- Verify on an Android device (where `elevation` is critical) that the card is not hidden under the player's badge even when active.
