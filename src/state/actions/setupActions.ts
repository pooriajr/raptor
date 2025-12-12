import type { GameState } from "@/types/gameState.ts";
import { isSpaceOccupied, tileHasRaptor, tileHasScientist, spaceHasMountain } from "@/utils/boardUtils.ts";
import { isMotherPlaced, getUnplacedBabies, getBoardBabies } from "@/utils/pieceUtils.ts";
import { getNextReserveScientist } from "@/utils/scientistUtils.ts";

// Action types for setup phase
export type SetupAction =
  | { type: "PLACE_SCIENTIST"; tileId: number; x: number; y: number }
  | { type: "PLACE_MOTHER"; tileId: number; x: number; y: number }
  | { type: "PLACE_BABY"; tileId: number; x: number; y: number }
  | { type: "REMOVE_PIECE"; pieceId: string }
  | { type: "MOVE_PIECE_ON_TILE"; pieceId: string; tileId: number; x: number; y: number };

export function handlePlaceScientist(state: GameState, action: { tileId: number; x: number; y: number }): GameState {
  // Validate: must be in scientist setup phase
  if (state.phase !== "SCIENTIST_SETUP") return state;

  // Validate: must have scientists in reserve
  const reserveScientist = getNextReserveScientist(state.scientists);
  if (!reserveScientist) return state;

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
    scientists: {
      ...state.scientists,
      [reserveScientist.id]: {
        ...reserveScientist,
        position: { tileId: action.tileId, x: action.x, y: action.y },
      },
    },
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
  const babyOnTile = Object.values(state.babies).find((b) => b.position?.tileId === action.tileId);
  let newBabies = state.babies;

  if (babyOnTile) {
    newBabies = {
      ...state.babies,
      [babyOnTile.id]: { ...babyOnTile, position: null },
    };
  }

  // Validate: specific space not occupied by another piece (scientist shouldn't be here during raptor setup, but check anyway)
  const scientistOnSpace = Object.values(state.scientists).some(
    (s) => s.position && s.position.tileId === action.tileId && s.position.x === action.x && s.position.y === action.y,
  );
  if (scientistOnSpace) {
    return state;
  }

  return {
    ...state,
    mother: {
      ...state.mother,
      position: { tileId: action.tileId, x: action.x, y: action.y },
    },
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
    const babiesOnCentralTiles = getBoardBabies(state).filter((b) => centralTiles.includes(b.position!.tileId));
    // If one central tile already has a baby, can't place on the other (must leave one for mother)
    if (babiesOnCentralTiles.length >= 1) return state;
  }

  // Validate: space not occupied
  if (isSpaceOccupied(state, action.tileId, action.x, action.y)) return state;

  return {
    ...state,
    babies: {
      ...state.babies,
      [unplacedBaby.id]: {
        ...unplacedBaby,
        position: { tileId: action.tileId, x: action.x, y: action.y },
      },
    },
  };
}

// CONFIRM_RAPTOR_SETUP and START_GAME are now handled by ADVANCE_PHASE

export function handleRemovePiece(state: GameState, action: { pieceId: string }): GameState {
  // Only allow during setup phases
  if (state.phase !== "RAPTOR_SETUP" && state.phase !== "SCIENTIST_SETUP") return state;

  const { pieceId } = action;

  // Check if it's the mother (and placed)
  if (state.mother.id === pieceId && state.mother.position) {
    return {
      ...state,
      mother: { ...state.mother, position: null },
    };
  }

  // Check if it's a baby (and placed)
  const baby = state.babies[pieceId];
  if (baby?.position) {
    return {
      ...state,
      babies: {
        ...state.babies,
        [pieceId]: { ...baby, position: null },
      },
    };
  }

  // Check if it's a scientist (and on board)
  const scientist = state.scientists[pieceId];
  if (scientist?.position) {
    return {
      ...state,
      scientists: {
        ...state.scientists,
        [pieceId]: { ...scientist, position: null },
      },
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

  // Find the piece and its current position
  let pieceType: "mother" | "baby" | "scientist" | null = null;
  let currentTileId: number | null = null;

  if (state.mother.id === pieceId && state.mother.position) {
    pieceType = "mother";
    currentTileId = state.mother.position.tileId;
  } else if (state.babies[pieceId]?.position) {
    pieceType = "baby";
    currentTileId = state.babies[pieceId].position!.tileId;
  } else if (state.scientists[pieceId]?.position) {
    pieceType = "scientist";
    currentTileId = state.scientists[pieceId].position!.tileId;
  }

  if (!pieceType || currentTileId === null) return state;

  // Validate: piece is actually on the specified tile
  if (currentTileId !== tileId) return state;

  // Validate: target space is on the same tile
  const tile = state.tiles.find((t) => t.id === tileId);
  if (!tile) return state;

  // Validate: target space exists and is valid
  const space = tile.spaces.find((s) => s.coordinate.x === x && s.coordinate.y === y);
  if (!space || space.isUnusable || space.hasMountain) return state;

  // For scientists, can't move to exit spaces
  if (pieceType === "scientist" && space.isExit) return state;

  // Validate: target space is not occupied
  if (isSpaceOccupied(state, tileId, x, y)) return state;

  // Move the piece
  if (pieceType === "mother") {
    return {
      ...state,
      mother: {
        ...state.mother,
        position: { tileId, x, y },
      },
    };
  } else if (pieceType === "baby") {
    const baby = state.babies[pieceId];
    return {
      ...state,
      babies: {
        ...state.babies,
        [pieceId]: { ...baby, position: { tileId, x, y } },
      },
    };
  } else if (pieceType === "scientist") {
    const scientist = state.scientists[pieceId];
    return {
      ...state,
      scientists: {
        ...state.scientists,
        [pieceId]: { ...scientist, position: { tileId, x, y } },
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
  MOVE_PIECE_ON_TILE: handleMovePieceOnTile,
};
