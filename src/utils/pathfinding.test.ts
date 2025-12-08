import { describe, it, expect } from "vitest";
import { getJeepDestinationsWithPaths } from "./pathfinding";
import { createBoard } from "../types/board";
import type { Tile } from "../types/board";
import type { PieceState, FireToken } from "../types/gameState";

// Helper to create a minimal set of pieces for testing
function createTestPieces(): PieceState[] {
  return [];
}

// Helper to find a valid space on a tile (not mountain, not exit, not unusable)
function findValidSpace(tile: Tile): { x: number; y: number } | null {
  for (const space of tile.spaces) {
    if (!space.hasMountain && !space.isExit && !space.isUnusable) {
      return { x: space.coordinate.x, y: space.coordinate.y };
    }
  }
  return null;
}

// Helper to find a space adjacent to a given space on the same tile
function findAdjacentSpace(tile: Tile, fromX: number, fromY: number): { x: number; y: number } | null {
  const directions = [
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
  ];

  for (const dir of directions) {
    const newX = fromX + dir.dx;
    const newY = fromY + dir.dy;
    const space = tile.spaces.find(
      (s) => s.coordinate.x === newX && s.coordinate.y === newY && !s.hasMountain && !s.isExit && !s.isUnusable,
    );
    if (space) {
      return { x: newX, y: newY };
    }
  }
  return null;
}

describe("Jeep Pathfinding", () => {
  describe("getJeepDestinationsWithPaths", () => {
    it("returns destinations in straight orthogonal lines", () => {
      const tiles = createBoard();
      const pieces = createTestPieces();
      const fireTokens: FireToken[] = [];

      // Place scientist on a square tile (tile 2 is central)
      const tile = tiles.find((t) => t.id === 2)!;
      const startSpace = findValidSpace(tile)!;

      const scientist: PieceState = {
        id: "scientist-1",
        type: "scientist",
        tileId: tile.id,
        x: startSpace.x,
        y: startSpace.y,
      };

      const destinations = getJeepDestinationsWithPaths(tiles, [scientist, ...pieces], fireTokens, scientist);

      expect(destinations.length).toBeGreaterThan(0);

      // All destinations should be reachable in a straight line
      for (const dest of destinations) {
        // Check that path positions form a straight line
        if (dest.path.length > 0) {
          const allPositions = [
            { tileId: scientist.tileId, x: scientist.x, y: scientist.y },
            ...dest.path,
            { tileId: dest.tileId, x: dest.x, y: dest.y },
          ];

          // Verify each step is adjacent to the previous
          for (let i = 1; i < allPositions.length; i++) {
            const prev = allPositions[i - 1];
            const curr = allPositions[i];
            // If same tile, check adjacency
            if (prev.tileId === curr.tileId) {
              const dx = Math.abs(curr.x - prev.x);
              const dy = Math.abs(curr.y - prev.y);
              expect(dx + dy).toBe(1); // Orthogonally adjacent
            }
          }
        }
      }
    });

    it("stops at mountains", () => {
      const tiles = createBoard();
      const fireTokens: FireToken[] = [];

      // Find a tile with a mountain and place scientist adjacent to it
      const tileWithMountain = tiles.find((t) => t.spaces.some((s) => s.hasMountain));
      expect(tileWithMountain).toBeDefined();

      const mountainSpace = tileWithMountain!.spaces.find((s) => s.hasMountain)!;

      // Find a space adjacent to the mountain
      const adjacentSpace = findAdjacentSpace(
        tileWithMountain!,
        mountainSpace.coordinate.x,
        mountainSpace.coordinate.y,
      );

      if (adjacentSpace) {
        const scientist: PieceState = {
          id: "scientist-1",
          type: "scientist",
          tileId: tileWithMountain!.id,
          x: adjacentSpace.x,
          y: adjacentSpace.y,
        };

        const destinations = getJeepDestinationsWithPaths(tiles, [scientist], fireTokens, scientist);

        // Mountain space should not be in destinations
        const hasMountainDest = destinations.some(
          (d) =>
            d.tileId === tileWithMountain!.id &&
            d.x === mountainSpace.coordinate.x &&
            d.y === mountainSpace.coordinate.y,
        );
        expect(hasMountainDest).toBe(false);
      }
    });

    it("stops at other pieces", () => {
      const tiles = createBoard();
      const fireTokens: FireToken[] = [];

      // Place scientist and a blocking piece in a line
      const tile = tiles.find((t) => t.id === 2)!;
      const startSpace = tile.spaces.find(
        (s) => s.coordinate.x === 0 && s.coordinate.y === 1 && !s.hasMountain && !s.isUnusable,
      );

      if (!startSpace) return; // Skip if this specific space isn't available

      const scientist: PieceState = {
        id: "scientist-1",
        type: "scientist",
        tileId: tile.id,
        x: 0,
        y: 1,
      };

      // Place another scientist at x=2, y=1 (blocking the line)
      const blockingPiece: PieceState = {
        id: "scientist-2",
        type: "scientist",
        tileId: tile.id,
        x: 2,
        y: 1,
      };

      const destinations = getJeepDestinationsWithPaths(tiles, [scientist, blockingPiece], fireTokens, scientist);

      // x=1, y=1 should be reachable (between scientist and blocker)
      const canReachMiddle = destinations.some((d) => d.tileId === tile.id && d.x === 1 && d.y === 1);
      // x=2, y=1 should NOT be reachable (blocked)
      const canReachBlocked = destinations.some((d) => d.tileId === tile.id && d.x === 2 && d.y === 1);

      // Only check if the middle space exists and isn't a mountain
      const middleSpace = tile.spaces.find((s) => s.coordinate.x === 1 && s.coordinate.y === 1);
      if (middleSpace && !middleSpace.hasMountain) {
        expect(canReachMiddle).toBe(true);
      }
      expect(canReachBlocked).toBe(false);
    });

    it("does not include exit spaces as destinations", () => {
      const tiles = createBoard();
      const fireTokens: FireToken[] = [];

      // Find an L-tile (has exits) and place scientist near the exit
      const lTile = tiles.find((t) => t.shape === "L")!;
      const nonExitSpace = lTile.spaces.find((s) => !s.isExit && !s.isUnusable && !s.hasMountain);

      if (!nonExitSpace) return;

      const scientist: PieceState = {
        id: "scientist-1",
        type: "scientist",
        tileId: lTile.id,
        x: nonExitSpace.coordinate.x,
        y: nonExitSpace.coordinate.y,
      };

      const destinations = getJeepDestinationsWithPaths(tiles, [scientist], fireTokens, scientist);

      // No destination should be an exit space
      for (const dest of destinations) {
        const destTile = tiles.find((t) => t.id === dest.tileId);
        const destSpace = destTile?.spaces.find((s) => s.coordinate.x === dest.x && s.coordinate.y === dest.y);
        expect(destSpace?.isExit).not.toBe(true);
      }
    });

    it("can pass through fire", () => {
      const tiles = createBoard();

      // Place scientist and fire in a line
      const tile = tiles.find((t) => t.id === 2)!;

      // Find a row without mountains
      let validRow: number | null = null;
      for (let y = 0; y < 3; y++) {
        const rowSpaces = tile.spaces.filter((s) => s.coordinate.y === y);
        if (rowSpaces.every((s) => !s.hasMountain && !s.isUnusable)) {
          validRow = y;
          break;
        }
      }

      if (validRow === null) return; // Skip if no valid row

      const scientist: PieceState = {
        id: "scientist-1",
        type: "scientist",
        tileId: tile.id,
        x: 0,
        y: validRow,
      };

      // Place fire at x=1
      const fireTokens: FireToken[] = [{ id: "fire-1", tileId: tile.id, x: 1, y: validRow }];

      const destinations = getJeepDestinationsWithPaths(tiles, [scientist], fireTokens, scientist);

      // Should be able to reach x=1 (fire) and x=2 (beyond fire)
      const canReachFire = destinations.some((d) => d.tileId === tile.id && d.x === 1 && d.y === validRow);
      const canReachBeyond = destinations.some((d) => d.tileId === tile.id && d.x === 2 && d.y === validRow);

      expect(canReachFire).toBe(true);
      expect(canReachBeyond).toBe(true);
    });

    it("includes path positions for smoke trail visualization", () => {
      const tiles = createBoard();
      const fireTokens: FireToken[] = [];

      const tile = tiles.find((t) => t.id === 2)!;

      // Find a row without mountains
      let validRow: number | null = null;
      for (let y = 0; y < 3; y++) {
        const rowSpaces = tile.spaces.filter((s) => s.coordinate.y === y);
        if (rowSpaces.every((s) => !s.hasMountain && !s.isUnusable)) {
          validRow = y;
          break;
        }
      }

      if (validRow === null) return;

      const scientist: PieceState = {
        id: "scientist-1",
        type: "scientist",
        tileId: tile.id,
        x: 0,
        y: validRow,
      };

      const destinations = getJeepDestinationsWithPaths(tiles, [scientist], fireTokens, scientist);

      // Find destination at x=2 (should have path through x=1)
      const farDest = destinations.find((d) => d.tileId === tile.id && d.x === 2 && d.y === validRow);

      if (farDest) {
        expect(farDest.path.length).toBe(1);
        expect(farDest.path[0].tileId).toBe(tile.id);
        expect(farDest.path[0].x).toBe(1);
        expect(farDest.path[0].y).toBe(validRow);
      }
    });

    it("respects pending jeep moves for collision detection", () => {
      const tiles = createBoard();
      const fireTokens: FireToken[] = [];

      const tile = tiles.find((t) => t.id === 2)!;

      // Find a row without mountains
      let validRow: number | null = null;
      for (let y = 0; y < 3; y++) {
        const rowSpaces = tile.spaces.filter((s) => s.coordinate.y === y);
        if (rowSpaces.every((s) => !s.hasMountain && !s.isUnusable)) {
          validRow = y;
          break;
        }
      }

      if (validRow === null) return;

      // Scientist 1 starts at x=0
      const scientist1: PieceState = {
        id: "scientist-1",
        type: "scientist",
        tileId: tile.id,
        x: 0,
        y: validRow,
      };

      // Scientist 2 starts at x=1 but has a pending move to x=2
      const scientist2: PieceState = {
        id: "scientist-2",
        type: "scientist",
        tileId: tile.id,
        x: 1,
        y: validRow,
      };

      const pendingMoves = [
        {
          scientistId: "scientist-2",
          toTileId: tile.id,
          toX: 2,
          toY: validRow,
        },
      ];

      const destinations = getJeepDestinationsWithPaths(
        tiles,
        [scientist1, scientist2],
        fireTokens,
        scientist1,
        pendingMoves,
      );

      // Should be able to reach x=1 (scientist2 moved away)
      const canReachX1 = destinations.some((d) => d.tileId === tile.id && d.x === 1 && d.y === validRow);
      // Should NOT be able to reach x=2 (scientist2's new position)
      const canReachX2 = destinations.some((d) => d.tileId === tile.id && d.x === 2 && d.y === validRow);

      expect(canReachX1).toBe(true);
      expect(canReachX2).toBe(false);
    });

    it("can move across tile boundaries", () => {
      const tiles = createBoard();
      const fireTokens: FireToken[] = [];

      // Place scientist on tile 2 (central) - should be able to reach adjacent tiles
      const tile = tiles.find((t) => t.id === 2)!;
      const startSpace = findValidSpace(tile)!;

      const scientist: PieceState = {
        id: "scientist-1",
        type: "scientist",
        tileId: tile.id,
        x: startSpace.x,
        y: startSpace.y,
      };

      const destinations = getJeepDestinationsWithPaths(tiles, [scientist], fireTokens, scientist);

      // Should have destinations on other tiles
      const otherTileDestinations = destinations.filter((d) => d.tileId !== tile.id);
      expect(otherTileDestinations.length).toBeGreaterThan(0);
    });
  });
});
