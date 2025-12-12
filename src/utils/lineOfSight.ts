import type { GameState, MotherState, ScientistState } from "@/types/gameState";
import { localToGlobal } from "@/types/coordinates";

/**
 * Check if a scientist has line of sight to the mother for shooting.
 *
 * LOS rules:
 * - Must be orthogonal (same row or column)
 * - Blocked by: Rocks (mountains), Active (standing) scientists
 * - Can shoot through: Frightened scientists, fire tokens, baby raptors
 */
export function hasLineOfSight(state: GameState, scientist: ScientistState, mother: MotherState): boolean {
  if (!scientist.position || !mother.position) return false;

  const sciGlobal = localToGlobal(scientist.position.tileId, scientist.position.x, scientist.position.y);
  const motherGlobal = localToGlobal(mother.position.tileId, mother.position.x, mother.position.y);

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
      if (isBlockedAt(state, x, sciGlobal.globalY)) {
        return false;
      }
    }
  } else {
    // sameCol
    const minY = Math.min(sciGlobal.globalY, motherGlobal.globalY);
    const maxY = Math.max(sciGlobal.globalY, motherGlobal.globalY);
    for (let y = minY + 1; y < maxY; y++) {
      if (isBlockedAt(state, sciGlobal.globalX, y)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Check if a global coordinate blocks line of sight.
 * Blocked by mountains and standing (non-frightened) scientists.
 */
function isBlockedAt(state: GameState, globalX: number, globalY: number): boolean {
  for (const tile of state.tiles) {
    for (const space of tile.spaces) {
      const spaceGlobal = localToGlobal(tile.id, space.coordinate.x, space.coordinate.y);
      if (spaceGlobal.globalX === globalX && spaceGlobal.globalY === globalY) {
        // Check for mountain
        if (space.hasMountain) return true;

        // Check for standing (non-frightened) scientist
        const scientistHere = Object.values(state.scientists).find(
          (s) =>
            s.position &&
            s.position.tileId === tile.id &&
            s.position.x === space.coordinate.x &&
            s.position.y === space.coordinate.y,
        );
        if (scientistHere && scientistHere.position && !scientistHere.isFrightened) {
          return true;
        }
      }
    }
  }
  return false;
}
