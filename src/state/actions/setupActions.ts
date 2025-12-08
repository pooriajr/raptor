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
  | { type: "REMOVE_PIECE"; pieceId: string }
  | { type: "CONFIRM_RAPTOR_SETUP" }
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

  // Validate: space not occupied (by mother - babies will be displaced)
  if (
    state.mother &&
    state.mother.tileId === action.tileId &&
    state.mother.x === action.x &&
    state.mother.y === action.y
  ) {
    return state;
  }

  // Check if a baby is on this tile - if so, remove it (mother displaces baby)
  const babyOnTile = state.babies.find((b) => b.tileId === action.tileId);
  let newBabies = state.babies;
  let newBabiesInHoldingPen = state.holdingPen.babies;

  if (babyOnTile) {
    newBabies = state.babies.filter((b) => b.id !== babyOnTile.id);
    newBabiesInHoldingPen = state.holdingPen.babies + 1;
  }

  // Validate: specific space not occupied by another piece (scientist shouldn't be here during raptor setup, but check anyway)
  if (state.scientists.some((s) => s.tileId === action.tileId && s.x === action.x && s.y === action.y)) {
    return state;
  }

  const newMother: PieceState = {
    id: "mother",
    type: "mother",
    tileId: action.tileId,
    x: action.x,
    y: action.y,
  };

  return {
    ...state,
    mother: newMother,
    babies: newBabies,
    holdingPen: {
      ...state.holdingPen,
      mother: 0,
      babies: newBabiesInHoldingPen,
    },
  };
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

  return {
    ...state,
    babies: [...state.babies, newBaby],
    holdingPen: {
      ...state.holdingPen,
      babies: state.holdingPen.babies - 1,
    },
  };
}

export function handleConfirmRaptorSetup(state: GameState): GameState {
  // Validate: must be in raptor setup phase with complete setup
  if (state.phase !== "RAPTOR_SETUP") return state;
  if (!isRaptorSetupComplete(state)) return state;

  return {
    ...state,
    phase: "SCIENTIST_SETUP",
  };
}

export function handleStartGame(state: GameState): GameState {
  // Validate: must be in scientist setup phase with 4 scientists placed
  if (state.phase !== "SCIENTIST_SETUP") return state;
  if (state.scientists.length !== 4) return state;

  // Go to scientist ready screen first (scientist picks first)
  return {
    ...state,
    phase: "SCIENTIST_READY",
  };
}

export function handleRemovePiece(state: GameState, action: { pieceId: string }): GameState {
  // Only allow during setup phases
  if (state.phase !== "RAPTOR_SETUP" && state.phase !== "SCIENTIST_SETUP") return state;

  const { pieceId } = action;

  // Check if it's the mother
  if (state.mother?.id === pieceId) {
    return {
      ...state,
      mother: null,
      holdingPen: {
        ...state.holdingPen,
        mother: 1,
      },
    };
  }

  // Check if it's a baby
  const babyIndex = state.babies.findIndex((b) => b.id === pieceId);
  if (babyIndex !== -1) {
    return {
      ...state,
      babies: state.babies.filter((b) => b.id !== pieceId),
      holdingPen: {
        ...state.holdingPen,
        babies: state.holdingPen.babies + 1,
      },
    };
  }

  // Check if it's a scientist
  const scientistIndex = state.scientists.findIndex((s) => s.id === pieceId);
  if (scientistIndex !== -1) {
    return {
      ...state,
      scientists: state.scientists.filter((s) => s.id !== pieceId),
      holdingPen: {
        ...state.holdingPen,
        scientists: state.holdingPen.scientists + 1,
      },
    };
  }

  return state;
}

// Handler map for setup actions
export const setupHandlers = {
  PLACE_SCIENTIST: handlePlaceScientist,
  PLACE_MOTHER: handlePlaceMother,
  PLACE_BABY: handlePlaceBaby,
  REMOVE_PIECE: handleRemovePiece,
  CONFIRM_RAPTOR_SETUP: handleConfirmRaptorSetup,
  START_GAME: handleStartGame,
};
