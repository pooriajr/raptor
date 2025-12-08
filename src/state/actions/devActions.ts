import type { GameState } from "@/types/gameState.ts";

// Dev action types
export type DevAction =
  | { type: "DEV_SKIP_TO_EFFECT"; raptorCard: number; scientistCard: number }
  | { type: "DEV_SKIP_TO_ACTION"; player: "scientist" | "raptor" };

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
  const newState = devAutoSetup(state);
  return {
    ...newState,
    phase: "EFFECT_PHASE",
    scientistCards: {
      ...newState.scientistCards,
      played: action.scientistCard,
      hand: newState.scientistCards.hand.filter((c) => c !== action.scientistCard),
    },
    raptorCards: {
      ...newState.raptorCards,
      played: action.raptorCard,
      hand: newState.raptorCards.hand.filter((c) => c !== action.raptorCard),
    },
  };
}

export function handleDevSkipToAction(state: GameState, action: { player: "scientist" | "raptor" }): GameState {
  const newState = devAutoSetup(state);
  const raptorCard = action.player === "raptor" ? 9 : 1;
  const scientistCard = action.player === "scientist" ? 9 : 1;

  return {
    ...newState,
    phase: "ACTION_PHASE",
    scientistCards: {
      ...newState.scientistCards,
      played: scientistCard,
      hand: newState.scientistCards.hand.filter((c) => c !== scientistCard),
    },
    raptorCards: {
      ...newState.raptorCards,
      played: raptorCard,
      hand: newState.raptorCards.hand.filter((c) => c !== raptorCard),
    },
    actionPoints: 8,
    activePlayer: action.player,
  };
}

// Handler map for dev actions
export const devHandlers = {
  DEV_SKIP_TO_EFFECT: handleDevSkipToEffect,
  DEV_SKIP_TO_ACTION: handleDevSkipToAction,
};
