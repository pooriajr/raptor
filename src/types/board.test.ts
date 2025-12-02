import { describe, it, expect } from "vitest";
import {
  createBoard,
  createLShapedTile,
  createSquareTile,
  addPiece,
} from "./board";

describe("Board Generation", () => {
  describe("createSquareTile", () => {
    it("creates a 3x3 grid of spaces", () => {
      const tile = createSquareTile(1);
      expect(tile.spaces).toHaveLength(9);
      expect(tile.shape).toBe("square");
      expect(tile.id).toBe(1);
    });

    it("creates spaces with correct coordinates", () => {
      const tile = createSquareTile(1);
      // Check that all 9 positions exist
      const coords = tile.spaces.map(
        (s) => `${s.coordinate.x},${s.coordinate.y}`,
      );
      expect(coords).toContain("0,0");
      expect(coords).toContain("0,1");
      expect(coords).toContain("0,2");
      expect(coords).toContain("1,0");
      expect(coords).toContain("1,1");
      expect(coords).toContain("1,2");
      expect(coords).toContain("2,0");
      expect(coords).toContain("2,1");
      expect(coords).toContain("2,2");
    });

    it("creates all spaces as usable (no exits or unusable)", () => {
      const tile = createSquareTile(1);
      tile.spaces.forEach((space) => {
        expect(space.isExit).toBe(false);
        expect(space.isUnusable).toBe(false);
      });
    });

    it("creates tile without mountains when no pattern provided", () => {
      const tile = createSquareTile(1);
      const mountainsCount = tile.spaces.filter((s) => s.hasMountain).length;
      expect(mountainsCount).toBe(0);
    });

    it("places mountains according to pattern", () => {
      const pattern = [
        { x: 0, y: 0 },
        { x: 2, y: 2 },
      ];
      const tile = createSquareTile(1, pattern);
      const mountainsCount = tile.spaces.filter((s) => s.hasMountain).length;
      expect(mountainsCount).toBe(2);

      const mountainSpace1 = tile.spaces.find(
        (s) => s.coordinate.x === 0 && s.coordinate.y === 0,
      );
      const mountainSpace2 = tile.spaces.find(
        (s) => s.coordinate.x === 2 && s.coordinate.y === 2,
      );
      expect(mountainSpace1?.hasMountain).toBe(true);
      expect(mountainSpace2?.hasMountain).toBe(true);
    });
  });

  describe("createLShapedTile", () => {
    it("creates 6 spaces (3x2 grid)", () => {
      const tile = createLShapedTile(0, "left", "top");
      expect(tile.spaces).toHaveLength(6);
      expect(tile.shape).toBe("L");
    });

    it("left side with exit at top has correct structure", () => {
      const tile = createLShapedTile(0, "left", "top");

      // Should have exit at (0,0)
      const exitSpace = tile.spaces.find((s) => s.isExit);
      expect(exitSpace).toBeDefined();
      expect(exitSpace?.coordinate.x).toBe(0);
      expect(exitSpace?.coordinate.y).toBe(0);

      // Should have 3 usable spaces in column 1
      const usableSpaces = tile.spaces.filter(
        (s) => !s.isExit && !s.isUnusable,
      );
      expect(usableSpaces).toHaveLength(3);
      usableSpaces.forEach((s) => {
        expect(s.coordinate.x).toBe(1);
      });

      // Should have 2 unusable spaces in column 0
      const unusableSpaces = tile.spaces.filter((s) => s.isUnusable);
      expect(unusableSpaces).toHaveLength(2);
    });

    it("left side with exit at bottom has correct structure", () => {
      const tile = createLShapedTile(5, "left", "bottom");

      // Should have exit at (0,2)
      const exitSpace = tile.spaces.find((s) => s.isExit);
      expect(exitSpace).toBeDefined();
      expect(exitSpace?.coordinate.x).toBe(0);
      expect(exitSpace?.coordinate.y).toBe(2);
    });

    it("right side with exit at top has correct structure", () => {
      const tile = createLShapedTile(4, "right", "top");

      // Should have exit at (1,0)
      const exitSpace = tile.spaces.find((s) => s.isExit);
      expect(exitSpace).toBeDefined();
      expect(exitSpace?.coordinate.x).toBe(1);
      expect(exitSpace?.coordinate.y).toBe(0);

      // Should have 3 usable spaces in column 0
      const usableSpaces = tile.spaces.filter(
        (s) => !s.isExit && !s.isUnusable,
      );
      expect(usableSpaces).toHaveLength(3);
      usableSpaces.forEach((s) => {
        expect(s.coordinate.x).toBe(0);
      });
    });

    it("right side with exit at bottom has correct structure", () => {
      const tile = createLShapedTile(9, "right", "bottom");

      // Should have exit at (1,2)
      const exitSpace = tile.spaces.find((s) => s.isExit);
      expect(exitSpace).toBeDefined();
      expect(exitSpace?.coordinate.x).toBe(1);
      expect(exitSpace?.coordinate.y).toBe(2);
    });

    it("each L-tile has exactly 1 exit", () => {
      const positions: Array<["left" | "right", "top" | "bottom"]> = [
        ["left", "top"],
        ["left", "bottom"],
        ["right", "top"],
        ["right", "bottom"],
      ];

      positions.forEach(([side, exitPos]) => {
        const tile = createLShapedTile(0, side, exitPos);
        const exitCount = tile.spaces.filter((s) => s.isExit).length;
        expect(exitCount).toBe(1);
      });
    });
  });

  describe("createBoard", () => {
    it("creates exactly 10 tiles", () => {
      const board = createBoard();
      expect(board.tiles).toHaveLength(10);
    });

    it("creates tiles with IDs 0-9", () => {
      const board = createBoard();
      const ids = board.tiles.map((t) => t.id);
      expect(ids).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it("creates 6 square tiles and 4 L-tiles", () => {
      const board = createBoard();
      const squareTiles = board.tiles.filter((t) => t.shape === "square");
      const lTiles = board.tiles.filter((t) => t.shape === "L");

      expect(squareTiles).toHaveLength(6);
      expect(lTiles).toHaveLength(4);
    });

    it("creates L-tiles at positions 0, 4, 5, and 9", () => {
      const board = createBoard();

      expect(board.tiles[0].shape).toBe("L");
      expect(board.tiles[4].shape).toBe("L");
      expect(board.tiles[5].shape).toBe("L");
      expect(board.tiles[9].shape).toBe("L");
    });

    it("creates square tiles at positions 1, 2, 3, 6, 7, 8", () => {
      const board = createBoard();

      expect(board.tiles[1].shape).toBe("square");
      expect(board.tiles[2].shape).toBe("square");
      expect(board.tiles[3].shape).toBe("square");
      expect(board.tiles[6].shape).toBe("square");
      expect(board.tiles[7].shape).toBe("square");
      expect(board.tiles[8].shape).toBe("square");
    });

    it("creates 2 left-side and 2 right-side L-tiles", () => {
      const board = createBoard();
      const lTiles = board.tiles.filter((t) => t.shape === "L");

      const leftTiles = lTiles.filter(
        (t) => t.shape === "L" && t.side === "left",
      );
      const rightTiles = lTiles.filter(
        (t) => t.shape === "L" && t.side === "right",
      );

      expect(leftTiles).toHaveLength(2);
      expect(rightTiles).toHaveLength(2);
    });

    it("left-side tiles are at positions 0 and 5", () => {
      const board = createBoard();

      const tile0 = board.tiles[0];
      const tile5 = board.tiles[5];

      expect(tile0.shape).toBe("L");
      expect(tile5.shape).toBe("L");

      if (tile0.shape === "L" && tile5.shape === "L") {
        expect(tile0.side).toBe("left");
        expect(tile5.side).toBe("left");
      }
    });

    it("right-side tiles are at positions 4 and 9", () => {
      const board = createBoard();

      const tile4 = board.tiles[4];
      const tile9 = board.tiles[9];

      expect(tile4.shape).toBe("L");
      expect(tile9.shape).toBe("L");

      if (tile4.shape === "L" && tile9.shape === "L") {
        expect(tile4.side).toBe("right");
        expect(tile9.side).toBe("right");
      }
    });

    it("left-side tiles have opposite exit positions", () => {
      const board = createBoard();

      const tile0 = board.tiles[0];
      const tile5 = board.tiles[5];

      if (tile0.shape === "L" && tile5.shape === "L") {
        // One should be top, one should be bottom
        const positions = [tile0.exitPosition, tile5.exitPosition].sort();
        expect(positions).toEqual(["bottom", "top"]);
      }
    });

    it("right-side tiles have opposite exit positions", () => {
      const board = createBoard();

      const tile4 = board.tiles[4];
      const tile9 = board.tiles[9];

      if (tile4.shape === "L" && tile9.shape === "L") {
        // One should be top, one should be bottom
        const positions = [tile4.exitPosition, tile9.exitPosition].sort();
        expect(positions).toEqual(["bottom", "top"]);
      }
    });

    it("enforces asymmetric exit configuration (one side spread, one clustered)", () => {
      const board = createBoard();

      const tile0 = board.tiles[0];
      const tile5 = board.tiles[5];
      const tile4 = board.tiles[4];
      const tile9 = board.tiles[9];

      if (
        tile0.shape === "L" &&
        tile5.shape === "L" &&
        tile4.shape === "L" &&
        tile9.shape === "L"
      ) {
        // If tile0 has exit at top, then:
        // - tile5 should have exit at bottom (left side spread)
        // - tile4 should have exit at bottom (right side clustered)
        // - tile9 should have exit at top (right side clustered)
        if (tile0.exitPosition === "top") {
          expect(tile5.exitPosition).toBe("bottom");
          expect(tile4.exitPosition).toBe("bottom");
          expect(tile9.exitPosition).toBe("top");
        } else {
          // tile0 has exit at bottom, so:
          // - tile5 should have exit at top (left side clustered)
          // - tile4 should have exit at top (right side spread)
          // - tile9 should have exit at bottom (right side spread)
          expect(tile5.exitPosition).toBe("top");
          expect(tile4.exitPosition).toBe("top");
          expect(tile9.exitPosition).toBe("bottom");
        }
      }
    });

    it("all exits point away from the board center", () => {
      const board = createBoard();

      // Left-side tiles (0, 5) should have exits at x=0
      const tile0 = board.tiles[0];
      const tile5 = board.tiles[5];

      if (tile0.shape === "L") {
        const exitSpace = tile0.spaces.find((s) => s.isExit);
        expect(exitSpace?.coordinate.x).toBe(0);
      }

      if (tile5.shape === "L") {
        const exitSpace = tile5.spaces.find((s) => s.isExit);
        expect(exitSpace?.coordinate.x).toBe(0);
      }

      // Right-side tiles (4, 9) should have exits at x=1
      const tile4 = board.tiles[4];
      const tile9 = board.tiles[9];

      if (tile4.shape === "L") {
        const exitSpace = tile4.spaces.find((s) => s.isExit);
        expect(exitSpace?.coordinate.x).toBe(1);
      }

      if (tile9.shape === "L") {
        const exitSpace = tile9.spaces.find((s) => s.isExit);
        expect(exitSpace?.coordinate.x).toBe(1);
      }
    });

    it("distributes mountains across square tiles", () => {
      const board = createBoard();
      const squareTiles = board.tiles.filter((t) => t.shape === "square");

      // Count total mountains across all square tiles
      const totalMountains = squareTiles.reduce((count, tile) => {
        return count + tile.spaces.filter((s) => s.hasMountain).length;
      }, 0);

      // Should have 0+1+1+2+2+3 = 9 mountains total
      expect(totalMountains).toBe(9);
    });

    it("has correct mountain distribution: one tile with 0, two with 1, two with 2, one with 3", () => {
      const board = createBoard();
      const squareTiles = board.tiles.filter((t) => t.shape === "square");

      const mountainCounts = squareTiles.map(
        (tile) => tile.spaces.filter((s) => s.hasMountain).length,
      );
      mountainCounts.sort();

      expect(mountainCounts).toEqual([0, 1, 1, 2, 2, 3]);
    });

    it("L-tiles never have mountains", () => {
      const board = createBoard();
      const lTiles = board.tiles.filter((t) => t.shape === "L");

      lTiles.forEach((tile) => {
        const mountainsCount = tile.spaces.filter((s) => s.hasMountain).length;
        expect(mountainsCount).toBe(0);
      });
    });
  });

  describe("Piece Management", () => {
    it("creates board with empty pieces array", () => {
      const board = createBoard();
      expect(board.pieces).toBeDefined();
      expect(board.pieces).toHaveLength(0);
    });

    it("adds a piece to the board", () => {
      const board = createBoard();
      const updatedBoard = addPiece(board, "piece-1", 1, 1, 1);

      expect(updatedBoard.pieces).toHaveLength(1);
      expect(updatedBoard.pieces[0]).toEqual({
        id: "piece-1",
        tileId: 1,
        localX: 1,
        localY: 1,
      });
    });

    it("adds multiple pieces to the board", () => {
      let board = createBoard();
      board = addPiece(board, "piece-1", 1, 0, 0);
      board = addPiece(board, "piece-2", 2, 1, 1);
      board = addPiece(board, "piece-3", 3, 2, 2);

      expect(board.pieces).toHaveLength(3);
      expect(board.pieces[0].id).toBe("piece-1");
      expect(board.pieces[1].id).toBe("piece-2");
      expect(board.pieces[2].id).toBe("piece-3");
    });

    it("does not mutate original board when adding piece", () => {
      const board = createBoard();
      const updatedBoard = addPiece(board, "piece-1", 1, 1, 1);

      expect(board.pieces).toHaveLength(0);
      expect(updatedBoard.pieces).toHaveLength(1);
    });

    it("allows pieces on different tiles at same local coordinates", () => {
      let board = createBoard();
      board = addPiece(board, "piece-1", 1, 1, 1);
      board = addPiece(board, "piece-2", 2, 1, 1);

      expect(board.pieces).toHaveLength(2);
      expect(board.pieces[0].tileId).toBe(1);
      expect(board.pieces[1].tileId).toBe(2);
      expect(board.pieces[0].localX).toBe(1);
      expect(board.pieces[1].localX).toBe(1);
    });
  });
});
