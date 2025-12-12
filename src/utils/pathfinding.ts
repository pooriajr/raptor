import type { Tile } from "../types/board.ts";
import type { BoardPosition, FireToken, BabyState, MotherState } from "../types/gameState.ts";
import { localToGlobal, globalToLocal, getAdjacentGlobalCoordinates } from "../types/coordinates.ts";

interface Position {
  tileId: number;
  x: number;
  y: number;
}

/**
 * Check if a position is blocked (has mountain, fire, or piece)
 */
function isBlocked(tiles: Tile[], pieces: BoardPosition[], tileId: number, x: number, y: number): boolean {
  const tile = tiles.find((t) => t.id === tileId);
  if (!tile) return true;

  const space = tile.spaces.find((s) => s.coordinate.x === x && s.coordinate.y === y);
  if (!space) return true;
  if (space.isUnusable || space.hasMountain) return true;

  // Check for pieces (any piece blocks movement)
  const hasPiece = pieces.some((p) => p.tileId === tileId && p.x === x && p.y === y);
  if (hasPiece) return true;

  return false;
}

/**
 * Check if a position is a valid destination (exists, not blocked, not an exit)
 */
function isValidDestination(tiles: Tile[], pieces: BoardPosition[], tileId: number, x: number, y: number): boolean {
  const tile = tiles.find((t) => t.id === tileId);
  if (!tile) return false;

  const space = tile.spaces.find((s) => s.coordinate.x === x && s.coordinate.y === y);
  if (!space) return false;
  if (space.isUnusable || space.hasMountain || space.isExit) return false;

  // Check for pieces
  const hasPiece = pieces.some((p) => p.tileId === tileId && p.x === x && p.y === y);
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
  pieces: BoardPosition[],
  start: Position,
  targets: Position[],
): Position[] {
  return findReachablePositionsWithPaths(tiles, pieces, start, targets).map((r) => r.position);
}

/**
 * BFS to find paths from start to any of the target positions.
 * Returns the list of reachable targets with the path to each.
 */
export function findReachablePositionsWithPaths(
  tiles: Tile[],
  pieces: BoardPosition[],
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
    const neighbors = getAdjacentGlobalCoordinates(current.globalX, current.globalY);

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
      const newPath = [...current.path, { globalX: current.globalX, globalY: current.globalY }];
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
  pieces: BoardPosition[],
  baby: BabyState,
  mother: MotherState,
): boolean {
  if (!baby.position || !mother.position) return false;

  // Find all valid destination spaces on mother's tile
  const motherTile = tiles.find((t) => t.id === mother.position!.tileId);
  if (!motherTile) return false;

  // Filter pieces to exclude the baby we're checking (it can move from its spot)
  const otherPieces = pieces.filter((p) => p.id !== baby.id);

  const destinations: Position[] = [];
  for (const space of motherTile.spaces) {
    if (isValidDestination(tiles, otherPieces, motherTile.id, space.coordinate.x, space.coordinate.y)) {
      destinations.push({
        tileId: motherTile.id,
        x: space.coordinate.x,
        y: space.coordinate.y,
      });
    }
  }

  if (destinations.length === 0) return false;

  // Check if baby can reach any of these destinations
  const start: Position = {
    tileId: baby.position.tileId,
    x: baby.position.x,
    y: baby.position.y,
  };
  const reachable = findReachablePositions(tiles, otherPieces, start, destinations);

  return reachable.length > 0;
}

/**
 * Get all valid destination spaces on mother's tile that a baby can reach.
 */
export function getReachableDestinationsOnMotherTile(
  tiles: Tile[],
  pieces: BoardPosition[],
  baby: BabyState,
  mother: MotherState,
): Position[] {
  return getReachableDestinationsOnMotherTileWithPaths(tiles, pieces, baby, mother).map((r) => r.position);
}

/**
 * Get all valid destination spaces on mother's tile that a baby can reach,
 * including the path to each destination.
 */
export function getReachableDestinationsOnMotherTileWithPaths(
  tiles: Tile[],
  pieces: BoardPosition[],
  baby: BabyState,
  mother: MotherState,
): PathResult[] {
  if (!baby.position || !mother.position) return [];

  const motherTile = tiles.find((t) => t.id === mother.position!.tileId);
  if (!motherTile) return [];

  // Filter pieces to exclude the baby we're moving
  const otherPieces = pieces.filter((p) => p.id !== baby.id);

  const destinations: Position[] = [];
  for (const space of motherTile.spaces) {
    if (isValidDestination(tiles, otherPieces, motherTile.id, space.coordinate.x, space.coordinate.y)) {
      destinations.push({
        tileId: motherTile.id,
        x: space.coordinate.x,
        y: space.coordinate.y,
      });
    }
  }

  const start: Position = {
    tileId: baby.position.tileId,
    x: baby.position.x,
    y: baby.position.y,
  };
  return findReachablePositionsWithPaths(tiles, otherPieces, start, destinations);
}

export interface JeepDestination {
  tileId: number;
  x: number;
  y: number;
  path: Position[]; // Intermediate positions (for smoke trail, excludes start and destination)
}

/**
 * Get all valid jeep destinations for a scientist.
 * Jeep moves in straight orthogonal lines, can pass through fire (extinguishing it),
 * but stops at mountains, other pieces, or board edges.
 * Returns destinations with the path (intermediate positions) to each.
 */
export function getJeepDestinationsWithPaths(
  tiles: Tile[],
  pieces: BoardPosition[],
  _fireTokens: FireToken[],
  scientistId: string,
  scientistPos: { tileId: number; x: number; y: number },
  pendingJeepMoves: Array<{
    scientistId: string;
    toTileId: number;
    toX: number;
    toY: number;
  }> = [],
): JeepDestination[] {
  const destinations: JeepDestination[] = [];

  // Build a map of effective piece positions considering pending jeep moves
  // Scientists with pending moves are at their final pending destination, not original position
  const effectivePiecePositions: BoardPosition[] = pieces.map((p) => {
    // Find the last pending move for this piece
    const movesForThis = pendingJeepMoves.filter((m) => m.scientistId === p.id);
    if (movesForThis.length > 0) {
      const lastMove = movesForThis[movesForThis.length - 1];
      return {
        id: p.id,
        tileId: lastMove.toTileId,
        x: lastMove.toX,
        y: lastMove.toY,
      };
    }
    return p;
  });

  // Convert scientist position to global coordinates
  const startGlobal = localToGlobal(scientistPos.tileId, scientistPos.x, scientistPos.y);

  // Four orthogonal directions
  const directions = [
    { dx: 0, dy: -1 }, // Up
    { dx: 0, dy: 1 }, // Down
    { dx: -1, dy: 0 }, // Left
    { dx: 1, dy: 0 }, // Right
  ];

  for (const dir of directions) {
    const pathPositions: Position[] = [];
    let distance = 1;

    while (true) {
      const targetGlobalX = startGlobal.globalX + dir.dx * distance;
      const targetGlobalY = startGlobal.globalY + dir.dy * distance;

      // Convert to local coordinates
      const local = globalToLocal(tiles, targetGlobalX, targetGlobalY);
      if (!local) break; // Off the board

      const tile = tiles.find((t) => t.id === local.tileId);
      if (!tile) break;

      const space = tile.spaces.find((s) => s.coordinate.x === local.localX && s.coordinate.y === local.localY);
      if (!space) break;

      // Stop if mountain, unusable, or exit (jeeps can't enter exits)
      if (space.hasMountain || space.isUnusable || space.isExit) break;

      // Stop if another piece is there (not the scientist itself)
      // Use effective positions that account for pending jeep moves
      const isOccupied = effectivePiecePositions.some(
        (p) => p.id !== scientistId && p.tileId === local.tileId && p.x === local.localX && p.y === local.localY,
      );
      if (isOccupied) break;

      // This is a valid destination (jeep can pass through fire)
      // Note: fire at destination is also valid - jeep will extinguish it
      destinations.push({
        tileId: local.tileId,
        x: local.localX,
        y: local.localY,
        path: [...pathPositions], // Copy the path so far (excludes this destination)
      });

      // Add this position to the path for subsequent destinations
      pathPositions.push({
        tileId: local.tileId,
        x: local.localX,
        y: local.localY,
      });

      distance++;
    }
  }

  return destinations;
}
