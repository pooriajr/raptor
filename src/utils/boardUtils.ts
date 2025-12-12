import type { GameState, PieceState } from "../types/gameState.ts";
import { localToGlobal, getAdjacentGlobalCoordinates } from "../types/coordinates.ts";
import { isMotherPlaced, getPlacedBabies, getPlacedScientists, countPlacedBabies } from "./pieceUtils.ts";

// Helper to find an item by id in an array
export function findById<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find((item) => item.id === id);
}

// Helper to get all placed pieces as PieceState array
export function getAllPieces(state: GameState): PieceState[] {
  const pieces: PieceState[] = [];
  if (isMotherPlaced(state)) {
    pieces.push({ ...state.mother, type: "mother" });
  }
  for (const baby of getPlacedBabies(state)) {
    pieces.push({ ...baby, type: "baby" });
  }
  for (const scientist of getPlacedScientists(state)) {
    pieces.push({ ...scientist, type: "scientist" });
  }
  return pieces;
}

// Helper to check if a space is occupied by any piece
export function isSpaceOccupied(
  state: GameState,
  tileId: number,
  x: number,
  y: number,
  excludePieceId?: string,
): boolean {
  if (
    state.mother &&
    state.mother.tileId === tileId &&
    state.mother.x === x &&
    state.mother.y === y &&
    state.mother.id !== excludePieceId
  ) {
    return true;
  }
  if (state.babies.some((b) => b.tileId === tileId && b.x === x && b.y === y && b.id !== excludePieceId)) {
    return true;
  }
  return Object.values(state.scientists).some(
    (s) => s.position?.tileId === tileId && s.position?.x === x && s.position?.y === y && s.id !== excludePieceId,
  );
}

// Helper to check if tile has a raptor (mother or baby)
export function tileHasRaptor(state: GameState, tileId: number): boolean {
  if (state.mother.tileId === tileId) return true;
  return state.babies.some((b) => b.tileId === tileId);
}

// Helper to check if tile has a scientist
export function tileHasScientist(state: GameState, tileId: number): boolean {
  return Object.values(state.scientists).some((s) => s.position?.tileId === tileId);
}

// Helper to check if a space has a mountain
export function spaceHasMountain(state: GameState, tileId: number, x: number, y: number): boolean {
  const tile = state.tiles.find((t) => t.id === tileId);
  if (!tile) return true; // Invalid tile, treat as blocked
  const space = tile.spaces.find((s) => s.coordinate.x === x && s.coordinate.y === y);
  if (!space) return true; // Invalid space, treat as blocked
  return space.hasMountain;
}

// Check if raptor setup is complete (mother + 5 babies placed)
export function isRaptorSetupComplete(state: GameState): boolean {
  return isMotherPlaced(state) && countPlacedBabies(state) === 5;
}

// Helper to check if two pieces are adjacent (orthogonally)
export function arePiecesAdjacent(piece1: PieceState, piece2: PieceState): boolean {
  const global1 = localToGlobal(piece1.tileId, piece1.x, piece1.y);
  const global2 = localToGlobal(piece2.tileId, piece2.x, piece2.y);
  const adjacent = getAdjacentGlobalCoordinates(global1.globalX, global1.globalY);
  return adjacent.some((adj) => adj.globalX === global2.globalX && adj.globalY === global2.globalY);
}
