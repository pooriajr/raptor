import type { Tile } from "../types/board.ts";
import type { PieceState } from "../types/gameState.ts";
import {
  localToGlobal,
  globalToLocal,
  getAdjacentGlobalCoordinates,
} from "../types/coordinates.ts";

interface Position {
  tileId: number;
  x: number;
  y: number;
}

/**
 * Check if a position is blocked (has mountain, fire, or piece)
 */
function isBlocked(
  tiles: Tile[],
  pieces: PieceState[],
  tileId: number,
  x: number,
  y: number,
): boolean {
  const tile = tiles.find((t) => t.id === tileId);
  if (!tile) return true;

  const space = tile.spaces.find(
    (s) => s.coordinate.x === x && s.coordinate.y === y,
  );
  if (!space) return true;
  if (space.isUnusable || space.hasMountain) return true;

  // Check for pieces (any piece blocks movement)
  const hasPiece = pieces.some(
    (p) => p.tileId === tileId && p.x === x && p.y === y,
  );
  if (hasPiece) return true;

  return false;
}

/**
 * Check if a position is a valid destination (exists, not blocked, not an exit)
 */
function isValidDestination(
  tiles: Tile[],
  pieces: PieceState[],
  tileId: number,
  x: number,
  y: number,
): boolean {
  const tile = tiles.find((t) => t.id === tileId);
  if (!tile) return false;

  const space = tile.spaces.find(
    (s) => s.coordinate.x === x && s.coordinate.y === y,
  );
  if (!space) return false;
  if (space.isUnusable || space.hasMountain || space.isExit) return false;

  // Check for pieces
  const hasPiece = pieces.some(
    (p) => p.tileId === tileId && p.x === x && p.y === y,
  );
  if (hasPiece) return false;

  return true;
}

export interface PathResult {
  position: Position;
  path: Position[]; // Intermediate positions (excludes start and end)
}

export type { Position };

/**
 * BFS to find if there's a path from start to any of the target positions.
 * Returns the list of reachable target positions.
 */
export function findReachablePositions(
  tiles: Tile[],
  pieces: PieceState[],
  start: Position,
  targets: Position[],
): Position[] {
  return findReachablePositionsWithPaths(tiles, pieces, start, targets).map(
    (r) => r.position,
  );
}

/**
 * BFS to find paths from start to any of the target positions.
 * Returns the list of reachable targets with the path to each.
 */
export function findReachablePositionsWithPaths(
  tiles: Tile[],
  pieces: PieceState[],
  start: Position,
  targets: Position[],
): PathResult[] {
  if (targets.length === 0) return [];

  // Convert start to global coords
  const startGlobal = localToGlobal(start.tileId, start.x, start.y);

  // Convert targets to global coords for quick lookup
  const targetSet = new Set(
    targets.map((t) => {
      const g = localToGlobal(t.tileId, t.x, t.y);
      return `${g.globalX},${g.globalY}`;
    }),
  );

  // BFS with path tracking
  const visited = new Set<string>();
  const queue: Array<{
    globalX: number;
    globalY: number;
    path: Array<{ globalX: number; globalY: number }>;
  }> = [{ ...startGlobal, path: [] }];
  visited.add(`${startGlobal.globalX},${startGlobal.globalY}`);

  const reachableTargets: PathResult[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const key = `${current.globalX},${current.globalY}`;

    // Check if this is a target
    if (targetSet.has(key)) {
      const local = globalToLocal(tiles, current.globalX, current.globalY);
      if (local) {
        // Convert path from global to local coords (excludes start and end)
        const localPath: Position[] = current.path
          .map((p) => globalToLocal(tiles, p.globalX, p.globalY))
          .filter((p): p is NonNullable<typeof p> => p !== null)
          .map((p) => ({ tileId: p.tileId, x: p.localX, y: p.localY }));

        reachableTargets.push({
          position: {
            tileId: local.tileId,
            x: local.localX,
            y: local.localY,
          },
          path: localPath,
        });
      }
    }

    // Explore neighbors
    const neighbors = getAdjacentGlobalCoordinates(
      current.globalX,
      current.globalY,
    );

    for (const neighbor of neighbors) {
      const neighborKey = `${neighbor.globalX},${neighbor.globalY}`;
      if (visited.has(neighborKey)) continue;
      visited.add(neighborKey);

      // Convert to local to check if valid
      const local = globalToLocal(tiles, neighbor.globalX, neighbor.globalY);
      if (!local) continue;

      // Check if blocked (for traversal, we can pass through but not stop on blocked)
      // Actually for pathfinding, we can't pass through blocked spaces
      if (isBlocked(tiles, pieces, local.tileId, local.localX, local.localY)) {
        // But we might still be able to reach this as a destination if it's a target
        // and empty (the piece itself doesn't block its own destination)
        continue;
      }

      // Add current position to path (not the neighbor, as that might be the destination)
      const newPath = [
        ...current.path,
        { globalX: current.globalX, globalY: current.globalY },
      ];
      queue.push({ ...neighbor, path: newPath });
    }
  }

  return reachableTargets;
}

/**
 * Check if a baby raptor can reach any empty space on the mother's tile.
 * The baby itself is excluded from the "pieces" blocking check at its own position.
 */
export function canBabyReachMotherTile(
  tiles: Tile[],
  pieces: PieceState[],
  baby: PieceState,
  mother: PieceState,
): boolean {
  // Find all valid destination spaces on mother's tile
  const motherTile = tiles.find((t) => t.id === mother.tileId);
  if (!motherTile) return false;

  // Filter pieces to exclude the baby we're checking (it can move from its spot)
  const otherPieces = pieces.filter((p) => p.id !== baby.id);

  const destinations: Position[] = [];
  for (const space of motherTile.spaces) {
    if (
      isValidDestination(
        tiles,
        otherPieces,
        motherTile.id,
        space.coordinate.x,
        space.coordinate.y,
      )
    ) {
      destinations.push({
        tileId: motherTile.id,
        x: space.coordinate.x,
        y: space.coordinate.y,
      });
    }
  }

  if (destinations.length === 0) return false;

  // Check if baby can reach any of these destinations
  const start: Position = { tileId: baby.tileId, x: baby.x, y: baby.y };
  const reachable = findReachablePositions(
    tiles,
    otherPieces,
    start,
    destinations,
  );

  return reachable.length > 0;
}

/**
 * Get all valid destination spaces on mother's tile that a baby can reach.
 */
export function getReachableDestinationsOnMotherTile(
  tiles: Tile[],
  pieces: PieceState[],
  baby: PieceState,
  mother: PieceState,
): Position[] {
  return getReachableDestinationsOnMotherTileWithPaths(
    tiles,
    pieces,
    baby,
    mother,
  ).map((r) => r.position);
}

/**
 * Get all valid destination spaces on mother's tile that a baby can reach,
 * including the path to each destination.
 */
export function getReachableDestinationsOnMotherTileWithPaths(
  tiles: Tile[],
  pieces: PieceState[],
  baby: PieceState,
  mother: PieceState,
): PathResult[] {
  const motherTile = tiles.find((t) => t.id === mother.tileId);
  if (!motherTile) return [];

  // Filter pieces to exclude the baby we're moving
  const otherPieces = pieces.filter((p) => p.id !== baby.id);

  const destinations: Position[] = [];
  for (const space of motherTile.spaces) {
    if (
      isValidDestination(
        tiles,
        otherPieces,
        motherTile.id,
        space.coordinate.x,
        space.coordinate.y,
      )
    ) {
      destinations.push({
        tileId: motherTile.id,
        x: space.coordinate.x,
        y: space.coordinate.y,
      });
    }
  }

  const start: Position = { tileId: baby.tileId, x: baby.x, y: baby.y };
  return findReachablePositionsWithPaths(
    tiles,
    otherPieces,
    start,
    destinations,
  );
}
