import type { GameState } from "@/types/gameState.ts";
import { transitionToPhase } from "@/state/phaseTransition.ts";

// Dev action types
export type DevAction =
  | { type: "DEV_SKIP_TO_EFFECT"; raptorCard: number; scientistCard: number }
  | { type: "DEV_SKIP_TO_ACTION"; player: "scientist" | "raptor" }
  | { type: "DEV_SKIP_TO_CARD_SELECTION"; player: "scientist" | "raptor" }
  | { type: "LOAD_GAME"; savedState: GameState }
  | { type: "TOGGLE_SHOW_COORDINATES" };

// Dev helper: auto-setup pieces if none placed
function devAutoSetup(state: GameState): GameState {
  // Check if already set up (mother placed)
  if (state.mother.tileId !== -1) return state;

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
      tileId: 2,
      x: motherSpace.coordinate.x,
      y: motherSpace.coordinate.y,
    },
  };

  // Place babies on other square tiles
  const tilesForBabies = squareTiles.filter((t) => t.id !== 2);
  const newBabies = [...newState.babies];
  let babyIndex = 0;
  for (const tile of tilesForBabies) {
    if (babyIndex >= 5) break;
    const space = tile.spaces.find((s) => !s.hasMountain)!;
    newBabies[babyIndex] = {
      ...newBabies[babyIndex],
      tileId: tile.id,
      x: space.coordinate.x,
      y: space.coordinate.y,
    };
    babyIndex++;
  }
  newState = {
    ...newState,
    babies: newBabies,
  };

  // Place scientists on L-tiles
  const newScientists = [...newState.scientists];
  let scientistIndex = 0;
  for (const tile of lTiles) {
    if (scientistIndex >= 4) break;
    const space = tile.spaces.find((s) => !s.isExit && !s.isUnusable)!;
    newScientists[scientistIndex] = {
      ...newScientists[scientistIndex],
      tileId: tile.id,
      x: space.coordinate.x,
      y: space.coordinate.y,
    };
    scientistIndex++;
  }
  newState = {
    ...newState,
    scientists: newScientists,
  };

  return newState;
}

export function handleDevSkipToEffect(
  state: GameState,
  action: { raptorCard: number; scientistCard: number },
): GameState {
  const setupState = devAutoSetup(state);
  const newState = {
    ...setupState,
    scientistCards: {
      ...setupState.scientistCards,
      played: action.scientistCard,
      hand: setupState.scientistCards.hand.filter((c) => c !== action.scientistCard),
    },
    raptorCards: {
      ...setupState.raptorCards,
      played: action.raptorCard,
      hand: setupState.raptorCards.hand.filter((c) => c !== action.raptorCard),
    },
  };
  return transitionToPhase(newState, "EFFECT_PHASE");
}

export function handleDevSkipToAction(state: GameState, action: { player: "scientist" | "raptor" }): GameState {
  const setupState = devAutoSetup(state);
  const raptorCard = action.player === "raptor" ? 9 : 1;
  const scientistCard = action.player === "scientist" ? 9 : 1;

  const newState = {
    ...setupState,
    scientistCards: {
      ...setupState.scientistCards,
      played: scientistCard,
      hand: setupState.scientistCards.hand.filter((c) => c !== scientistCard),
    },
    raptorCards: {
      ...setupState.raptorCards,
      played: raptorCard,
      hand: setupState.raptorCards.hand.filter((c) => c !== raptorCard),
    },
    actionPoints: 8,
  };
  return transitionToPhase(newState, "ACTION_PHASE");
}

export function handleDevSkipToCardSelection(state: GameState, action: { player: "scientist" | "raptor" }): GameState {
  const setupState = devAutoSetup(state);
  const phase = action.player === "scientist" ? "SCIENTIST_CARD_SELECTION" : "RAPTOR_CARD_SELECTION";

  const newState = {
    ...setupState,
    // Reset played cards for a fresh selection
    scientistCards: {
      ...setupState.scientistCards,
      played: action.player === "raptor" ? setupState.scientistCards.hand[0] : null,
    },
    raptorCards: {
      ...setupState.raptorCards,
      played: null,
    },
  };
  return transitionToPhase(newState, phase);
}

export function handleLoadGame(_state: GameState, action: { savedState: GameState }): GameState {
  // Replace entire state with saved state
  return action.savedState;
}

export function handleToggleShowCoordinates(state: GameState): GameState {
  return { ...state, showCoordinates: !state.showCoordinates };
}

// Handler map for dev actions
export const devHandlers = {
  DEV_SKIP_TO_EFFECT: handleDevSkipToEffect,
  DEV_SKIP_TO_ACTION: handleDevSkipToAction,
  DEV_SKIP_TO_CARD_SELECTION: handleDevSkipToCardSelection,
  LOAD_GAME: handleLoadGame,
  TOGGLE_SHOW_COORDINATES: handleToggleShowCoordinates,
};
