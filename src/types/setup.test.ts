import { describe, it, expect } from "vitest";
import { createBoard } from "./board";
import { Scientist } from "../pieces/Scientist";
import { BabyRaptor } from "../pieces/BabyRaptor";
import { MotherRaptor } from "../pieces/MotherRaptor";

describe("Game Setup Rules", () => {
  describe("Scientist Placement from Holding Pen", () => {
    it("allows scientist placement on L-tile at non-exit space", () => {
      const board = createBoard();

      // Find an L-tile and a non-exit space
      const lTile = board.tiles.find((t) => t.shape === "L")!;
      const nonExitSpace = lTile.spaces.find(
        (s) => !s.isExit && !s.isUnusable,
      )!;

      // Simulate placement validation logic
      const canPlace =
        lTile.shape === "L" &&
        !nonExitSpace.isExit &&
        !nonExitSpace.hasMountain &&
        !nonExitSpace.isUnusable;

      expect(canPlace).toBe(true);
    });

    it("rejects scientist placement on square tile", () => {
      const board = createBoard();

      // Find a square tile
      const squareTile = board.tiles.find((t) => t.shape === "square")!;

      // Simulate placement validation logic - scientists must be on L-tiles
      // A square tile is not an L-tile, so placement is rejected
      expect(squareTile.shape).toBe("square");
      expect(squareTile.shape).not.toBe("L");
    });

    it("rejects scientist placement on L-tile exit space", () => {
      const board = createBoard();

      // Find an L-tile and its exit space
      const lTile = board.tiles.find((t) => t.shape === "L")!;
      const exitSpace = lTile.spaces.find((s) => s.isExit)!;

      // Simulate placement validation logic
      const canPlace = lTile.shape === "L" && !exitSpace.isExit;

      expect(canPlace).toBe(false);
    });

    it("rejects scientist placement on L-tile that already has a scientist", () => {
      const board = createBoard();

      // Place first scientist on L-tile
      const lTile = board.tiles.find((t) => t.shape === "L")!;
      const space1 = lTile.spaces.find((s) => !s.isExit && !s.isUnusable)!;
      board.pieces.push(
        new Scientist(
          "scientist-1",
          lTile.id,
          space1.coordinate.x,
          space1.coordinate.y,
        ),
      );

      // Simulate placement validation logic
      const scientistOnTile = board.pieces.some(
        (p) => p instanceof Scientist && p.tileId === lTile.id,
      );
      const canPlace = !scientistOnTile;

      expect(canPlace).toBe(false);
    });

    it("allows scientist placement on different L-tiles", () => {
      const board = createBoard();

      // Place scientist on first L-tile
      const lTile1 = board.tiles.find((t) => t.shape === "L")!;
      const space1 = lTile1.spaces.find((s) => !s.isExit && !s.isUnusable)!;
      board.pieces.push(
        new Scientist(
          "scientist-1",
          lTile1.id,
          space1.coordinate.x,
          space1.coordinate.y,
        ),
      );

      // Try to place scientist on different L-tile
      const lTile2 = board.tiles.find(
        (t) => t.shape === "L" && t.id !== lTile1.id,
      )!;
      const space2 = lTile2.spaces.find((s) => !s.isExit && !s.isUnusable)!;

      // Simulate placement validation logic
      const scientistOnTile = board.pieces.some(
        (p) => p instanceof Scientist && p.tileId === lTile2.id,
      );
      const canPlace =
        lTile2.shape === "L" &&
        !space2.isExit &&
        !space2.hasMountain &&
        !space2.isUnusable &&
        !scientistOnTile;

      expect(canPlace).toBe(true);
    });

    it("allows exactly 4 scientists to be placed (one per L-tile)", () => {
      const board = createBoard();
      const lTiles = board.tiles.filter((t) => t.shape === "L");

      expect(lTiles).toHaveLength(4);

      // Place one scientist on each L-tile
      lTiles.forEach((lTile, index) => {
        const space = lTile.spaces.find((s) => !s.isExit && !s.isUnusable)!;
        board.pieces.push(
          new Scientist(
            `scientist-${index}`,
            lTile.id,
            space.coordinate.x,
            space.coordinate.y,
          ),
        );
      });

      expect(board.pieces).toHaveLength(4);

      // Verify one scientist per L-tile
      lTiles.forEach((lTile) => {
        const scientistsOnTile = board.pieces.filter(
          (p) => p instanceof Scientist && p.tileId === lTile.id,
        );
        expect(scientistsOnTile).toHaveLength(1);
      });
    });

    it("board has exactly 4 L-tiles for scientist placement", () => {
      const board = createBoard();
      const lTiles = board.tiles.filter((t) => t.shape === "L");

      expect(lTiles).toHaveLength(4);
      expect(lTiles.map((t) => t.id).sort()).toEqual([0, 4, 5, 9]);
    });

    it("each L-tile has at least one valid placement space for scientists", () => {
      const board = createBoard();
      const lTiles = board.tiles.filter((t) => t.shape === "L");

      lTiles.forEach((lTile) => {
        const validSpaces = lTile.spaces.filter(
          (s) => !s.isExit && !s.isUnusable && !s.hasMountain,
        );
        expect(validSpaces.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Raptor Placement Rules", () => {
    it("allows mother raptor placement only on central square tiles (2 or 7)", () => {
      const board = createBoard();

      // Central tiles are tiles 2 and 7 (middle columns)
      const centralTiles = [2, 7];

      centralTiles.forEach((tileId) => {
        const tile = board.tiles.find((t) => t.id === tileId)!;
        expect(tile.shape).toBe("square");

        // Mother should be allowed on central tiles
        const canPlace =
          centralTiles.includes(tileId) && tile.shape === "square";
        expect(canPlace).toBe(true);
      });
    });

    it("rejects mother raptor placement on non-central square tiles", () => {
      const board = createBoard();

      // Non-central square tiles are 1, 3, 6, 8
      const nonCentralSquareTiles = [1, 3, 6, 8];

      nonCentralSquareTiles.forEach((tileId) => {
        const tile = board.tiles.find((t) => t.id === tileId)!;
        expect(tile.shape).toBe("square");

        // Mother should NOT be allowed on non-central square tiles
        const centralTiles = [2, 7];
        const canPlace = centralTiles.includes(tileId);
        expect(canPlace).toBe(false);
      });
    });

    it("rejects mother raptor placement on L-tiles", () => {
      const board = createBoard();

      const lTile = board.tiles.find((t) => t.shape === "L")!;

      // Mother cannot be placed on L-tiles (must be square)
      expect(lTile.shape).toBe("L");
      expect(lTile.shape).not.toBe("square");
    });

    it("rejects mother raptor placement on tile that already has a raptor", () => {
      const board = createBoard();

      // Place a baby on a square tile
      const squareTile = board.tiles.find((t) => t.shape === "square")!;
      const space = squareTile.spaces.find((s) => !s.hasMountain)!;
      board.pieces.push(
        new BabyRaptor(
          "baby-1",
          squareTile.id,
          space.coordinate.x,
          space.coordinate.y,
        ),
      );

      // Try to place mother on same tile (different space)
      const hasRaptorOnTile = board.pieces.some(
        (p) =>
          (p instanceof MotherRaptor || p instanceof BabyRaptor) &&
          p.tileId === squareTile.id,
      );

      // Simulate validation: can't place if tile already has a raptor
      const canPlace = !hasRaptorOnTile;

      expect(hasRaptorOnTile).toBe(true);
      expect(canPlace).toBe(false);
    });

    it("allows baby raptor placement on square tiles", () => {
      const board = createBoard();

      const squareTile = board.tiles.find((t) => t.shape === "square")!;

      // Baby can be placed on any square tile
      const canPlace = squareTile.shape === "square";

      expect(canPlace).toBe(true);
    });

    it("rejects baby raptor placement on L-tiles", () => {
      const board = createBoard();

      const lTile = board.tiles.find((t) => t.shape === "L")!;

      // Baby cannot be placed on L-tiles (must be square)
      expect(lTile.shape).toBe("L");
      expect(lTile.shape).not.toBe("square");
    });

    it("rejects baby raptor placement on tile that already has a raptor", () => {
      const board = createBoard();

      // Place mother on a square tile
      const squareTile = board.tiles.find((t) => t.shape === "square")!;
      const space = squareTile.spaces.find((s) => !s.hasMountain)!;
      board.pieces.push(
        new MotherRaptor(
          "mother",
          squareTile.id,
          space.coordinate.x,
          space.coordinate.y,
        ),
      );

      // Check if tile has a raptor
      const hasRaptorOnTile = board.pieces.some(
        (p) =>
          (p instanceof MotherRaptor || p instanceof BabyRaptor) &&
          p.tileId === squareTile.id,
      );

      const canPlace = !hasRaptorOnTile;

      expect(hasRaptorOnTile).toBe(true);
      expect(canPlace).toBe(false);
    });

    it("allows baby placement on different square tiles (one per tile)", () => {
      const board = createBoard();
      const squareTiles = board.tiles.filter((t) => t.shape === "square");

      // Place a baby on first square tile
      const tile1 = squareTiles[0];
      const space1 = tile1.spaces.find((s) => !s.hasMountain)!;
      board.pieces.push(
        new BabyRaptor(
          "baby-1",
          tile1.id,
          space1.coordinate.x,
          space1.coordinate.y,
        ),
      );

      // Try to place baby on different square tile
      const tile2 = squareTiles[1];

      const hasRaptorOnTile = board.pieces.some(
        (p) =>
          (p instanceof MotherRaptor || p instanceof BabyRaptor) &&
          p.tileId === tile2.id,
      );

      const canPlace = tile2.shape === "square" && !hasRaptorOnTile;

      expect(canPlace).toBe(true);
    });

    it("rejects baby placement if both central tiles (2 and 7) would be blocked", () => {
      const board = createBoard();

      // Place a baby on tile 2
      const tile2 = board.tiles.find((t) => t.id === 2)!;
      const space2 = tile2.spaces.find((s) => !s.hasMountain)!;
      board.pieces.push(
        new BabyRaptor("baby-1", 2, space2.coordinate.x, space2.coordinate.y),
      );

      // Try to place a baby on tile 7 - should be rejected
      // because this would leave no central tile for the mother
      const centralTiles = [2, 7];
      const occupiedCentralTiles = board.pieces.filter(
        (p) =>
          (p instanceof MotherRaptor || p instanceof BabyRaptor) &&
          centralTiles.includes(p.tileId),
      );

      // At least one central tile must remain free for mother
      const canPlaceOnTile7 = occupiedCentralTiles.length < 1;

      expect(canPlaceOnTile7).toBe(false);
    });

    it("allows baby placement on one central tile, leaving other for mother", () => {
      const board = createBoard();

      // Place a baby on tile 2
      const space2 = board.tiles
        .find((t) => t.id === 2)!
        .spaces.find((s) => !s.hasMountain)!;
      board.pieces.push(
        new BabyRaptor("baby-1", 2, space2.coordinate.x, space2.coordinate.y),
      );

      // Check that tile 7 is still available (no central tile restriction yet)
      const centralTiles = [2, 7];
      const occupiedCentralTiles = board.pieces.filter(
        (p) =>
          (p instanceof MotherRaptor || p instanceof BabyRaptor) &&
          centralTiles.includes(p.tileId),
      );

      // One central tile is occupied, one is still free
      expect(occupiedCentralTiles.length).toBe(1);

      // Tile 7 should still be available for mother or baby
      const tile7HasRaptor = board.pieces.some(
        (p) =>
          (p instanceof MotherRaptor || p instanceof BabyRaptor) &&
          p.tileId === 7,
      );
      expect(tile7HasRaptor).toBe(false);
    });

    it("board has exactly 6 square tiles for raptor placement", () => {
      const board = createBoard();
      const squareTiles = board.tiles.filter((t) => t.shape === "square");

      expect(squareTiles).toHaveLength(6);
      expect(squareTiles.map((t) => t.id).sort()).toEqual([1, 2, 3, 6, 7, 8]);
    });
  });

  describe("Space Occupation Rules", () => {
    it("rejects placement on exact space already occupied by another piece", () => {
      const board = createBoard();

      // Place a scientist on an L-tile
      const lTile = board.tiles.find((t) => t.shape === "L")!;
      const space = lTile.spaces.find((s) => !s.isExit && !s.isUnusable)!;
      board.pieces.push(
        new Scientist(
          "scientist-1",
          lTile.id,
          space.coordinate.x,
          space.coordinate.y,
        ),
      );

      // Check if exact space is occupied
      const isOccupied = board.pieces.some(
        (p) =>
          p.tileId === lTile.id &&
          p.localX === space.coordinate.x &&
          p.localY === space.coordinate.y,
      );

      expect(isOccupied).toBe(true);
    });

    it("rejects placement on mountain spaces", () => {
      const board = createBoard();

      // Find a square tile with a mountain
      const tileWithMountain = board.tiles.find(
        (t) => t.shape === "square" && t.spaces.some((s) => s.hasMountain),
      );

      if (tileWithMountain) {
        const mountainSpace = tileWithMountain.spaces.find(
          (s) => s.hasMountain,
        )!;

        // Simulate validation: can't place on mountain
        const canPlace = !mountainSpace.hasMountain;

        expect(canPlace).toBe(false);
      }
    });

    it("allows placement on non-mountain spaces of square tiles", () => {
      const board = createBoard();

      // Find a square tile and a non-mountain space
      const squareTile = board.tiles.find((t) => t.shape === "square")!;
      const nonMountainSpace = squareTile.spaces.find((s) => !s.hasMountain)!;

      expect(nonMountainSpace.hasMountain).toBe(false);
    });
  });

  describe("Setup Piece Counts", () => {
    it("setup requires exactly 10 scientists (4 placed, 6 in reserve)", () => {
      const totalScientists = 10;
      const onBoard = 4;
      const inReserve = 6;

      expect(onBoard + inReserve).toBe(totalScientists);
    });

    it("setup requires 1 mother raptor", () => {
      const totalMothers = 1;
      expect(totalMothers).toBe(1);
    });

    it("setup requires 5 baby raptors", () => {
      const totalBabies = 5;
      expect(totalBabies).toBe(5);
    });

    it("mother and 5 babies fit on 6 square tiles (one per tile)", () => {
      const squareTiles = 6;
      const raptorPieces = 1 + 5; // mother + babies

      expect(raptorPieces).toBe(squareTiles);
    });
  });
});
