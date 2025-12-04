import type { GameState, PieceState } from "../types/gameState.ts";

// Action types
export type GameAction =
  | { type: "PLACE_SCIENTIST"; tileId: number; x: number; y: number }
  | { type: "PLACE_MOTHER"; tileId: number; x: number; y: number }
  | { type: "PLACE_BABY"; tileId: number; x: number; y: number }
  | {
      type: "MOVE_PIECE";
      pieceId: string;
      tileId: number;
      x: number;
      y: number;
    }
  | { type: "START_GAME" };

// Helper to check if a space is occupied
function isSpaceOccupied(
  pieces: PieceState[],
  tileId: number,
  x: number,
  y: number,
  excludePieceId?: string,
): boolean {
  return pieces.some(
    (p) =>
      p.tileId === tileId && p.x === x && p.y === y && p.id !== excludePieceId,
  );
}

// Helper to check if a space has a mountain
function spaceHasMountain(
  state: GameState,
  tileId: number,
  x: number,
  y: number,
): boolean {
  const tile = state.tiles.find((t) => t.id === tileId);
  if (!tile) return true; // Invalid tile, treat as blocked
  const space = tile.spaces.find(
    (s) => s.coordinate.x === x && s.coordinate.y === y,
  );
  if (!space) return true; // Invalid space, treat as blocked
  return space.hasMountain;
}

// Helper to check if tile already has a raptor
function tileHasRaptor(pieces: PieceState[], tileId: number): boolean {
  return pieces.some(
    (p) => (p.type === "mother" || p.type === "baby") && p.tileId === tileId,
  );
}

// Helper to check if tile already has a scientist
function tileHasScientist(pieces: PieceState[], tileId: number): boolean {
  return pieces.some((p) => p.type === "scientist" && p.tileId === tileId);
}

// Generate unique piece ID
function generatePieceId(type: string, pieces: PieceState[]): string {
  const existingOfType = pieces.filter((p) => p.id.startsWith(type));
  return `${type}-${existingOfType.length}`;
}

// Check if raptor setup is complete (mother + 5 babies placed)
function isRaptorSetupComplete(state: GameState): boolean {
  const mother = state.pieces.find((p) => p.type === "mother");
  const babies = state.pieces.filter((p) => p.type === "baby");
  return mother !== undefined && babies.length === 5;
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "PLACE_SCIENTIST": {
      // Validate: must be in scientist setup phase
      if (state.phase !== "SCIENTIST_SETUP") return state;

      // Validate: must have scientists in holding pen
      if (state.holdingPen.scientists <= 0) return state;

      // Validate: must be an L-tile
      const tile = state.tiles.find((t) => t.id === action.tileId);
      if (!tile || tile.shape !== "L") return state;

      // Validate: not on exit or unusable space
      const space = tile.spaces.find(
        (s) => s.coordinate.x === action.x && s.coordinate.y === action.y,
      );
      if (!space || space.isExit || space.isUnusable) return state;

      // Validate: no mountain
      if (space.hasMountain) return state;

      // Validate: no scientist already on this L-tile
      if (tileHasScientist(state.pieces, action.tileId)) return state;

      // Validate: space not occupied
      if (isSpaceOccupied(state.pieces, action.tileId, action.x, action.y))
        return state;

      const newPiece: PieceState = {
        id: generatePieceId("scientist", state.pieces),
        type: "scientist",
        tileId: action.tileId,
        x: action.x,
        y: action.y,
      };

      return {
        ...state,
        pieces: [...state.pieces, newPiece],
        holdingPen: {
          ...state.holdingPen,
          scientists: state.holdingPen.scientists - 1,
        },
      };
    }

    case "PLACE_MOTHER": {
      // Validate: must be in raptor setup phase
      if (state.phase !== "RAPTOR_SETUP") return state;

      // Validate: must have mother in holding pen
      if (state.holdingPen.mother <= 0) return state;

      // Validate: must be a central square tile (2 or 7)
      const centralTiles = [2, 7];
      const tile = state.tiles.find((t) => t.id === action.tileId);
      if (
        !tile ||
        tile.shape !== "square" ||
        !centralTiles.includes(action.tileId)
      )
        return state;

      // Validate: no mountain
      if (spaceHasMountain(state, action.tileId, action.x, action.y))
        return state;

      // Validate: no raptor already on this tile
      if (tileHasRaptor(state.pieces, action.tileId)) return state;

      // Validate: space not occupied
      if (isSpaceOccupied(state.pieces, action.tileId, action.x, action.y))
        return state;

      const newPiece: PieceState = {
        id: "mother",
        type: "mother",
        tileId: action.tileId,
        x: action.x,
        y: action.y,
      };

      const newState = {
        ...state,
        pieces: [...state.pieces, newPiece],
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

    case "PLACE_BABY": {
      // Validate: must be in raptor setup phase
      if (state.phase !== "RAPTOR_SETUP") return state;

      // Validate: must have babies in holding pen
      if (state.holdingPen.babies <= 0) return state;

      // Validate: must be a square tile
      const tile = state.tiles.find((t) => t.id === action.tileId);
      if (!tile || tile.shape !== "square") return state;

      // Validate: no mountain
      if (spaceHasMountain(state, action.tileId, action.x, action.y))
        return state;

      // Validate: no raptor already on this tile
      if (tileHasRaptor(state.pieces, action.tileId)) return state;

      // Validate: must leave at least one central tile free for mother (if mother not yet placed)
      const centralTiles = [2, 7];
      const motherPlaced = state.pieces.some((p) => p.type === "mother");
      if (centralTiles.includes(action.tileId) && !motherPlaced) {
        const babiesOnCentralTiles = state.pieces.filter(
          (p) => p.type === "baby" && centralTiles.includes(p.tileId),
        );
        // If one central tile already has a baby, can't place on the other (must leave one for mother)
        if (babiesOnCentralTiles.length >= 1) return state;
      }

      // Validate: space not occupied
      if (isSpaceOccupied(state.pieces, action.tileId, action.x, action.y))
        return state;

      const newPiece: PieceState = {
        id: generatePieceId("baby", state.pieces),
        type: "baby",
        tileId: action.tileId,
        x: action.x,
        y: action.y,
      };

      const newState = {
        ...state,
        pieces: [...state.pieces, newPiece],
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

    case "MOVE_PIECE": {
      // Find the piece
      const piece = state.pieces.find((p) => p.id === action.pieceId);
      if (!piece) return state;

      // Validate: target tile exists
      const targetTile = state.tiles.find((t) => t.id === action.tileId);
      if (!targetTile) return state;

      // Validate: target space exists and has no mountain
      const targetSpace = targetTile.spaces.find(
        (s) => s.coordinate.x === action.x && s.coordinate.y === action.y,
      );
      if (!targetSpace || targetSpace.hasMountain || targetSpace.isUnusable)
        return state;

      // Validate: space not occupied
      if (
        isSpaceOccupied(
          state.pieces,
          action.tileId,
          action.x,
          action.y,
          action.pieceId,
        )
      )
        return state;

      // Note: Movement validation (is this a valid move for this piece type?)
      // should be done by piece classes before dispatching. The reducer trusts
      // that the caller has validated the move is legal for the piece.

      return {
        ...state,
        pieces: state.pieces.map((p) =>
          p.id === action.pieceId
            ? { ...p, tileId: action.tileId, x: action.x, y: action.y }
            : p,
        ),
      };
    }

    case "START_GAME": {
      // Validate: must be in scientist setup phase with 4 scientists placed
      if (state.phase !== "SCIENTIST_SETUP") return state;
      const scientistsPlaced = state.pieces.filter(
        (p) => p.type === "scientist",
      ).length;
      if (scientistsPlaced !== 4) return state;

      return {
        ...state,
        phase: "SCIENTIST_CARD_SELECTION",
      };
    }

    default:
      return state;
  }
}
