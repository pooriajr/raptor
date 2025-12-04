import { describe, it, expect } from "vitest";
import {
  getTileOffset,
  localToGlobal,
  globalToLocal,
  getAdjacentGlobalCoordinates,
} from "./coordinates";
import { createBoard } from "./board";

describe("Coordinate System", () => {
  describe("getTileOffset", () => {
    it("returns correct offset for L-tile 0 (top-left)", () => {
      const offset = getTileOffset(0);
      expect(offset).toEqual({ offsetX: 0, offsetY: 0 });
    });

    it("returns correct offset for square tile 1", () => {
      const offset = getTileOffset(1);
      expect(offset).toEqual({ offsetX: 2, offsetY: 0 });
    });

    it("returns correct offset for square tile 2", () => {
      const offset = getTileOffset(2);
      expect(offset).toEqual({ offsetX: 5, offsetY: 0 });
    });

    it("returns correct offset for square tile 3", () => {
      const offset = getTileOffset(3);
      expect(offset).toEqual({ offsetX: 8, offsetY: 0 });
    });

    it("returns correct offset for L-tile 4 (top-right)", () => {
      const offset = getTileOffset(4);
      expect(offset).toEqual({ offsetX: 11, offsetY: 0 });
    });

    it("returns correct offset for L-tile 5 (bottom-left)", () => {
      const offset = getTileOffset(5);
      expect(offset).toEqual({ offsetX: 0, offsetY: 3 });
    });

    it("returns correct offset for square tile 6", () => {
      const offset = getTileOffset(6);
      expect(offset).toEqual({ offsetX: 2, offsetY: 3 });
    });

    it("returns correct offset for L-tile 9 (bottom-right)", () => {
      const offset = getTileOffset(9);
      expect(offset).toEqual({ offsetX: 11, offsetY: 3 });
    });
  });

  describe("localToGlobal", () => {
    it("converts L-tile 0 local (0,0) to global", () => {
      const global = localToGlobal(0, 0, 0);
      expect(global).toEqual({ globalX: 0, globalY: 0 });
    });

    it("converts L-tile 0 local (1,2) to global", () => {
      const global = localToGlobal(0, 1, 2);
      expect(global).toEqual({ globalX: 1, globalY: 2 });
    });

    it("converts square tile 1 local (0,0) to global", () => {
      const global = localToGlobal(1, 0, 0);
      expect(global).toEqual({ globalX: 2, globalY: 0 });
    });

    it("converts square tile 1 local (2,2) to global", () => {
      const global = localToGlobal(1, 2, 2);
      expect(global).toEqual({ globalX: 4, globalY: 2 });
    });

    it("converts square tile 6 (bottom row) local (1,1) to global", () => {
      const global = localToGlobal(6, 1, 1);
      expect(global).toEqual({ globalX: 3, globalY: 4 });
    });
  });

  describe("globalToLocal", () => {
    it("converts global coordinate on L-tile 0 to correct local coordinate", () => {
      const tiles = createBoard();
      const tile0 = tiles.find((t) => t.id === 0)!;

      // Find a usable space on L-tile 0 (not unusable, not exit)
      const usableSpace = tile0.spaces.find((s) => !s.isUnusable && !s.isExit)!;

      const global = localToGlobal(
        0,
        usableSpace.coordinate.x,
        usableSpace.coordinate.y,
      );
      const local = globalToLocal(tiles, global.globalX, global.globalY);

      expect(local).not.toBeNull();
      expect(local?.tileId).toBe(0);
      expect(local?.localX).toBe(usableSpace.coordinate.x);
      expect(local?.localY).toBe(usableSpace.coordinate.y);
    });

    it("converts global (2,0) to square tile 1 local (0,0)", () => {
      const tiles = createBoard();
      const local = globalToLocal(tiles, 2, 0);
      expect(local).not.toBeNull();
      expect(local?.tileId).toBe(1);
      expect(local?.localX).toBe(0);
      expect(local?.localY).toBe(0);
    });

    it("converts global (4,2) to square tile 1 local (2,2)", () => {
      const tiles = createBoard();
      const local = globalToLocal(tiles, 4, 2);
      expect(local).not.toBeNull();
      expect(local?.tileId).toBe(1);
      expect(local?.localX).toBe(2);
      expect(local?.localY).toBe(2);
    });

    it("returns null for out-of-bounds coordinates", () => {
      const tiles = createBoard();
      const local = globalToLocal(tiles, 100, 100);
      expect(local).toBeNull();
    });

    it("returns null for unusable L-tile spaces", () => {
      const tiles = createBoard();
      // L-tile 0 has unusable spaces in one column
      // Try to convert a coordinate that would be unusable
      const tile0 = tiles[0];
      const unusableSpace = tile0.spaces.find((s) => s.isUnusable);
      if (unusableSpace) {
        const global = localToGlobal(
          0,
          unusableSpace.coordinate.x,
          unusableSpace.coordinate.y,
        );
        const local = globalToLocal(tiles, global.globalX, global.globalY);
        expect(local).toBeNull();
      }
    });
  });

  describe("getAdjacentGlobalCoordinates", () => {
    it("returns 4 adjacent coordinates (up, down, left, right)", () => {
      const adjacent = getAdjacentGlobalCoordinates(5, 5);
      expect(adjacent).toHaveLength(4);
      expect(adjacent).toContainEqual({ globalX: 5, globalY: 4 }); // Up
      expect(adjacent).toContainEqual({ globalX: 5, globalY: 6 }); // Down
      expect(adjacent).toContainEqual({ globalX: 4, globalY: 5 }); // Left
      expect(adjacent).toContainEqual({ globalX: 6, globalY: 5 }); // Right
    });

    it("handles edge coordinates", () => {
      const adjacent = getAdjacentGlobalCoordinates(0, 0);
      expect(adjacent).toHaveLength(4);
      expect(adjacent).toContainEqual({ globalX: 0, globalY: -1 }); // Up (negative)
      expect(adjacent).toContainEqual({ globalX: 0, globalY: 1 }); // Down
      expect(adjacent).toContainEqual({ globalX: -1, globalY: 0 }); // Left (negative)
      expect(adjacent).toContainEqual({ globalX: 1, globalY: 0 }); // Right
    });
  });

  describe("cross-tile adjacency", () => {
    it("detects adjacency between L-tile 0 and square tile 1", () => {
      const tiles = createBoard();

      // L-tile 0 rightmost column is at localX=1, which is globalX=1
      // Square tile 1 leftmost column is at localX=0, which is globalX=2
      // They should be adjacent

      const fromGlobal = localToGlobal(0, 1, 1); // L-tile 0, right edge
      const adjacent = getAdjacentGlobalCoordinates(
        fromGlobal.globalX,
        fromGlobal.globalY,
      );

      const rightNeighbor = adjacent.find(
        (a) => a.globalX === fromGlobal.globalX + 1,
      );
      expect(rightNeighbor).toBeDefined();

      const local = globalToLocal(
        tiles,
        rightNeighbor!.globalX,
        rightNeighbor!.globalY,
      );
      expect(local).not.toBeNull();
      expect(local?.tileId).toBe(1); // Should be on square tile 1
    });

    it("detects adjacency between top and bottom rows", () => {
      const tiles = createBoard();

      // Square tile 1 bottom edge (localY=2, globalY=2)
      // Square tile 6 top edge (localY=0, globalY=3)
      // They should be adjacent

      const fromGlobal = localToGlobal(1, 1, 2); // Tile 1, bottom edge
      const adjacent = getAdjacentGlobalCoordinates(
        fromGlobal.globalX,
        fromGlobal.globalY,
      );

      const bottomNeighbor = adjacent.find(
        (a) => a.globalY === fromGlobal.globalY + 1,
      );
      expect(bottomNeighbor).toBeDefined();

      const local = globalToLocal(
        tiles,
        bottomNeighbor!.globalX,
        bottomNeighbor!.globalY,
      );
      expect(local).not.toBeNull();
      expect(local?.tileId).toBe(6); // Should be on tile 6 (bottom row)
    });
  });
});
