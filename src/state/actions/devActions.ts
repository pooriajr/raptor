import type { GameState } from "@/types/gameState.ts";
import { createInitialGameState } from "@/types/gameState.ts";
import { createInitialInteractionState } from "@/types/gameState.ts";
import type { CardId } from "@/data/cards.ts";
import { withPhase } from "@/state/phase.ts";
import { drawToHand } from "./cardActions.ts";
import { handleAdvancePhase } from "./phaseActions.ts";

// Dev action types
export type DevAction =
  | { type: "DEV_SKIP_TO_EFFECT"; raptorCard: CardId; scientistCard: CardId }
  | { type: "DEV_SKIP_TO_ACTION"; player: "scientist" | "raptor" }
  | { type: "DEV_SKIP_TO_CARD_SELECTION"; player: "scientist" | "raptor" }
  | { type: "LOAD_GAME"; savedState: GameState }
  | { type: "RESET_GAME" };

// Dev helper: auto-setup pieces if none placed
function devAutoSetup(state: GameState): GameState {
  // Check if already set up (mother placed)
  if (state.mother.position !== null) return state;

  let newState = { ...state };
  const squareTiles = newState.tiles.filter((t) => t.shape === "square");
  const lTiles = newState.tiles.filter((t) => t.shape === "L");

  // Place mother on tile 2
  const tile2 = squareTiles.find((t) => t.id === 2)!;
  const motherSpace = tile2.spaces.find((s) => !s.hasMountain)!;
  newState = {
    ...newState,
    mother: {
      ...newState.mother,
      position: { tileId: 2, x: motherSpace.coordinate.x, y: motherSpace.coordinate.y },
    },
  };

  // Place babies on other square tiles
  const tilesForBabies = squareTiles.filter((t) => t.id !== 2);
  const babyIds = Object.keys(newState.babies);
  const newBabies = { ...newState.babies };
  let babyIndex = 0;
  for (const tile of tilesForBabies) {
    if (babyIndex >= 5) break;
    const space = tile.spaces.find((s) => !s.hasMountain)!;
    const babyId = babyIds[babyIndex];
    newBabies[babyId] = {
      ...newBabies[babyId],
      position: { tileId: tile.id, x: space.coordinate.x, y: space.coordinate.y },
    };
    babyIndex++;
  }
  newState = {
    ...newState,
    babies: newBabies,
  };

  // Place scientists on L-tiles
  const scientistIds = Object.keys(newState.scientists);
  const scientists = { ...newState.scientists };
  for (let i = 0; i < 4 && i < lTiles.length; i++) {
    const tile = lTiles[i];
    const space = tile.spaces.find((s) => !s.isExit && !s.isUnusable)!;
    scientists[scientistIds[i]] = {
      ...scientists[scientistIds[i]],
      position: { tileId: tile.id, x: space.coordinate.x, y: space.coordinate.y },
    };
  }
  newState = { ...newState, scientists };

  return newState;
}

export function handleDevSkipToEffect(
  state: GameState,
  action: { raptorCard: CardId; scientistCard: CardId },
): GameState {
  const setupState = devAutoSetup(state);
  const newState = withPhase(
    {
      ...setupState,
      raptorCards: drawToHand(setupState.raptorCards),
      scientistCards: drawToHand(setupState.scientistCards),
      raptorInteraction: { ...setupState.raptorInteraction, selectedCard: action.raptorCard },
      scientistInteraction: { ...setupState.scientistInteraction, selectedCard: action.scientistCard },
    },
    "RAPTOR_CARD_SELECTION",
  );

  // Enter CARD_REVEAL (compute round resolution), then enter EFFECT_PHASE.
  return handleAdvancePhase(handleAdvancePhase(newState));
}

export function handleDevSkipToAction(state: GameState, action: { player: "scientist" | "raptor" }): GameState {
  const setupState = devAutoSetup(state);

  // Higher card player gets action points, lower card player gets effect.
  const raptorCardId: CardId = action.player === "raptor" ? "raptor_9_none" : "raptor_1_mothers_call";
  const scientistCardId: CardId = action.player === "scientist" ? "scientist_9_none" : "scientist_1_sleeping_gas";

  const newState = withPhase(
    {
      ...setupState,
      raptorCards: drawToHand(setupState.raptorCards),
      scientistCards: drawToHand(setupState.scientistCards),
      raptorInteraction: { ...setupState.raptorInteraction, selectedCard: raptorCardId },
      scientistInteraction: { ...setupState.scientistInteraction, selectedCard: scientistCardId },
    },
    "RAPTOR_CARD_SELECTION",
  );

  // RAPTOR_CARD_SELECTION -> CARD_REVEAL -> EFFECT_PHASE -> ACTION_PHASE
  return handleAdvancePhase(handleAdvancePhase(handleAdvancePhase(newState)));
}

export function handleDevSkipToCardSelection(state: GameState, action: { player: "scientist" | "raptor" }): GameState {
  const setupState = devAutoSetup(state);
  const phase = action.player === "scientist" ? "SCIENTIST_CARD_SELECTION" : "RAPTOR_CARD_SELECTION";

  const baseState = {
    ...setupState,
    raptorCards: drawToHand(setupState.raptorCards),
    scientistCards: drawToHand(setupState.scientistCards),
    raptorInteraction: createInitialInteractionState(),
    scientistInteraction: createInitialInteractionState(),
  };

  // If skipping to raptor selection, pre-select the scientist's first card to keep the phase coherent.
  const readyState =
    phase === "RAPTOR_CARD_SELECTION"
      ? {
          ...baseState,
          scientistInteraction: {
            ...baseState.scientistInteraction,
            selectedCard: baseState.scientistCards.hand[0]?.id ?? null,
          },
        }
      : baseState;

  return withPhase(readyState, phase);
}

export function handleLoadGame(_state: GameState, action: { savedState: GameState }): GameState {
  // Replace entire state with saved state
  return action.savedState;
}

export function handleResetGame(): GameState {
  // Reset to initial game state (main menu)
  return createInitialGameState();
}

// Handler map for dev actions
export const devHandlers = {
  DEV_SKIP_TO_EFFECT: handleDevSkipToEffect,
  DEV_SKIP_TO_ACTION: handleDevSkipToAction,
  DEV_SKIP_TO_CARD_SELECTION: handleDevSkipToCardSelection,
  LOAD_GAME: handleLoadGame,
  RESET_GAME: handleResetGame,
};
