import type { GameState, PieceState } from "@/types/gameState.ts";
import {
  isSpaceOccupied,
  tileHasRaptor,
  tileHasScientist,
  spaceHasMountain,
  isRaptorSetupComplete,
} from "@/utils/boardUtils.ts";
import { transitionToPhase } from "@/state/phaseTransition.ts";
import {
  isPlaced,
  isMotherPlaced,
  getUnplacedScientists,
  getUnplacedBabies,
  countPlacedScientists,
} from "@/utils/pieceUtils.ts";

// Action types for setup phase
export type SetupAction =
  | { type: "PLACE_SCIENTIST"; tileId: number; x: number; y: number }
  | { type: "PLACE_MOTHER"; tileId: number; x: number; y: number }
  | { type: "PLACE_BABY"; tileId: number; x: number; y: number }
  | { type: "REMOVE_PIECE"; pieceId: string }
  | { type: "MOVE_PIECE_ON_TILE"; pieceId: string; tileId: number; x: number; y: number }
  | { type: "CONFIRM_RAPTOR_SETUP" }
  | { type: "START_GAME" };

export function handlePlaceScientist(state: GameState, action: { tileId: number; x: number; y: number }): GameState {
  // Validate: must be in scientist setup phase
  if (state.phase !== "SCIENTIST_SETUP") return state;

  // Validate: must have unplaced scientists available
  const unplacedScientists = getUnplacedScientists(state);
  if (unplacedScientists.length === 0) return state;
  const unplacedScientist = unplacedScientists[0];

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

  return {
    ...state,
    scientists: state.scientists.map((s) =>
      s.id === unplacedScientist.id ? { ...s, tileId: action.tileId, x: action.x, y: action.y } : s,
    ),
  };
}

export function handlePlaceMother(state: GameState, action: { tileId: number; x: number; y: number }): GameState {
  // Validate: must be in raptor setup phase
  if (state.phase !== "RAPTOR_SETUP") return state;

  // Validate: mother must be unplaced
  if (isMotherPlaced(state)) return state;

  // Validate: must be a central square tile (2 or 7)
  const centralTiles = [2, 7];
  const tile = state.tiles.find((t) => t.id === action.tileId);
  if (!tile || tile.shape !== "square" || !centralTiles.includes(action.tileId)) return state;

  // Validate: no mountain
  if (spaceHasMountain(state, action.tileId, action.x, action.y)) return state;

  // Check if a baby is on this tile - if so, unplace it (mother displaces baby)
  const babyOnTile = state.babies.find((b) => b.tileId === action.tileId);
  let newBabies = state.babies;

  if (babyOnTile) {
    newBabies = state.babies.map((b) => (b.id === babyOnTile.id ? { ...b, tileId: -1, x: -1, y: -1 } : b));
  }

  // Validate: specific space not occupied by another piece (scientist shouldn't be here during raptor setup, but check anyway)
  if (state.scientists.some((s) => s.tileId === action.tileId && s.x === action.x && s.y === action.y)) {
    return state;
  }

  return {
    ...state,
    mother: { ...state.mother, tileId: action.tileId, x: action.x, y: action.y },
    babies: newBabies,
  };
}

export function handlePlaceBaby(state: GameState, action: { tileId: number; x: number; y: number }): GameState {
  // Validate: must be in raptor setup phase
  if (state.phase !== "RAPTOR_SETUP") return state;

  // Validate: must have unplaced babies available
  const unplacedBabies = getUnplacedBabies(state);
  if (unplacedBabies.length === 0) return state;
  const unplacedBaby = unplacedBabies[0];

  // Validate: must be a square tile
  const tile = state.tiles.find((t) => t.id === action.tileId);
  if (!tile || tile.shape !== "square") return state;

  // Validate: no mountain
  if (spaceHasMountain(state, action.tileId, action.x, action.y)) return state;

  // Validate: no raptor already on this tile
  if (tileHasRaptor(state, action.tileId)) return state;

  // Validate: must leave at least one central tile free for mother (if mother not yet placed)
  const centralTiles = [2, 7];
  if (centralTiles.includes(action.tileId) && !isMotherPlaced(state)) {
    const babiesOnCentralTiles = state.babies.filter((b) => isPlaced(b) && centralTiles.includes(b.tileId));
    // If one central tile already has a baby, can't place on the other (must leave one for mother)
    if (babiesOnCentralTiles.length >= 1) return state;
  }

  // Validate: space not occupied
  if (isSpaceOccupied(state, action.tileId, action.x, action.y)) return state;

  return {
    ...state,
    babies: state.babies.map((b) =>
      b.id === unplacedBaby.id ? { ...b, tileId: action.tileId, x: action.x, y: action.y } : b,
    ),
  };
}

export function handleConfirmRaptorSetup(state: GameState): GameState {
  // Validate: must be in raptor setup phase with complete setup
  if (state.phase !== "RAPTOR_SETUP") return state;
  if (!isRaptorSetupComplete(state)) return state;

  return transitionToPhase(state, "SCIENTIST_SETUP");
}

export function handleStartGame(state: GameState): GameState {
  // Validate: must be in scientist setup phase with 4 scientists placed
  if (state.phase !== "SCIENTIST_SETUP") return state;
  if (countPlacedScientists(state) !== 4) return state;

  // Go to scientist ready screen first (scientist picks first)
  return transitionToPhase(state, "SCIENTIST_READY");
}

export function handleRemovePiece(state: GameState, action: { pieceId: string }): GameState {
  // Only allow during setup phases
  if (state.phase !== "RAPTOR_SETUP" && state.phase !== "SCIENTIST_SETUP") return state;

  const { pieceId } = action;

  // Check if it's the mother (and placed)
  if (state.mother.id === pieceId && isPlaced(state.mother)) {
    return {
      ...state,
      mother: { ...state.mother, tileId: -1, x: -1, y: -1 },
    };
  }

  // Check if it's a baby (and placed)
  const baby = state.babies.find((b) => b.id === pieceId && isPlaced(b));
  if (baby) {
    return {
      ...state,
      babies: state.babies.map((b) => (b.id === pieceId ? { ...b, tileId: -1, x: -1, y: -1 } : b)),
    };
  }

  // Check if it's a scientist (and placed)
  const scientist = state.scientists.find((s) => s.id === pieceId && isPlaced(s));
  if (scientist) {
    return {
      ...state,
      scientists: state.scientists.map((s) => (s.id === pieceId ? { ...s, tileId: -1, x: -1, y: -1 } : s)),
    };
  }

  return state;
}

export function handleMovePieceOnTile(
  state: GameState,
  action: { pieceId: string; tileId: number; x: number; y: number },
): GameState {
  // Only allow during setup phases
  if (state.phase !== "RAPTOR_SETUP" && state.phase !== "SCIENTIST_SETUP") return state;

  const { pieceId, tileId, x, y } = action;

  // Find the piece
  let piece: PieceState | null = null;

  if (state.mother?.id === pieceId) {
    piece = state.mother;
  } else {
    const baby = state.babies.find((b) => b.id === pieceId);
    if (baby) {
      piece = baby;
    } else {
      const scientist = state.scientists.find((s) => s.id === pieceId);
      if (scientist) {
        piece = scientist;
      }
    }
  }

  if (!piece) return state;

  // Validate: piece is actually on the specified tile
  if (piece.tileId !== tileId) return state;

  // Validate: target space is on the same tile
  const tile = state.tiles.find((t) => t.id === tileId);
  if (!tile) return state;

  // Validate: target space exists and is valid
  const space = tile.spaces.find((s) => s.coordinate.x === x && s.coordinate.y === y);
  if (!space || space.isUnusable || space.hasMountain) return state;

  // For scientists, can't move to exit spaces
  if (piece.type === "scientist" && space.isExit) return state;

  // Validate: target space is not occupied
  if (isSpaceOccupied(state, tileId, x, y)) return state;

  // Move the piece
  if (piece.type === "mother") {
    return {
      ...state,
      mother: { ...state.mother!, x, y },
    };
  } else if (piece.type === "baby") {
    return {
      ...state,
      babies: state.babies.map((b) => (b.id === pieceId ? { ...b, x, y } : b)),
    };
  } else if (piece.type === "scientist") {
    return {
      ...state,
      scientists: state.scientists.map((s) => (s.id === pieceId ? { ...s, x, y } : s)),
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
  MOVE_PIECE_ON_TILE: handleMovePieceOnTile,
  CONFIRM_RAPTOR_SETUP: handleConfirmRaptorSetup,
  START_GAME: handleStartGame,
};
