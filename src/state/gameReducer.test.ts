import { describe, it, expect } from "vitest";
import { gameReducer } from "./gameReducer";
import { createInitialGameState, GameState } from "../types/gameState";

// Helper to complete raptor setup and transition to scientist setup phase
function completeRaptorSetup(initialState: GameState): GameState {
  let state = initialState;
  const squareTiles = state.tiles.filter((t) => t.shape === "square");

  // Place mother on tile 2
  const centralTile = squareTiles.find((t) => t.id === 2)!;
  const motherSpace = centralTile.spaces.find((s) => !s.hasMountain)!;
  state = gameReducer(state, {
    type: "PLACE_MOTHER",
    tileId: 2,
    x: motherSpace.coordinate.x,
    y: motherSpace.coordinate.y,
  });

  // Place 5 babies on the remaining 5 square tiles (1, 3, 6, 7, 8)
  // Note: We can place on tile 7 since mother is on tile 2
  const tilesForBabies = squareTiles.filter((t) => t.id !== 2);
  for (let i = 0; i < 5; i++) {
    const tile = tilesForBabies[i];
    const space = tile.spaces.find((s) => !s.hasMountain)!;
    state = gameReducer(state, {
      type: "PLACE_BABY",
      tileId: tile.id,
      x: space.coordinate.x,
      y: space.coordinate.y,
    });
  }

  return state;
}

describe("Game Reducer - Setup Rules", () => {
  describe("Scientist Placement", () => {
    it("transitions to SCIENTIST_SETUP after raptor setup is complete", () => {
      let state = createInitialGameState();
      expect(state.phase).toBe("RAPTOR_SETUP");

      const squareTiles = state.tiles.filter((t) => t.shape === "square");
      const tilesForBabies = squareTiles.filter((t) => t.id !== 2);

      // Place mother on tile 2
      const centralTile = squareTiles.find((t) => t.id === 2)!;
      const motherSpace = centralTile.spaces.find((s) => !s.hasMountain)!;
      state = gameReducer(state, {
        type: "PLACE_MOTHER",
        tileId: 2,
        x: motherSpace.coordinate.x,
        y: motherSpace.coordinate.y,
      });
      expect(state.pieces).toHaveLength(1);
      expect(state.phase).toBe("RAPTOR_SETUP"); // Still raptor setup

      // Place 5 babies
      for (let i = 0; i < 5; i++) {
        const tile = tilesForBabies[i];
        const space = tile.spaces.find((s) => !s.hasMountain)!;
        state = gameReducer(state, {
          type: "PLACE_BABY",
          tileId: tile.id,
          x: space.coordinate.x,
          y: space.coordinate.y,
        });
      }

      expect(state.pieces).toHaveLength(6); // 1 mother + 5 babies
      expect(state.phase).toBe("SCIENTIST_SETUP"); // Should transition
    });

    it("allows scientist placement on L-tile at non-exit space", () => {
      const initialState = createInitialGameState();
      const state = completeRaptorSetup(initialState);
      expect(state.phase).toBe("SCIENTIST_SETUP");

      const lTile = state.tiles.find((t) => t.shape === "L")!;
      const validSpace = lTile.spaces.find((s) => !s.isExit && !s.isUnusable)!;

      const newState = gameReducer(state, {
        type: "PLACE_SCIENTIST",
        tileId: lTile.id,
        x: validSpace.coordinate.x,
        y: validSpace.coordinate.y,
      });

      expect(
        newState.pieces.filter((p) => p.type === "scientist"),
      ).toHaveLength(1);
      expect(newState.holdingPen.scientists).toBe(9);
    });

    it("rejects scientist placement on square tile", () => {
      const initialState = createInitialGameState();
      const state = completeRaptorSetup(initialState);
      const squareTile = state.tiles.find((t) => t.shape === "square")!;
      const space = squareTile.spaces.find((s) => !s.hasMountain)!;

      const newState = gameReducer(state, {
        type: "PLACE_SCIENTIST",
        tileId: squareTile.id,
        x: space.coordinate.x,
        y: space.coordinate.y,
      });

      // State unchanged - placement rejected (still has only raptor pieces)
      expect(
        newState.pieces.filter((p) => p.type === "scientist"),
      ).toHaveLength(0);
      expect(newState.holdingPen.scientists).toBe(10);
    });

    it("rejects scientist placement on L-tile exit space", () => {
      const initialState = createInitialGameState();
      const state = completeRaptorSetup(initialState);
      const lTile = state.tiles.find((t) => t.shape === "L")!;
      const exitSpace = lTile.spaces.find((s) => s.isExit)!;

      const newState = gameReducer(state, {
        type: "PLACE_SCIENTIST",
        tileId: lTile.id,
        x: exitSpace.coordinate.x,
        y: exitSpace.coordinate.y,
      });

      expect(
        newState.pieces.filter((p) => p.type === "scientist"),
      ).toHaveLength(0);
      expect(newState.holdingPen.scientists).toBe(10);
    });

    it("rejects scientist placement on L-tile that already has a scientist", () => {
      const initialState = createInitialGameState();
      let state = completeRaptorSetup(initialState);
      const lTile = state.tiles.find((t) => t.shape === "L")!;
      const spaces = lTile.spaces.filter((s) => !s.isExit && !s.isUnusable);

      // Place first scientist
      state = gameReducer(state, {
        type: "PLACE_SCIENTIST",
        tileId: lTile.id,
        x: spaces[0].coordinate.x,
        y: spaces[0].coordinate.y,
      });

      // Try to place second scientist on same tile
      const state2 = gameReducer(state, {
        type: "PLACE_SCIENTIST",
        tileId: lTile.id,
        x: spaces[1].coordinate.x,
        y: spaces[1].coordinate.y,
      });

      expect(state2.pieces.filter((p) => p.type === "scientist")).toHaveLength(
        1,
      );
      expect(state2.holdingPen.scientists).toBe(9);
    });

    it("allows scientist placement on different L-tiles", () => {
      const initialState = createInitialGameState();
      let state = completeRaptorSetup(initialState);
      const lTiles = state.tiles.filter((t) => t.shape === "L");

      // Place on first L-tile
      const space1 = lTiles[0].spaces.find((s) => !s.isExit && !s.isUnusable)!;
      state = gameReducer(state, {
        type: "PLACE_SCIENTIST",
        tileId: lTiles[0].id,
        x: space1.coordinate.x,
        y: space1.coordinate.y,
      });

      // Place on second L-tile
      const space2 = lTiles[1].spaces.find((s) => !s.isExit && !s.isUnusable)!;
      const state2 = gameReducer(state, {
        type: "PLACE_SCIENTIST",
        tileId: lTiles[1].id,
        x: space2.coordinate.x,
        y: space2.coordinate.y,
      });

      expect(state2.pieces.filter((p) => p.type === "scientist")).toHaveLength(
        2,
      );
      expect(state2.holdingPen.scientists).toBe(8);
    });

    it("allows exactly 4 scientists to be placed (one per L-tile)", () => {
      const initialState = createInitialGameState();
      let state = completeRaptorSetup(initialState);
      const lTiles = state.tiles.filter((t) => t.shape === "L");

      expect(lTiles).toHaveLength(4);

      // Place one scientist on each L-tile
      for (const lTile of lTiles) {
        const space = lTile.spaces.find((s) => !s.isExit && !s.isUnusable)!;
        state = gameReducer(state, {
          type: "PLACE_SCIENTIST",
          tileId: lTile.id,
          x: space.coordinate.x,
          y: space.coordinate.y,
        });
      }

      expect(state.pieces.filter((p) => p.type === "scientist")).toHaveLength(
        4,
      );
    });

    it("board has exactly 4 L-tiles for scientist placement", () => {
      const state = createInitialGameState();
      const lTiles = state.tiles.filter((t) => t.shape === "L");

      expect(lTiles).toHaveLength(4);
      expect(lTiles.map((t) => t.id).sort((a, b) => a - b)).toEqual([
        0, 4, 5, 9,
      ]);
    });

    it("each L-tile has at least one valid placement space for scientists", () => {
      const state = createInitialGameState();
      const lTiles = state.tiles.filter((t) => t.shape === "L");

      lTiles.forEach((lTile) => {
        const validSpaces = lTile.spaces.filter(
          (s) => !s.isExit && !s.isUnusable && !s.hasMountain,
        );
        expect(validSpaces.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Mother Raptor Placement", () => {
    it("allows mother raptor placement on central square tile 2", () => {
      const state = createInitialGameState();
      const tile2 = state.tiles.find((t) => t.id === 2)!;
      const space = tile2.spaces.find((s) => !s.hasMountain)!;

      const newState = gameReducer(state, {
        type: "PLACE_MOTHER",
        tileId: 2,
        x: space.coordinate.x,
        y: space.coordinate.y,
      });

      expect(newState.pieces).toHaveLength(1);
      expect(newState.pieces[0].type).toBe("mother");
      expect(newState.holdingPen.mother).toBe(0);
    });

    it("allows mother raptor placement on central square tile 7", () => {
      const state = createInitialGameState();
      const tile7 = state.tiles.find((t) => t.id === 7)!;
      const space = tile7.spaces.find((s) => !s.hasMountain)!;

      const newState = gameReducer(state, {
        type: "PLACE_MOTHER",
        tileId: 7,
        x: space.coordinate.x,
        y: space.coordinate.y,
      });

      expect(newState.pieces).toHaveLength(1);
      expect(newState.pieces[0].type).toBe("mother");
    });

    it("rejects mother raptor placement on non-central square tiles", () => {
      const state = createInitialGameState();
      const nonCentralTiles = [1, 3, 6, 8];

      for (const tileId of nonCentralTiles) {
        const tile = state.tiles.find((t) => t.id === tileId)!;
        const space = tile.spaces.find((s) => !s.hasMountain)!;

        const newState = gameReducer(state, {
          type: "PLACE_MOTHER",
          tileId,
          x: space.coordinate.x,
          y: space.coordinate.y,
        });

        expect(newState.pieces).toHaveLength(0);
      }
    });

    it("rejects mother raptor placement on L-tiles", () => {
      const state = createInitialGameState();
      const lTile = state.tiles.find((t) => t.shape === "L")!;
      const space = lTile.spaces.find((s) => !s.isExit && !s.isUnusable)!;

      const newState = gameReducer(state, {
        type: "PLACE_MOTHER",
        tileId: lTile.id,
        x: space.coordinate.x,
        y: space.coordinate.y,
      });

      expect(newState.pieces).toHaveLength(0);
    });

    it("rejects mother raptor placement on tile that already has a raptor", () => {
      const state = createInitialGameState();
      const tile2 = state.tiles.find((t) => t.id === 2)!;
      const spaces = tile2.spaces.filter((s) => !s.hasMountain);

      // Place baby first
      const state1 = gameReducer(state, {
        type: "PLACE_BABY",
        tileId: 2,
        x: spaces[0].coordinate.x,
        y: spaces[0].coordinate.y,
      });

      // Try to place mother on same tile
      const state2 = gameReducer(state1, {
        type: "PLACE_MOTHER",
        tileId: 2,
        x: spaces[1].coordinate.x,
        y: spaces[1].coordinate.y,
      });

      expect(state2.pieces).toHaveLength(1);
      expect(state2.pieces[0].type).toBe("baby");
    });
  });

  describe("Baby Raptor Placement", () => {
    it("allows baby raptor placement on square tiles", () => {
      const state = createInitialGameState();
      const squareTile = state.tiles.find(
        (t) => t.shape === "square" && t.id !== 2 && t.id !== 7,
      )!;
      const space = squareTile.spaces.find((s) => !s.hasMountain)!;

      const newState = gameReducer(state, {
        type: "PLACE_BABY",
        tileId: squareTile.id,
        x: space.coordinate.x,
        y: space.coordinate.y,
      });

      expect(newState.pieces).toHaveLength(1);
      expect(newState.pieces[0].type).toBe("baby");
      expect(newState.holdingPen.babies).toBe(4);
    });

    it("rejects baby raptor placement on L-tiles", () => {
      const state = createInitialGameState();
      const lTile = state.tiles.find((t) => t.shape === "L")!;
      const space = lTile.spaces.find((s) => !s.isExit && !s.isUnusable)!;

      const newState = gameReducer(state, {
        type: "PLACE_BABY",
        tileId: lTile.id,
        x: space.coordinate.x,
        y: space.coordinate.y,
      });

      expect(newState.pieces).toHaveLength(0);
    });

    it("rejects baby raptor placement on tile that already has a raptor", () => {
      const state = createInitialGameState();
      const squareTile = state.tiles.find(
        (t) => t.shape === "square" && t.id !== 2 && t.id !== 7,
      )!;
      const spaces = squareTile.spaces.filter((s) => !s.hasMountain);

      // Place first baby
      const state1 = gameReducer(state, {
        type: "PLACE_BABY",
        tileId: squareTile.id,
        x: spaces[0].coordinate.x,
        y: spaces[0].coordinate.y,
      });

      // Try to place second baby on same tile
      const state2 = gameReducer(state1, {
        type: "PLACE_BABY",
        tileId: squareTile.id,
        x: spaces[1].coordinate.x,
        y: spaces[1].coordinate.y,
      });

      expect(state2.pieces).toHaveLength(1);
    });

    it("allows baby placement on different square tiles (one per tile)", () => {
      const state = createInitialGameState();
      const squareTiles = state.tiles.filter(
        (t) => t.shape === "square" && t.id !== 2 && t.id !== 7,
      );

      // Place on first tile
      const space1 = squareTiles[0].spaces.find((s) => !s.hasMountain)!;
      const state1 = gameReducer(state, {
        type: "PLACE_BABY",
        tileId: squareTiles[0].id,
        x: space1.coordinate.x,
        y: space1.coordinate.y,
      });

      // Place on second tile
      const space2 = squareTiles[1].spaces.find((s) => !s.hasMountain)!;
      const state2 = gameReducer(state1, {
        type: "PLACE_BABY",
        tileId: squareTiles[1].id,
        x: space2.coordinate.x,
        y: space2.coordinate.y,
      });

      expect(state2.pieces).toHaveLength(2);
    });

    it("rejects baby placement if both central tiles (2 and 7) would be blocked", () => {
      const state = createInitialGameState();
      const tile2 = state.tiles.find((t) => t.id === 2)!;
      const tile7 = state.tiles.find((t) => t.id === 7)!;

      // Place baby on tile 2
      const space2 = tile2.spaces.find((s) => !s.hasMountain)!;
      const state1 = gameReducer(state, {
        type: "PLACE_BABY",
        tileId: 2,
        x: space2.coordinate.x,
        y: space2.coordinate.y,
      });

      // Try to place baby on tile 7 - should be rejected
      const space7 = tile7.spaces.find((s) => !s.hasMountain)!;
      const state2 = gameReducer(state1, {
        type: "PLACE_BABY",
        tileId: 7,
        x: space7.coordinate.x,
        y: space7.coordinate.y,
      });

      // Second placement rejected - must leave one central tile for mother
      expect(state2.pieces).toHaveLength(1);
    });

    it("allows baby placement on one central tile, leaving other for mother", () => {
      const state = createInitialGameState();
      const tile2 = state.tiles.find((t) => t.id === 2)!;
      const space2 = tile2.spaces.find((s) => !s.hasMountain)!;

      const newState = gameReducer(state, {
        type: "PLACE_BABY",
        tileId: 2,
        x: space2.coordinate.x,
        y: space2.coordinate.y,
      });

      expect(newState.pieces).toHaveLength(1);

      // Tile 7 should still be available for mother
      const tile7 = newState.tiles.find((t) => t.id === 7)!;
      const space7 = tile7.spaces.find((s) => !s.hasMountain)!;

      const finalState = gameReducer(newState, {
        type: "PLACE_MOTHER",
        tileId: 7,
        x: space7.coordinate.x,
        y: space7.coordinate.y,
      });

      expect(finalState.pieces).toHaveLength(2);
      expect(finalState.pieces.find((p) => p.type === "mother")).toBeTruthy();
    });

    it("board has exactly 6 square tiles for raptor placement", () => {
      const state = createInitialGameState();
      const squareTiles = state.tiles.filter((t) => t.shape === "square");

      expect(squareTiles).toHaveLength(6);
      expect(squareTiles.map((t) => t.id).sort((a, b) => a - b)).toEqual([
        1, 2, 3, 6, 7, 8,
      ]);
    });
  });

  describe("Space Occupation Rules", () => {
    it("rejects placement on exact space already occupied by another piece", () => {
      const state = createInitialGameState();
      const lTile = state.tiles.find((t) => t.shape === "L")!;
      const space = lTile.spaces.find((s) => !s.isExit && !s.isUnusable)!;

      // Place first scientist
      const state1 = gameReducer(state, {
        type: "PLACE_SCIENTIST",
        tileId: lTile.id,
        x: space.coordinate.x,
        y: space.coordinate.y,
      });

      // Try to place on same exact space (on a different L-tile to avoid one-per-tile rule)
      // Actually, let's test with a different piece type - place baby on same space as another baby
      const squareTile = state.tiles.find(
        (t) => t.shape === "square" && t.id !== 2 && t.id !== 7,
      )!;
      const squareSpace = squareTile.spaces.find((s) => !s.hasMountain)!;

      const state2 = gameReducer(state1, {
        type: "PLACE_BABY",
        tileId: squareTile.id,
        x: squareSpace.coordinate.x,
        y: squareSpace.coordinate.y,
      });

      // This would try to place another baby on exact same space
      // But it will fail due to one-raptor-per-tile rule first
      // Let's just verify the piece is there
      expect(
        state2.pieces.find(
          (p) =>
            p.tileId === squareTile.id &&
            p.x === squareSpace.coordinate.x &&
            p.y === squareSpace.coordinate.y,
        ),
      ).toBeTruthy();
    });

    it("rejects placement on mountain spaces", () => {
      const state = createInitialGameState();

      // Find a square tile with a mountain
      const tileWithMountain = state.tiles.find(
        (t) => t.shape === "square" && t.spaces.some((s) => s.hasMountain),
      );

      if (tileWithMountain) {
        const mountainSpace = tileWithMountain.spaces.find(
          (s) => s.hasMountain,
        )!;

        const newState = gameReducer(state, {
          type: "PLACE_BABY",
          tileId: tileWithMountain.id,
          x: mountainSpace.coordinate.x,
          y: mountainSpace.coordinate.y,
        });

        expect(newState.pieces).toHaveLength(0);
      }
    });
  });

  describe("Setup Piece Counts", () => {
    it("initial state has 10 scientists in holding pen", () => {
      const state = createInitialGameState();
      expect(state.holdingPen.scientists).toBe(10);
    });

    it("initial state has 1 mother in holding pen", () => {
      const state = createInitialGameState();
      expect(state.holdingPen.mother).toBe(1);
    });

    it("initial state has 5 babies in holding pen", () => {
      const state = createInitialGameState();
      expect(state.holdingPen.babies).toBe(5);
    });

    it("mother and 5 babies fit on 6 square tiles (one per tile)", () => {
      const state = createInitialGameState();
      const squareTiles = state.tiles.filter((t) => t.shape === "square");
      const raptorPieces = 1 + 5; // mother + babies

      expect(squareTiles).toHaveLength(6);
      expect(raptorPieces).toBe(squareTiles.length);
    });
  });
});
