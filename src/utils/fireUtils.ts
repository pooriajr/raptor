import type { GameState } from "../types/gameState.ts";
import { localToGlobal, getAdjacentGlobalCoordinates } from "../types/coordinates.ts";

// Helper to find all fires connected to a starting fire (orthogonally)
export function getConnectedFires(
  fireTokens: GameState["fireTokens"],
  startTileId: number,
  startX: number,
  startY: number,
): Array<{ id: string; tileId: number; x: number; y: number }> {
  const connected: Array<{ id: string; tileId: number; x: number; y: number }> = [];
  const visited = new Set<string>();
  const queue: Array<{ tileId: number; x: number; y: number }> = [{ tileId: startTileId, x: startX, y: startY }];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentGlobal = localToGlobal(current.tileId, current.x, current.y);
    const key = `${currentGlobal.globalX},${currentGlobal.globalY}`;

    if (visited.has(key)) continue;
    visited.add(key);

    // Find the fire at this position
    const fire = fireTokens.find((f) => f.tileId === current.tileId && f.x === current.x && f.y === current.y);
    if (!fire) continue;

    connected.push(fire);

    // Check all adjacent positions for more fires
    const adjacentCoords = getAdjacentGlobalCoordinates(currentGlobal.globalX, currentGlobal.globalY);
    for (const adj of adjacentCoords) {
      const adjKey = `${adj.globalX},${adj.globalY}`;
      if (visited.has(adjKey)) continue;

      // Find any fire at this adjacent global position
      const adjFire = fireTokens.find((f) => {
        const fGlobal = localToGlobal(f.tileId, f.x, f.y);
        return fGlobal.globalX === adj.globalX && fGlobal.globalY === adj.globalY;
      });

      if (adjFire) {
        queue.push({ tileId: adjFire.tileId, x: adjFire.x, y: adjFire.y });
      }
    }
  }

  return connected;
}

export function hasScientistOnFire(state: GameState): boolean {
  if (state.fireTokens.length === 0) return false;
  return Object.values(state.scientists).some(
    (scientist) =>
      scientist.position &&
      state.fireTokens.some(
        (fire) =>
          fire.tileId === scientist.position!.tileId &&
          fire.x === scientist.position!.x &&
          fire.y === scientist.position!.y,
      ),
  );
}
