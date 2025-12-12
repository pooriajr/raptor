import type { GameState, BoardPosition } from "../types/gameState.ts";
import { localToGlobal, getAdjacentGlobalCoordinates } from "../types/coordinates.ts";
import {
  isMotherPlaced,
  getBoardBabies,
  countPlacedBabies,
  motherToBoardPosition,
  boardBabiesToBoardPositions,
} from "./pieceUtils.ts";
import { boardScientistsToBoardPositions } from "./scientistUtils.ts";

// Helper to find an item by id in an array
export function findById<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find((item) => item.id === id);
}

// Helper to get all placed pieces as BoardPosition array for collision detection
export function getAllBoardPositions(state: GameState): BoardPosition[] {
  const positions: BoardPosition[] = [];
  const motherPos = motherToBoardPosition(state);
  if (motherPos) {
    positions.push(motherPos);
  }
  positions.push(...boardBabiesToBoardPositions(state));
  positions.push(...boardScientistsToBoardPositions(state.scientists));
  return positions;
}

// Helper to check if a space is occupied by any piece
export function isSpaceOccupied(
  state: GameState,
  tileId: number,
  x: number,
  y: number,
  excludePieceId?: string,
): boolean {
  const mother = state.mother;
  if (
    mother.position &&
    mother.position.tileId === tileId &&
    mother.position.x === x &&
    mother.position.y === y &&
    mother.id !== excludePieceId
  ) {
    return true;
  }
  if (
    Object.values(state.babies).some(
      (b) =>
        b.position &&
        b.position.tileId === tileId &&
        b.position.x === x &&
        b.position.y === y &&
        b.id !== excludePieceId,
    )
  ) {
    return true;
  }
  return Object.values(state.scientists).some(
    (s) =>
      s.position && s.position.tileId === tileId && s.position.x === x && s.position.y === y && s.id !== excludePieceId,
  );
}

// Helper to check if tile has a raptor (mother or baby)
export function tileHasRaptor(state: GameState, tileId: number): boolean {
  if (state.mother.position?.tileId === tileId) return true;
  return Object.values(state.babies).some((b) => b.position?.tileId === tileId);
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

// Helper to check if two positions are adjacent (orthogonally)
export function arePositionsAdjacent(
  pos1: { tileId: number; x: number; y: number },
  pos2: { tileId: number; x: number; y: number },
): boolean {
  const global1 = localToGlobal(pos1.tileId, pos1.x, pos1.y);
  const global2 = localToGlobal(pos2.tileId, pos2.x, pos2.y);
  const adjacent = getAdjacentGlobalCoordinates(global1.globalX, global1.globalY);
  return adjacent.some((adj) => adj.globalX === global2.globalX && adj.globalY === global2.globalY);
}
