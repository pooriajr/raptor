import type { GameState, PieceState } from "../types/gameState.ts";
import { localToGlobal } from "../types/coordinates.ts";

// Helper to check if a scientist has line of sight to the mother
// LOS is blocked by: Rocks, Active (standing) scientists
// Can shoot through: Frightened scientists, fire tokens, baby raptors
export function hasLineOfSight(state: GameState, scientist: PieceState, mother: PieceState): boolean {
  const sciGlobal = localToGlobal(scientist.tileId, scientist.x, scientist.y);
  const motherGlobal = localToGlobal(mother.tileId, mother.x, mother.y);

  // Must be in same row or column (orthogonal)
  const sameRow = sciGlobal.globalY === motherGlobal.globalY;
  const sameCol = sciGlobal.globalX === motherGlobal.globalX;
  if (!sameRow && !sameCol) return false;

  // Can't shoot at same position
  if (sameRow && sameCol) return false;

  // Check each space between scientist and mother
  if (sameRow) {
    const minX = Math.min(sciGlobal.globalX, motherGlobal.globalX);
    const maxX = Math.max(sciGlobal.globalX, motherGlobal.globalX);
    for (let x = minX + 1; x < maxX; x++) {
      // Check for mountain at this global position
      // We need to convert back to local coords to check
      for (const tile of state.tiles) {
        for (const space of tile.spaces) {
          const spaceGlobal = localToGlobal(tile.id, space.coordinate.x, space.coordinate.y);
          if (spaceGlobal.globalX === x && spaceGlobal.globalY === sciGlobal.globalY) {
            // Check for mountain
            if (space.hasMountain) return false;

            // Check for standing (non-frightened) scientist
            const pieceHere = state.scientists.find(
              (s) => s.tileId === tile.id && s.x === space.coordinate.x && s.y === space.coordinate.y,
            );
            if (pieceHere && !pieceHere.isFrightened) {
              return false;
            }
          }
        }
      }
    }
  } else {
    // sameCol
    const minY = Math.min(sciGlobal.globalY, motherGlobal.globalY);
    const maxY = Math.max(sciGlobal.globalY, motherGlobal.globalY);
    for (let y = minY + 1; y < maxY; y++) {
      for (const tile of state.tiles) {
        for (const space of tile.spaces) {
          const spaceGlobal = localToGlobal(tile.id, space.coordinate.x, space.coordinate.y);
          if (spaceGlobal.globalX === sciGlobal.globalX && spaceGlobal.globalY === y) {
            // Check for mountain
            if (space.hasMountain) return false;

            // Check for standing (non-frightened) scientist
            const pieceHere = state.scientists.find(
              (s) => s.tileId === tile.id && s.x === space.coordinate.x && s.y === space.coordinate.y,
            );
            if (pieceHere && !pieceHere.isFrightened) {
              return false;
            }
          }
        }
      }
    }
  }

  return true;
}
