import type { GameState, PieceState } from "@/types/gameState.ts";
import {
  isSpaceOccupied,
  tileHasRaptor,
  tileHasScientist,
  spaceHasMountain,
  isRaptorSetupComplete,
} from "@/utils/boardUtils.ts";

// Action types for setup phase
export type SetupAction =
  | { type: "PLACE_SCIENTIST"; tileId: number; x: number; y: number }
  | { type: "PLACE_MOTHER"; tileId: number; x: number; y: number }
  | { type: "PLACE_BABY"; tileId: number; x: number; y: number }
  | { type: "START_GAME" };

export function handlePlaceScientist(state: GameState, action: { tileId: number; x: number; y: number }): GameState {
  // Validate: must be in scientist setup phase
  if (state.phase !== "SCIENTIST_SETUP") return state;

  // Validate: must have scientists in holding pen
  if (state.holdingPen.scientists <= 0) return state;

  // Validate: must be an L-tile
  const tile = state.tiles.find((t) => t.id === action.tileId);
  if (!tile || tile.shape !== "L") return state;

  // Validate: not on exit or unusable space
  const space = tile.spaces.find((s) => s.coordinate.x === action.x && s.coordinate.y === action.y);
  if (!space || space.isExit || space.isUnusable) return state;

  // Validate: no mountain
  if (space.hasMountain) return state;

  // Validate: no scientist already on this L-tile
  if (tileHasScientist(state, action.tileId)) return state;

  // Validate: space not occupied
  if (isSpaceOccupied(state, action.tileId, action.x, action.y)) return state;

  const newScientist: PieceState = {
    id: `scientist-${state.scientists.length}`,
    type: "scientist",
    tileId: action.tileId,
    x: action.x,
    y: action.y,
  };

  return {
    ...state,
    scientists: [...state.scientists, newScientist],
    holdingPen: {
      ...state.holdingPen,
      scientists: state.holdingPen.scientists - 1,
    },
  };
}

export function handlePlaceMother(state: GameState, action: { tileId: number; x: number; y: number }): GameState {
  // Validate: must be in raptor setup phase
  if (state.phase !== "RAPTOR_SETUP") return state;

  // Validate: must have mother in holding pen
  if (state.holdingPen.mother <= 0) return state;

  // Validate: must be a central square tile (2 or 7)
  const centralTiles = [2, 7];
  const tile = state.tiles.find((t) => t.id === action.tileId);
  if (!tile || tile.shape !== "square" || !centralTiles.includes(action.tileId)) return state;

  // Validate: no mountain
  if (spaceHasMountain(state, action.tileId, action.x, action.y)) return state;

  // Validate: no raptor already on this tile
  if (tileHasRaptor(state, action.tileId)) return state;

  // Validate: space not occupied
  if (isSpaceOccupied(state, action.tileId, action.x, action.y)) return state;

  const newMother: PieceState = {
    id: "mother",
    type: "mother",
    tileId: action.tileId,
    x: action.x,
    y: action.y,
  };

  const newState = {
    ...state,
    mother: newMother,
    holdingPen: {
      ...state.holdingPen,
      mother: 0,
    },
  };

  // Transition to scientist setup if raptor setup is complete
  if (isRaptorSetupComplete(newState)) {
    return { ...newState, phase: "SCIENTIST_SETUP" as const };
  }

  return newState;
}

export function handlePlaceBaby(state: GameState, action: { tileId: number; x: number; y: number }): GameState {
  // Validate: must be in raptor setup phase
  if (state.phase !== "RAPTOR_SETUP") return state;

  // Validate: must have babies in holding pen
  if (state.holdingPen.babies <= 0) return state;

  // Validate: must be a square tile
  const tile = state.tiles.find((t) => t.id === action.tileId);
  if (!tile || tile.shape !== "square") return state;

  // Validate: no mountain
  if (spaceHasMountain(state, action.tileId, action.x, action.y)) return state;

  // Validate: no raptor already on this tile
  if (tileHasRaptor(state, action.tileId)) return state;

  // Validate: must leave at least one central tile free for mother (if mother not yet placed)
  const centralTiles = [2, 7];
  if (centralTiles.includes(action.tileId) && !state.mother) {
    const babiesOnCentralTiles = state.babies.filter((b) => centralTiles.includes(b.tileId));
    // If one central tile already has a baby, can't place on the other (must leave one for mother)
    if (babiesOnCentralTiles.length >= 1) return state;
  }

  // Validate: space not occupied
  if (isSpaceOccupied(state, action.tileId, action.x, action.y)) return state;

  const newBaby: PieceState = {
    id: `baby-${state.babies.length}`,
    type: "baby",
    tileId: action.tileId,
    x: action.x,
    y: action.y,
  };

  const newState = {
    ...state,
    babies: [...state.babies, newBaby],
    holdingPen: {
      ...state.holdingPen,
      babies: state.holdingPen.babies - 1,
    },
  };

  // Transition to scientist setup if raptor setup is complete
  if (isRaptorSetupComplete(newState)) {
    return { ...newState, phase: "SCIENTIST_SETUP" as const };
  }

  return newState;
}

export function handleStartGame(state: GameState, _action: unknown): GameState {
  // Validate: must be in scientist setup phase with 4 scientists placed
  if (state.phase !== "SCIENTIST_SETUP") return state;
  if (state.scientists.length !== 4) return state;

  // Go to scientist ready screen first (scientist picks first)
  return {
    ...state,
    phase: "SCIENTIST_READY",
  };
}

// Handler map for setup actions
export const setupHandlers = {
  PLACE_SCIENTIST: handlePlaceScientist,
  PLACE_MOTHER: handlePlaceMother,
  PLACE_BABY: handlePlaceBaby,
  START_GAME: handleStartGame,
};
