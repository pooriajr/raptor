import type { GameState, PieceState } from "../types/gameState.ts";

// Action types
export type GameAction =
  | { type: "PLACE_SCIENTIST"; tileId: number; x: number; y: number }
  | { type: "PLACE_MOTHER"; tileId: number; x: number; y: number }
  | { type: "PLACE_BABY"; tileId: number; x: number; y: number }
  | { type: "MOVE_PIECE"; pieceId: string; tileId: number; x: number; y: number };

// Helper to check if a space is occupied
function isSpaceOccupied(
  pieces: PieceState[],
  tileId: number,
  x: number,
  y: number,
  excludePieceId?: string
): boolean {
  return pieces.some(
    (p) =>
      p.tileId === tileId &&
      p.x === x &&
      p.y === y &&
      p.id !== excludePieceId
  );
}

// Helper to check if a space has a mountain
function spaceHasMountain(
  state: GameState,
  tileId: number,
  x: number,
  y: number
): boolean {
  const tile = state.tiles.find((t) => t.id === tileId);
  if (!tile) return true; // Invalid tile, treat as blocked
  const space = tile.spaces.find(
    (s) => s.coordinate.x === x && s.coordinate.y === y
  );
  if (!space) return true; // Invalid space, treat as blocked
  return space.hasMountain;
}

// Helper to check if tile already has a raptor
function tileHasRaptor(pieces: PieceState[], tileId: number): boolean {
  return pieces.some(
    (p) => (p.type === "mother" || p.type === "baby") && p.tileId === tileId
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

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "PLACE_SCIENTIST": {
      // Validate: must have scientists in holding pen
      if (state.holdingPen.scientists <= 0) return state;

      // Validate: must be an L-tile
      const tile = state.tiles.find((t) => t.id === action.tileId);
      if (!tile || tile.shape !== "L") return state;

      // Validate: not on exit or unusable space
      const space = tile.spaces.find(
        (s) => s.coordinate.x === action.x && s.coordinate.y === action.y
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
      // Validate: must have mother in holding pen
      if (state.holdingPen.mother <= 0) return state;

      // Validate: must be a central square tile (2 or 7)
      const centralTiles = [2, 7];
      const tile = state.tiles.find((t) => t.id === action.tileId);
      if (!tile || tile.shape !== "square" || !centralTiles.includes(action.tileId))
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

      return {
        ...state,
        pieces: [...state.pieces, newPiece],
        holdingPen: {
          ...state.holdingPen,
          mother: 0,
        },
      };
    }

    case "PLACE_BABY": {
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

      // Validate: must leave at least one central tile free for mother
      const centralTiles = [2, 7];
      if (centralTiles.includes(action.tileId)) {
        const occupiedCentralTiles = state.pieces.filter(
          (p) =>
            (p.type === "mother" || p.type === "baby") &&
            centralTiles.includes(p.tileId)
        );
        // If one central tile is already occupied, can't place on the other
        if (occupiedCentralTiles.length >= 1) return state;
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

      return {
        ...state,
        pieces: [...state.pieces, newPiece],
        holdingPen: {
          ...state.holdingPen,
          babies: state.holdingPen.babies - 1,
        },
      };
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
        (s) => s.coordinate.x === action.x && s.coordinate.y === action.y
      );
      if (!targetSpace || targetSpace.hasMountain || targetSpace.isUnusable)
        return state;

      // Validate: space not occupied
      if (
        isSpaceOccupied(state.pieces, action.tileId, action.x, action.y, action.pieceId)
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
            : p
        ),
      };
    }

    default:
      return state;
  }
}
