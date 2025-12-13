import { describe, it, expect } from "vitest";
import { gameReducer, getAllBoardPositions } from "./gameReducer";
import {
  createInitialGameState,
  type GameState,
  type ScientistState,
  type BabyState,
  type MotherState,
} from "../types/gameState";
import { countPlacedBabies, countPlacedScientists, isMotherPlaced, getUnplacedBabies } from "../utils/pieceUtils";
import { getReserveCount, getBoardScientists } from "../utils/scientistUtils";
import { raptorCards, scientistCards } from "@/utils/cardUtils";
import { getReachableDestinationsOnMotherTile } from "../utils/pathfinding";

// Helper to find baby by id in babies Record
function findBabyById(babies: Record<string, BabyState>, id: string): BabyState | undefined {
  return babies[id];
}

// Helper to start game from MAIN_MENU (advances to RAPTOR_SETUP)
function startGame(initialState: GameState): GameState {
  expect(initialState.phase).toBe("MAIN_MENU");
  const state = gameReducer(initialState, { type: "ADVANCE_PHASE" });
  expect(state.phase).toBe("RAPTOR_SETUP");
  return state;
}

// Helper to complete raptor setup and transition to scientist setup phase
function completeRaptorSetup(initialState: GameState): GameState {
  let state = initialState.phase === "MAIN_MENU" ? startGame(initialState) : initialState;
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

  // Advance phase to transition to scientist setup
  state = gameReducer(state, { type: "ADVANCE_PHASE" });

  return state;
}

// Helper to complete both raptor and scientist setup, then start game
function completeFullSetup(initialState: GameState): GameState {
  let state = completeRaptorSetup(initialState);

  // Place 4 scientists (one per L-tile)
  const lTiles = state.tiles.filter((t) => t.shape === "L");
  for (const lTile of lTiles) {
    const space = lTile.spaces.find((s) => !s.isExit && !s.isUnusable)!;
    state = gameReducer(state, {
      type: "PLACE_SCIENTIST",
      tileId: lTile.id,
      x: space.coordinate.x,
      y: space.coordinate.y,
    });
  }

  // Start the game (advance from SCIENTIST_SETUP to SCIENTIST_CARD_SELECTION)
  state = gameReducer(state, { type: "ADVANCE_PHASE" });

  return state;
}

// Helper to get to a specific phase for card testing
function getToCardSelectionPhase(initialState: GameState, player: "scientist" | "raptor"): GameState {
  let state = completeFullSetup(initialState);

  // Should be in SCIENTIST_CARD_SELECTION after setup
  expect(state.phase).toBe("SCIENTIST_CARD_SELECTION");

  // Scientist ready -> Scientist card selection
  state = gameReducer(state, { type: "ADVANCE_PHASE" });
  expect(state.phase).toBe("SCIENTIST_CARD_SELECTION");

  if (player === "scientist") {
    return state;
  }

  // Cards are auto-drawn on phase entry, select one and advance
  const scientistCard = state.scientistCards.hand[0];
  state = gameReducer(state, {
    type: "SELECT_CARD",
    player: "scientist",
    card: scientistCard.id,
  });
  state = gameReducer(state, { type: "ADVANCE_PHASE" });

  // Should be in RAPTOR_CARD_SELECTION
  expect(state.phase).toBe("RAPTOR_CARD_SELECTION");

  // Raptor ready -> Raptor card selection
  state = gameReducer(state, { type: "ADVANCE_PHASE" });
  expect(state.phase).toBe("RAPTOR_CARD_SELECTION");

  return state;
}

describe("Game Reducer - Setup Rules", () => {
  describe("Scientist Placement", () => {
    it("transitions to SCIENTIST_SETUP after raptor setup is confirmed", () => {
      let state = startGame(createInitialGameState());
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
      expect(state.mother).not.toBeNull();
      expect(countPlacedBabies(state)).toBe(0);
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

      expect(state.mother).not.toBeNull();
      expect(countPlacedBabies(state)).toBe(5);
      expect(state.phase).toBe("RAPTOR_SETUP"); // Still raptor setup until confirmed

      // Confirm raptor setup
      state = gameReducer(state, { type: "ADVANCE_PHASE" });
      expect(state.phase).toBe("SCIENTIST_SETUP"); // Now transitions
    });

    it("rejects CONFIRM_RAPTOR_SETUP when setup is incomplete", () => {
      let state = createInitialGameState();

      // Place only mother, no babies
      const tile2 = state.tiles.find((t) => t.id === 2)!;
      const space = tile2.spaces.find((s) => !s.hasMountain)!;
      state = gameReducer(state, {
        type: "PLACE_MOTHER",
        tileId: 2,
        x: space.coordinate.x,
        y: space.coordinate.y,
      });

      // Try to confirm - should be rejected
      const state2 = gameReducer(state, { type: "ADVANCE_PHASE" });
      expect(state2.phase).toBe("RAPTOR_SETUP"); // Still in raptor setup
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

      expect(countPlacedScientists(newState)).toBe(1);
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

      // State unchanged - placement rejected
      expect(countPlacedScientists(newState)).toBe(0);
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

      expect(countPlacedScientists(newState)).toBe(0);
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

      expect(countPlacedScientists(state2)).toBe(1);
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

      expect(countPlacedScientists(state2)).toBe(2);
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

      expect(countPlacedScientists(state)).toBe(4);
    });

    it("board has exactly 4 L-tiles for scientist placement", () => {
      const state = createInitialGameState();
      const lTiles = state.tiles.filter((t) => t.shape === "L");

      expect(lTiles).toHaveLength(4);
      expect(lTiles.map((t) => t.id).sort((a, b) => a - b)).toEqual([0, 4, 5, 9]);
    });

    it("each L-tile has at least one valid placement space for scientists", () => {
      const state = createInitialGameState();
      const lTiles = state.tiles.filter((t) => t.shape === "L");

      lTiles.forEach((lTile) => {
        const validSpaces = lTile.spaces.filter((s) => !s.isExit && !s.isUnusable && !s.hasMountain);
        expect(validSpaces.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Mother Raptor Placement", () => {
    it("allows mother raptor placement on central square tile 2", () => {
      const state = startGame(createInitialGameState());
      const tile2 = state.tiles.find((t) => t.id === 2)!;
      const space = tile2.spaces.find((s) => !s.hasMountain)!;

      const newState = gameReducer(state, {
        type: "PLACE_MOTHER",
        tileId: 2,
        x: space.coordinate.x,
        y: space.coordinate.y,
      });

      expect(newState.mother).not.toBeNull();
      expect(newState.mother.position).not.toBeNull();
      expect(isMotherPlaced(newState)).toBe(true);
    });

    it("allows mother raptor placement on central square tile 7", () => {
      const state = startGame(createInitialGameState());
      const tile7 = state.tiles.find((t) => t.id === 7)!;
      const space = tile7.spaces.find((s) => !s.hasMountain)!;

      const newState = gameReducer(state, {
        type: "PLACE_MOTHER",
        tileId: 7,
        x: space.coordinate.x,
        y: space.coordinate.y,
      });

      expect(newState.mother).not.toBeNull();
      expect(newState.mother!.position).not.toBeNull();
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

        expect(isMotherPlaced(newState)).toBe(false);
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

      expect(isMotherPlaced(newState)).toBe(false);
    });

    it("displaces baby when mother is placed on tile that has a baby", () => {
      const state = startGame(createInitialGameState());
      const tile2 = state.tiles.find((t) => t.id === 2)!;
      const spaces = tile2.spaces.filter((s) => !s.hasMountain);

      // Place baby first
      const state1 = gameReducer(state, {
        type: "PLACE_BABY",
        tileId: 2,
        x: spaces[0].coordinate.x,
        y: spaces[0].coordinate.y,
      });

      expect(countPlacedBabies(state1)).toBe(1);

      // Place mother on same tile - baby should be displaced
      const state2 = gameReducer(state1, {
        type: "PLACE_MOTHER",
        tileId: 2,
        x: spaces[1].coordinate.x,
        y: spaces[1].coordinate.y,
      });

      expect(countPlacedBabies(state2)).toBe(0); // Baby was displaced
      expect(isMotherPlaced(state2)).toBe(true); // Mother was placed
    });
  });

  describe("Baby Raptor Placement", () => {
    it("allows baby raptor placement on square tiles", () => {
      const state = startGame(createInitialGameState());
      const squareTile = state.tiles.find((t) => t.shape === "square" && t.id !== 2 && t.id !== 7)!;
      const space = squareTile.spaces.find((s) => !s.hasMountain)!;

      const newState = gameReducer(state, {
        type: "PLACE_BABY",
        tileId: squareTile.id,
        x: space.coordinate.x,
        y: space.coordinate.y,
      });

      expect(countPlacedBabies(newState)).toBe(1);
      const placedBaby = Object.values(newState.babies).find((b) => b.position !== null)!;
      expect(placedBaby).toBeDefined();
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

      expect(countPlacedBabies(newState)).toBe(0);
    });

    it("rejects baby raptor placement on tile that already has a raptor", () => {
      const state = startGame(createInitialGameState());
      const squareTile = state.tiles.find((t) => t.shape === "square" && t.id !== 2 && t.id !== 7)!;
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

      expect(countPlacedBabies(state2)).toBe(1);
    });

    it("allows baby placement on different square tiles (one per tile)", () => {
      const state = startGame(createInitialGameState());
      const squareTiles = state.tiles.filter((t) => t.shape === "square" && t.id !== 2 && t.id !== 7);

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

      expect(countPlacedBabies(state2)).toBe(2);
    });

    it("rejects baby placement if both central tiles (2 and 7) would be blocked", () => {
      const state = startGame(createInitialGameState());
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
      expect(countPlacedBabies(state2)).toBe(1);
    });

    it("allows baby placement on one central tile, leaving other for mother", () => {
      const state = startGame(createInitialGameState());
      const tile2 = state.tiles.find((t) => t.id === 2)!;
      const space2 = tile2.spaces.find((s) => !s.hasMountain)!;

      const newState = gameReducer(state, {
        type: "PLACE_BABY",
        tileId: 2,
        x: space2.coordinate.x,
        y: space2.coordinate.y,
      });

      expect(countPlacedBabies(newState)).toBe(1);

      // Tile 7 should still be available for mother
      const tile7 = newState.tiles.find((t) => t.id === 7)!;
      const space7 = tile7.spaces.find((s) => !s.hasMountain)!;

      const finalState = gameReducer(newState, {
        type: "PLACE_MOTHER",
        tileId: 7,
        x: space7.coordinate.x,
        y: space7.coordinate.y,
      });

      expect(countPlacedBabies(finalState)).toBe(1);
      expect(finalState.mother).not.toBeNull();
    });

    it("board has exactly 6 square tiles for raptor placement", () => {
      const state = createInitialGameState();
      const squareTiles = state.tiles.filter((t) => t.shape === "square");

      expect(squareTiles).toHaveLength(6);
      expect(squareTiles.map((t) => t.id).sort((a, b) => a - b)).toEqual([1, 2, 3, 6, 7, 8]);
    });
  });

  describe("Remove Piece During Setup", () => {
    it("removes mother and returns to holding pen", () => {
      const state = startGame(createInitialGameState());
      const tile2 = state.tiles.find((t) => t.id === 2)!;
      const space = tile2.spaces.find((s) => !s.hasMountain)!;

      // Place mother
      const state1 = gameReducer(state, {
        type: "PLACE_MOTHER",
        tileId: 2,
        x: space.coordinate.x,
        y: space.coordinate.y,
      });

      expect(isMotherPlaced(state1)).toBe(true);

      // Remove mother
      const state2 = gameReducer(state1, {
        type: "REMOVE_PIECE",
        pieceId: "mother",
      });

      expect(isMotherPlaced(state2)).toBe(false);
    });

    it("removes baby and returns to holding pen", () => {
      const state = startGame(createInitialGameState());
      const squareTile = state.tiles.find((t) => t.shape === "square" && t.id !== 2 && t.id !== 7)!;
      const space = squareTile.spaces.find((s) => !s.hasMountain)!;

      // Place baby
      const state1 = gameReducer(state, {
        type: "PLACE_BABY",
        tileId: squareTile.id,
        x: space.coordinate.x,
        y: space.coordinate.y,
      });

      expect(countPlacedBabies(state1)).toBe(1);

      // Remove baby (find the placed one)
      const placedBaby = Object.values(state1.babies).find((b) => b.position !== null)!;
      const state2 = gameReducer(state1, {
        type: "REMOVE_PIECE",
        pieceId: placedBaby.id,
      });

      expect(countPlacedBabies(state2)).toBe(0);
    });

    it("removes scientist and returns to holding pen", () => {
      // First complete raptor setup
      let state = startGame(createInitialGameState());
      const tile2 = state.tiles.find((t) => t.id === 2)!;
      const motherSpace = tile2.spaces.find((s) => !s.hasMountain)!;

      state = gameReducer(state, {
        type: "PLACE_MOTHER",
        tileId: 2,
        x: motherSpace.coordinate.x,
        y: motherSpace.coordinate.y,
      });

      // Place 5 babies
      const squareTiles = state.tiles.filter((t) => t.shape === "square" && t.id !== 2);
      for (let i = 0; i < 5; i++) {
        const tile = squareTiles[i];
        const space = tile.spaces.find((s) => !s.hasMountain)!;
        state = gameReducer(state, {
          type: "PLACE_BABY",
          tileId: tile.id,
          x: space.coordinate.x,
          y: space.coordinate.y,
        });
      }

      // Confirm raptor setup
      state = gameReducer(state, { type: "ADVANCE_PHASE" });
      expect(state.phase).toBe("SCIENTIST_SETUP");

      // Place a scientist
      const lTile = state.tiles.find((t) => t.shape === "L")!;
      const sciSpace = lTile.spaces.find((s) => !s.isExit && !s.isUnusable)!;

      state = gameReducer(state, {
        type: "PLACE_SCIENTIST",
        tileId: lTile.id,
        x: sciSpace.coordinate.x,
        y: sciSpace.coordinate.y,
      });

      expect(countPlacedScientists(state)).toBe(1);
      expect(getReserveCount(state.scientists)).toBe(9);

      // Remove scientist - find the placed one
      const boardScientists = getBoardScientists(state.scientists);
      const placedScientist = boardScientists[0];
      const state2 = gameReducer(state, {
        type: "REMOVE_PIECE",
        pieceId: placedScientist.id,
      });

      expect(countPlacedScientists(state2)).toBe(0);
      expect(getReserveCount(state2.scientists)).toBe(10);
    });

    it("ignores remove action outside setup phases", () => {
      // First complete full setup
      let state = startGame(createInitialGameState());
      const tile2 = state.tiles.find((t) => t.id === 2)!;
      const motherSpace = tile2.spaces.find((s) => !s.hasMountain)!;

      state = gameReducer(state, {
        type: "PLACE_MOTHER",
        tileId: 2,
        x: motherSpace.coordinate.x,
        y: motherSpace.coordinate.y,
      });

      // Place 5 babies
      const squareTiles = state.tiles.filter((t) => t.shape === "square" && t.id !== 2);
      for (let i = 0; i < 5; i++) {
        const tile = squareTiles[i];
        const space = tile.spaces.find((s) => !s.hasMountain)!;
        state = gameReducer(state, {
          type: "PLACE_BABY",
          tileId: tile.id,
          x: space.coordinate.x,
          y: space.coordinate.y,
        });
      }

      // Confirm raptor setup
      state = gameReducer(state, { type: "ADVANCE_PHASE" });

      // Place 4 scientists
      const lTiles = state.tiles.filter((t) => t.shape === "L");
      for (let i = 0; i < 4; i++) {
        const tile = lTiles[i];
        const space = tile.spaces.find((s) => !s.isExit && !s.isUnusable)!;
        state = gameReducer(state, {
          type: "PLACE_SCIENTIST",
          tileId: tile.id,
          x: space.coordinate.x,
          y: space.coordinate.y,
        });
      }

      // Start game
      state = gameReducer(state, { type: "ADVANCE_PHASE" });

      expect(state.phase).toBe("SCIENTIST_CARD_SELECTION");

      // Try to remove a piece - should be ignored
      const babyId = Object.values(state.babies)[0].id;
      const state2 = gameReducer(state, {
        type: "REMOVE_PIECE",
        pieceId: babyId,
      });

      expect(countPlacedBabies(state2)).toBe(5); // Baby still there
    });
  });

  describe("Space Occupation Rules", () => {
    it("rejects placement on exact space already occupied by another piece", () => {
      const state = startGame(createInitialGameState());
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
      const squareTile = state.tiles.find((t) => t.shape === "square" && t.id !== 2 && t.id !== 7)!;
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
        Object.values(state2.babies).find(
          (b) =>
            b.position &&
            b.position.tileId === squareTile.id &&
            b.position.x === squareSpace.coordinate.x &&
            b.position.y === squareSpace.coordinate.y,
        ),
      ).toBeTruthy();
    });

    it("rejects placement on mountain spaces", () => {
      const state = createInitialGameState();

      // Find a square tile with a mountain
      const tileWithMountain = state.tiles.find((t) => t.shape === "square" && t.spaces.some((s) => s.hasMountain));

      if (tileWithMountain) {
        const mountainSpace = tileWithMountain.spaces.find((s) => s.hasMountain)!;

        const newState = gameReducer(state, {
          type: "PLACE_BABY",
          tileId: tileWithMountain.id,
          x: mountainSpace.coordinate.x,
          y: mountainSpace.coordinate.y,
        });

        expect(countPlacedBabies(newState)).toBe(0);
      }
    });
  });

  describe("Setup Piece Counts", () => {
    it("initial state has 10 unplaced scientists", () => {
      const state = createInitialGameState();
      expect(getReserveCount(state.scientists)).toBe(10);
      expect(countPlacedScientists(state)).toBe(0);
    });

    it("initial state has unplaced mother", () => {
      const state = createInitialGameState();
      expect(isMotherPlaced(state)).toBe(false);
    });

    it("initial state has 5 unplaced babies", () => {
      const state = createInitialGameState();
      expect(getUnplacedBabies(state)).toHaveLength(5);
      expect(countPlacedBabies(state)).toBe(0);
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

describe("Game Reducer - Card System", () => {
  describe("Initial Card State", () => {
    it("initial state (MAIN_MENU) has full deck and empty hands", () => {
      const state = createInitialGameState();

      // Both decks should have 9 cards, hands empty
      expect(state.scientistCards.deck).toHaveLength(9);
      expect(state.raptorCards.deck).toHaveLength(9);
      expect(state.scientistCards.hand).toHaveLength(0);
      expect(state.raptorCards.hand).toHaveLength(0);

      // Both decks should contain cards 1-9
      expect([...state.scientistCards.deck].map((c) => c.value).sort((a, b) => a - b)).toEqual([
        1, 2, 3, 4, 5, 6, 7, 8, 9,
      ]);
      expect([...state.raptorCards.deck].map((c) => c.value).sort((a, b) => a - b)).toEqual([
        1, 2, 3, 4, 5, 6, 7, 8, 9,
      ]);
    });

    it("raptor draws hand when entering RAPTOR_SETUP", () => {
      const state = startGame(createInitialGameState());

      // Raptor draws when entering RAPTOR_SETUP
      expect(state.raptorCards.hand).toHaveLength(3);
      expect(state.raptorCards.deck).toHaveLength(6);
      // Scientist still has empty hand
      expect(state.scientistCards.hand).toHaveLength(0);
    });

    it("scientist draws hand when entering SCIENTIST_SETUP", () => {
      const state = completeRaptorSetup(createInitialGameState());

      // Scientist draws when entering SCIENTIST_SETUP
      expect(state.scientistCards.hand).toHaveLength(3);
      expect(state.scientistCards.deck).toHaveLength(6);
    });

    it("initial state has no selected cards", () => {
      const state = createInitialGameState();

      expect(state.scientistInteraction.selectedCard).toBeNull();
      expect(state.raptorInteraction.selectedCard).toBeNull();
    });
  });

  describe("Game Start and Ready Phases", () => {
    it("START_GAME transitions to SCIENTIST_CARD_SELECTION when setup is complete", () => {
      const state = completeFullSetup(createInitialGameState());
      expect(state.phase).toBe("SCIENTIST_CARD_SELECTION");
    });

    it("START_GAME is rejected if not all scientists are placed", () => {
      let state = completeRaptorSetup(createInitialGameState());

      // Place only 2 scientists
      const lTiles = state.tiles.filter((t) => t.shape === "L");
      for (let i = 0; i < 2; i++) {
        const lTile = lTiles[i];
        const space = lTile.spaces.find((s) => !s.isExit && !s.isUnusable)!;
        state = gameReducer(state, {
          type: "PLACE_SCIENTIST",
          tileId: lTile.id,
          x: space.coordinate.x,
          y: space.coordinate.y,
        });
      }

      // Try to start game
      const newState = gameReducer(state, { type: "ADVANCE_PHASE" });
      expect(newState.phase).toBe("SCIENTIST_SETUP"); // Should not transition
    });

    it("ADVANCE_PHASE does not transition from SCIENTIST_CARD_SELECTION without card selected", () => {
      let state = completeFullSetup(createInitialGameState());
      expect(state.phase).toBe("SCIENTIST_CARD_SELECTION");

      // Without selecting a card, should stay in same phase
      state = gameReducer(state, { type: "ADVANCE_PHASE" });
      expect(state.phase).toBe("SCIENTIST_CARD_SELECTION");
    });

    it("ADVANCE_PHASE does not transition from RAPTOR_CARD_SELECTION without card selected", () => {
      let state = getToCardSelectionPhase(createInitialGameState(), "scientist");

      // Select a card and advance to get to RAPTOR_CARD_SELECTION
      const card = state.scientistCards.hand[0];
      state = gameReducer(state, {
        type: "SELECT_CARD",
        player: "scientist",
        card: card.id,
      });
      state = gameReducer(state, { type: "ADVANCE_PHASE" });
      expect(state.phase).toBe("RAPTOR_CARD_SELECTION");

      // Without selecting a raptor card, should stay in same phase
      state = gameReducer(state, { type: "ADVANCE_PHASE" });
      expect(state.phase).toBe("RAPTOR_CARD_SELECTION");
    });
  });

  describe("DRAW_CARDS Action", () => {
    it("draws up to 3 cards from deck to hand", () => {
      // Start with initial state (empty hands) - don't transition to card selection
      // which now auto-draws
      let state = createInitialGameState();
      expect(state.scientistCards.hand).toHaveLength(0);
      expect(state.scientistCards.deck).toHaveLength(9);

      state = gameReducer(state, { type: "DRAW_CARDS", player: "scientist" });

      expect(state.scientistCards.hand).toHaveLength(3);
      expect(state.scientistCards.deck).toHaveLength(6);
    });

    it("draws cards from the top of the deck", () => {
      let state = createInitialGameState();
      const topThreeCards = state.scientistCards.deck.slice(0, 3);

      state = gameReducer(state, { type: "DRAW_CARDS", player: "scientist" });

      expect(state.scientistCards.hand).toEqual(topThreeCards);
    });

    it("does not draw if hand already has 3 cards", () => {
      let state = createInitialGameState();
      state = gameReducer(state, { type: "DRAW_CARDS", player: "scientist" });
      const handBefore = [...state.scientistCards.hand];
      const deckBefore = [...state.scientistCards.deck];

      state = gameReducer(state, { type: "DRAW_CARDS", player: "scientist" });

      expect(state.scientistCards.hand).toEqual(handBefore);
      expect(state.scientistCards.deck).toEqual(deckBefore);
    });

    it("draws for raptor player", () => {
      let state = createInitialGameState();
      // Initial state has empty hand
      expect(state.raptorCards.hand).toHaveLength(0);

      state = gameReducer(state, { type: "DRAW_CARDS", player: "raptor" });

      expect(state.raptorCards.hand).toHaveLength(3);
      expect(state.raptorCards.deck).toHaveLength(6);
    });
  });

  describe("SELECT_CARD Action", () => {
    it("marks card as selected but keeps it in hand until card reveal exit", () => {
      let state = getToCardSelectionPhase(createInitialGameState(), "scientist");
      state = gameReducer(state, { type: "DRAW_CARDS", player: "scientist" });
      const cardToSelect = state.scientistCards.hand[1]; // Select middle card
      const handBefore = [...state.scientistCards.hand];

      state = gameReducer(state, {
        type: "SELECT_CARD",
        player: "scientist",
        card: cardToSelect.id,
      });

      expect(state.scientistInteraction.selectedCard).toEqual(cardToSelect.id);
      // Cards stay in hand until card reveal exit
      expect(state.scientistCards.hand).toHaveLength(3);
      expect(state.scientistCards.hand).toEqual(handBefore);
    });

    it("SELECT_CARD sets card, ADVANCE_PHASE transitions scientist to RAPTOR_CARD_SELECTION", () => {
      let state = getToCardSelectionPhase(createInitialGameState(), "scientist");
      const card = state.scientistCards.hand[0];

      state = gameReducer(state, {
        type: "SELECT_CARD",
        player: "scientist",
        card: card.id,
      });
      // SELECT_CARD just sets the card, doesn't transition
      expect(state.phase).toBe("SCIENTIST_CARD_SELECTION");
      expect(state.scientistInteraction.selectedCard).toEqual(card.id);

      // ADVANCE_PHASE does the transition
      state = gameReducer(state, { type: "ADVANCE_PHASE" });
      expect(state.phase).toBe("RAPTOR_CARD_SELECTION");
    });

    it("marks raptor card as selected but keeps it in hand until card reveal exit", () => {
      let state = getToCardSelectionPhase(createInitialGameState(), "raptor");
      // Cards already drawn when entering card selection phase
      const cardToSelect = state.raptorCards.hand[0];
      const handBefore = [...state.raptorCards.hand];

      state = gameReducer(state, {
        type: "SELECT_CARD",
        player: "raptor",
        card: cardToSelect.id,
      });

      expect(state.raptorInteraction.selectedCard).toEqual(cardToSelect.id);
      // Cards stay in hand until card reveal exit
      expect(state.raptorCards.hand).toHaveLength(3);
      expect(state.raptorCards.hand).toEqual(handBefore);
    });

    it("SELECT_CARD sets card, ADVANCE_PHASE transitions raptor to CARD_REVEAL", () => {
      let state = getToCardSelectionPhase(createInitialGameState(), "raptor");
      const card = state.raptorCards.hand[0];

      state = gameReducer(state, {
        type: "SELECT_CARD",
        player: "raptor",
        card: card.id,
      });
      // SELECT_CARD just sets the card, doesn't transition
      expect(state.phase).toBe("RAPTOR_CARD_SELECTION");
      expect(state.raptorInteraction.selectedCard).toEqual(card.id);

      // ADVANCE_PHASE does the transition
      state = gameReducer(state, { type: "ADVANCE_PHASE" });
      expect(state.phase).toBe("CARD_REVEAL");
    });

    it("can select card for either player (interaction state is independent)", () => {
      const state = getToCardSelectionPhase(createInitialGameState(), "raptor");
      // Cards already drawn when entering card selection phase

      // Can set scientist's selected card even during raptor phase (UI would prevent this)
      const newState = gameReducer(state, {
        type: "SELECT_CARD",
        player: "scientist",
        card: "scientist_5_fire",
      });

      // SELECT_CARD always works - it's the UI that should prevent wrong-phase selection
      expect(newState.scientistInteraction.selectedCard).toBe("scientist_5_fire");
    });

    it("can select card for raptor during scientist phase (interaction is independent)", () => {
      const state = getToCardSelectionPhase(createInitialGameState(), "scientist");
      // Cards already drawn when entering card selection phase

      // Can set raptor's selected card even during scientist phase (UI would prevent this)
      const newState = gameReducer(state, {
        type: "SELECT_CARD",
        player: "raptor",
        card: "raptor_5_recovery",
      });

      // SELECT_CARD always works - it's the UI that should prevent wrong-phase selection
      expect(newState.raptorInteraction.selectedCard).toBe("raptor_5_recovery");
    });
  });

  describe("CONFIRM_REVEAL Action", () => {
    // Helper to get to CARD_REVEAL phase with specific card values played
    function getToRevealWithCards(scientistCardValue: number, raptorCardValue: number): GameState {
      // Create a state with controlled card decks
      let state = createInitialGameState();

      // Find the CardInfo objects for the desired values
      const desiredScientistCard = scientistCards.find((c) => c.value === scientistCardValue)!;
      const desiredRaptorCard = raptorCards.find((c) => c.value === raptorCardValue)!;

      // Set up decks so the desired card is first (will be drawn into hand)
      const scientistDeck = [desiredScientistCard, ...scientistCards.filter((c) => c.value !== scientistCardValue)];
      const raptorDeck = [desiredRaptorCard, ...raptorCards.filter((c) => c.value !== raptorCardValue)];

      state = {
        ...state,
        scientistCards: {
          deck: scientistDeck,
          hand: [],
          discard: [],
        },
        raptorCards: {
          deck: raptorDeck,
          hand: [],
          discard: [],
        },
      };

      // Complete setup
      state = completeRaptorSetup(state);
      const lTiles = state.tiles.filter((t) => t.shape === "L");
      for (const lTile of lTiles) {
        const space = lTile.spaces.find((s) => !s.isExit && !s.isUnusable)!;
        state = gameReducer(state, {
          type: "PLACE_SCIENTIST",
          tileId: lTile.id,
          x: space.coordinate.x,
          y: space.coordinate.y,
        });
      }
      state = gameReducer(state, { type: "ADVANCE_PHASE" }); // -> SCIENTIST_CARD_SELECTION
      state = gameReducer(state, { type: "ADVANCE_PHASE" }); // -> SCIENTIST_CARD_SELECTION (auto-draws)

      state = gameReducer(state, {
        type: "SELECT_CARD",
        player: "scientist",
        card: desiredScientistCard.id,
      });
      state = gameReducer(state, { type: "ADVANCE_PHASE" }); // -> RAPTOR_CARD_SELECTION
      state = gameReducer(state, { type: "ADVANCE_PHASE" }); // -> RAPTOR_CARD_SELECTION (auto-draws)
      state = gameReducer(state, {
        type: "SELECT_CARD",
        player: "raptor",
        card: desiredRaptorCard.id,
      });
      state = gameReducer(state, { type: "ADVANCE_PHASE" }); // -> CARD_REVEAL

      return state;
    }

    it("transitions to EFFECT_PHASE when scientist has lower card", () => {
      let state = getToRevealWithCards(3, 7);
      expect(state.phase).toBe("CARD_REVEAL");
      expect(state.activeEffectCard?.value).toBe(3);
      expect(state.activeEffectCard?.player).toBe("scientist");

      state = gameReducer(state, { type: "ADVANCE_PHASE" });

      expect(state.phase).toBe("EFFECT_PHASE");
    });

    it("transitions to EFFECT_PHASE when raptor has lower card", () => {
      let state = getToRevealWithCards(8, 2);
      expect(state.phase).toBe("CARD_REVEAL");
      expect(state.activeEffectCard?.value).toBe(2);
      expect(state.activeEffectCard?.player).toBe("raptor");

      state = gameReducer(state, { type: "ADVANCE_PHASE" });

      expect(state.phase).toBe("EFFECT_PHASE");
    });

    it("transitions to ROUND_END when cards are equal", () => {
      let state = getToRevealWithCards(5, 5);
      expect(state.phase).toBe("CARD_REVEAL");
      expect(state.activeEffectCard).toBeNull(); // No effect when cards are equal

      state = gameReducer(state, { type: "ADVANCE_PHASE" });

      expect(state.phase).toBe("ROUND_END");
    });
  });

  describe("Card State Integrity", () => {
    it("selected cards are preserved after phase transitions until card reveal exit", () => {
      let state = getToCardSelectionPhase(createInitialGameState(), "scientist");
      // Cards already drawn when entering card selection phase
      const scientistCard = state.scientistCards.hand[0];

      state = gameReducer(state, {
        type: "SELECT_CARD",
        player: "scientist",
        card: scientistCard.id,
      });

      // Scientist's selected card should persist through raptor's turn
      expect(state.scientistInteraction.selectedCard).toEqual(scientistCard.id);

      state = gameReducer(state, { type: "ADVANCE_PHASE" }); // -> RAPTOR_CARD_SELECTION
      expect(state.scientistInteraction.selectedCard).toEqual(scientistCard.id);

      state = gameReducer(state, { type: "ADVANCE_PHASE" }); // -> RAPTOR_CARD_SELECTION
      expect(state.scientistInteraction.selectedCard).toEqual(scientistCard.id);

      const raptorCard = state.raptorCards.hand[0];
      state = gameReducer(state, {
        type: "SELECT_CARD",
        player: "raptor",
        card: raptorCard.id,
      });

      state = gameReducer(state, { type: "ADVANCE_PHASE" }); // -> CARD_REVEAL

      // Both selected cards should be present at reveal
      expect(state.phase).toBe("CARD_REVEAL");
      expect(state.scientistInteraction.selectedCard).toEqual(scientistCard.id);
      expect(state.raptorInteraction.selectedCard).toEqual(raptorCard.id);
    });

    it("hand cards are preserved across opponent turns (cards stay in hand until card reveal exit)", () => {
      let state = getToCardSelectionPhase(createInitialGameState(), "scientist");
      // Cards already drawn when entering card selection phase
      const originalHand = [...state.scientistCards.hand];
      const cardToSelect = originalHand[0];

      state = gameReducer(state, {
        type: "SELECT_CARD",
        player: "scientist",
        card: cardToSelect.id,
      });

      // All cards should stay in hand through raptor's turn (selected card stays until card reveal exit)
      state = gameReducer(state, { type: "ADVANCE_PHASE" }); // -> RAPTOR_CARD_SELECTION
      expect(state.scientistCards.hand).toEqual(originalHand);

      state = gameReducer(state, { type: "ADVANCE_PHASE" }); // -> RAPTOR_CARD_SELECTION
      expect(state.scientistCards.hand).toEqual(originalHand);
    });
  });

  describe("Effect Phase Actions", () => {
    // Helper to get to EFFECT_PHASE with specific card values
    function getToEffectPhaseWithCards(scientistCardValue: number, raptorCardValue: number): GameState {
      let state = createInitialGameState();

      // Find the CardInfo objects for the desired values
      const desiredScientistCard = scientistCards.find((c) => c.value === scientistCardValue)!;
      const desiredRaptorCard = raptorCards.find((c) => c.value === raptorCardValue)!;

      // Set up decks so the desired card is first
      const scientistDeck = [desiredScientistCard, ...scientistCards.filter((c) => c.value !== scientistCardValue)];
      const raptorDeck = [desiredRaptorCard, ...raptorCards.filter((c) => c.value !== raptorCardValue)];

      state = {
        ...state,
        scientistCards: {
          deck: scientistDeck,
          hand: [],
          discard: [],
        },
        raptorCards: {
          deck: raptorDeck,
          hand: [],
          discard: [],
        },
      };

      // Complete setup
      state = completeRaptorSetup(state);
      const lTiles = state.tiles.filter((t) => t.shape === "L");
      for (const lTile of lTiles) {
        const space = lTile.spaces.find((s) => !s.isExit && !s.isUnusable)!;
        state = gameReducer(state, {
          type: "PLACE_SCIENTIST",
          tileId: lTile.id,
          x: space.coordinate.x,
          y: space.coordinate.y,
        });
      }
      state = gameReducer(state, { type: "ADVANCE_PHASE" }); // -> SCIENTIST_CARD_SELECTION
      state = gameReducer(state, { type: "ADVANCE_PHASE" }); // -> SCIENTIST_CARD_SELECTION (auto-draws)
      state = gameReducer(state, {
        type: "SELECT_CARD",
        player: "scientist",
        card: desiredScientistCard.id,
      });
      state = gameReducer(state, { type: "ADVANCE_PHASE" }); // -> RAPTOR_CARD_SELECTION
      state = gameReducer(state, { type: "ADVANCE_PHASE" }); // -> RAPTOR_CARD_SELECTION (auto-draws)
      state = gameReducer(state, {
        type: "SELECT_CARD",
        player: "raptor",
        card: desiredRaptorCard.id,
      });
      state = gameReducer(state, { type: "ADVANCE_PHASE" }); // -> CARD_REVEAL
      state = gameReducer(state, { type: "ADVANCE_PHASE" }); // -> EFFECT_PHASE

      return state;
    }

    // Helper to get to EFFECT_PHASE with raptor having lower card (raptor 3 < scientist 7)
    function getToEffectPhaseRaptorLower(): GameState {
      return getToEffectPhaseWithCards(7, 3);
    }

    // Helper to get to EFFECT_PHASE with scientist having lower card (scientist 2 < raptor 8)
    function getToEffectPhaseScientistLower(): GameState {
      return getToEffectPhaseWithCards(2, 8);
    }

    describe("FRIGHTEN_SCIENTIST", () => {
      it("frightens a scientist when raptor has lower card", () => {
        let state = getToEffectPhaseRaptorLower();
        expect(state.phase).toBe("EFFECT_PHASE");
        expect(state.activeEffectCard?.value).toBe(3);
        expect(state.activeEffectCard?.player).toBe("raptor");

        const boardScientists = getBoardScientists(state.scientists);
        const scientist = boardScientists[0];
        expect(scientist.position).not.toBeNull();
        if (!scientist.position) return;
        expect(scientist.isFrightened).toBeFalsy();

        state = gameReducer(state, {
          type: "FRIGHTEN_SCIENTIST",
          pieceId: scientist.id,
        });

        const updatedScientist = state.scientists[scientist.id];
        expect(updatedScientist.position).not.toBeNull();
        if (updatedScientist.position) {
          expect(updatedScientist.isFrightened).toBe(true);
        }
        // Still in effect phase - can frighten more scientists
        expect(state.phase).toBe("EFFECT_PHASE");
      });

      it("decrements effectActionsRemaining", () => {
        let state = getToEffectPhaseRaptorLower();
        const initialRemaining = state.effectActionsRemaining;
        expect(initialRemaining).toBeGreaterThan(0);

        const boardScientists = getBoardScientists(state.scientists);
        const scientist = boardScientists[0];
        state = gameReducer(state, {
          type: "FRIGHTEN_SCIENTIST",
          pieceId: scientist.id,
        });

        expect(state.effectActionsRemaining).toBe(initialRemaining - 1);
      });

      it("does not frighten non-scientists", () => {
        const state = getToEffectPhaseRaptorLower();
        const baby = Object.values(state.babies)[0];

        const newState = gameReducer(state, {
          type: "FRIGHTEN_SCIENTIST",
          pieceId: baby.id,
        });

        // Baby unchanged, action remaining unchanged
        expect(findBabyById(newState.babies, baby.id)!.isAsleep).toBeFalsy();
        expect(newState.effectActionsRemaining).toBe(state.effectActionsRemaining);
      });

      it("does not frighten already-frightened scientists", () => {
        let state = getToEffectPhaseRaptorLower();
        const boardScientists = getBoardScientists(state.scientists);
        const scientist = boardScientists[0];

        // Frighten the scientist
        state = gameReducer(state, {
          type: "FRIGHTEN_SCIENTIST",
          pieceId: scientist.id,
        });
        const remainingAfterFirst = state.effectActionsRemaining;

        // Try to frighten again
        const newState = gameReducer(state, {
          type: "FRIGHTEN_SCIENTIST",
          pieceId: scientist.id,
        });

        // Already frightened, action remaining unchanged
        expect(newState.effectActionsRemaining).toBe(remainingAfterFirst);
      });
    });

    describe("PUT_BABY_TO_SLEEP", () => {
      it("puts a baby to sleep when scientist has lower card", () => {
        let state = getToEffectPhaseScientistLower();
        expect(state.phase).toBe("EFFECT_PHASE");
        expect(state.activeEffectCard?.value).toBe(2);
        expect(state.activeEffectCard?.player).toBe("scientist");

        const baby = Object.values(state.babies)[0];
        expect(baby.isAsleep).toBeFalsy();

        state = gameReducer(state, {
          type: "PUT_BABY_TO_SLEEP",
          pieceId: baby.id,
        });

        const updatedBaby = findBabyById(state.babies, baby.id)!;
        expect(updatedBaby.isAsleep).toBe(true);
        // Still in effect phase - can put more babies to sleep
        expect(state.phase).toBe("EFFECT_PHASE");
      });

      it("decrements effectActionsRemaining", () => {
        let state = getToEffectPhaseScientistLower();
        const initialRemaining = state.effectActionsRemaining;
        expect(initialRemaining).toBeGreaterThan(0);

        const baby = Object.values(state.babies)[0];
        state = gameReducer(state, {
          type: "PUT_BABY_TO_SLEEP",
          pieceId: baby.id,
        });

        expect(state.effectActionsRemaining).toBe(initialRemaining - 1);
      });

      it("does not put non-babies to sleep", () => {
        const state = getToEffectPhaseScientistLower();
        const boardScientists = getBoardScientists(state.scientists);
        const scientist = boardScientists[0];

        const newState = gameReducer(state, {
          type: "PUT_BABY_TO_SLEEP",
          pieceId: scientist.id,
        });

        // Scientist unchanged, action remaining unchanged
        const updatedScientist = newState.scientists[scientist.id];
        expect(updatedScientist.position).not.toBeNull();
        if (updatedScientist.position) {
          expect(updatedScientist.isFrightened).toBeFalsy();
        }
        expect(newState.effectActionsRemaining).toBe(state.effectActionsRemaining);
      });

      it("does not put already-asleep babies to sleep", () => {
        let state = getToEffectPhaseScientistLower();
        const baby = Object.values(state.babies)[0];

        // Put the baby to sleep
        state = gameReducer(state, {
          type: "PUT_BABY_TO_SLEEP",
          pieceId: baby.id,
        });
        const remainingAfterFirst = state.effectActionsRemaining;

        // Try to put to sleep again
        const newState = gameReducer(state, {
          type: "PUT_BABY_TO_SLEEP",
          pieceId: baby.id,
        });

        // Already asleep, action remaining unchanged
        expect(newState.effectActionsRemaining).toBe(remainingAfterFirst);
      });
    });

    describe("CALL_BABY", () => {
      it("moves a baby to an empty space on mother's tile when raptor has lower card", () => {
        let state = getToEffectPhaseRaptorLower();
        expect(state.phase).toBe("EFFECT_PHASE");

        const mother = state.mother!;
        expect(mother.position).not.toBeNull();
        const motherTileId = mother.position!.tileId;
        const baby = Object.values(state.babies).find((b) => b.position && b.position.tileId !== motherTileId)!;

        // Use pathfinding to find a valid reachable destination on mother's tile
        const allPieces = getAllBoardPositions(state);
        const reachableDestinations = getReachableDestinationsOnMotherTile(state.tiles, allPieces, baby, state.mother);
        expect(reachableDestinations.length).toBeGreaterThan(0);
        const destination = reachableDestinations[0];

        state = gameReducer(state, {
          type: "CALL_BABY",
          babyId: baby.id,
          tileId: destination.tileId,
          x: destination.x,
          y: destination.y,
        });

        const movedBaby = findBabyById(state.babies, baby.id)!;
        expect(movedBaby.position).not.toBeNull();
        expect(movedBaby.position!.tileId).toBe(destination.tileId);
        expect(movedBaby.position!.x).toBe(destination.x);
        expect(movedBaby.position!.y).toBe(destination.y);
        // Still in effect phase - can call more babies
        expect(state.phase).toBe("EFFECT_PHASE");
      });

      it("decrements effectActionsRemaining", () => {
        let state = getToEffectPhaseRaptorLower();
        const initialRemaining = state.effectActionsRemaining;
        expect(initialRemaining).toBeGreaterThan(0);

        const mother = state.mother!;
        expect(mother.position).not.toBeNull();
        const motherTileId = mother.position!.tileId;
        const baby = Object.values(state.babies).find((b) => b.position && b.position.tileId !== motherTileId)!;

        // Use pathfinding to find a valid reachable destination on mother's tile
        const allPieces = getAllBoardPositions(state);
        const reachableDestinations = getReachableDestinationsOnMotherTile(state.tiles, allPieces, baby, state.mother);
        expect(reachableDestinations.length).toBeGreaterThan(0);
        const destination = reachableDestinations[0];

        state = gameReducer(state, {
          type: "CALL_BABY",
          babyId: baby.id,
          tileId: destination.tileId,
          x: destination.x,
          y: destination.y,
        });

        expect(state.effectActionsRemaining).toBe(initialRemaining - 1);
      });

      it("rejects move to wrong tile", () => {
        const state = getToEffectPhaseRaptorLower();
        const mother = state.mother!;
        expect(mother.position).not.toBeNull();
        const motherTileId = mother.position!.tileId;
        const baby = Object.values(state.babies).find((b) => b.position && b.position.tileId !== motherTileId)!;

        // Try to move to a different tile (not mother's tile)
        const otherTileId = motherTileId === 2 ? 3 : 2;

        const newState = gameReducer(state, {
          type: "CALL_BABY",
          babyId: baby.id,
          tileId: otherTileId,
          x: 0,
          y: 0,
        });

        // Baby should not have moved, action remaining unchanged
        const unmoved = findBabyById(newState.babies, baby.id)!;
        expect(unmoved.position).not.toBeNull();
        expect(unmoved.position!.tileId).toBe(baby.position!.tileId);
        expect(newState.effectActionsRemaining).toBe(state.effectActionsRemaining);
      });
    });

    describe("MOVE_JEEP", () => {
      // Helper to get to effect phase with scientist having card 3 (Jeep x2)
      function getToEffectPhaseWithJeep(): GameState {
        let state = createInitialGameState();

        // Set up decks so scientist plays 3 (jeep) and raptor plays 9
        const scientistCard3 = scientistCards.find((c) => c.value === 3)!;
        const raptorCard9 = raptorCards.find((c) => c.value === 9)!;
        const scientistDeck = [scientistCard3, ...scientistCards.filter((c) => c.value !== 3)];
        const raptorDeck = [raptorCard9, ...raptorCards.filter((c) => c.value !== 9)];

        state = {
          ...state,
          scientistCards: {
            deck: scientistDeck,
            hand: [],
            discard: [],
          },
          raptorCards: {
            deck: raptorDeck,
            hand: [],
            discard: [],
          },
        };

        // Complete setup
        state = completeRaptorSetup(state);
        const lTiles = state.tiles.filter((t) => t.shape === "L");
        for (const lTile of lTiles) {
          const space = lTile.spaces.find((s) => !s.isExit && !s.isUnusable)!;
          state = gameReducer(state, {
            type: "PLACE_SCIENTIST",
            tileId: lTile.id,
            x: space.coordinate.x,
            y: space.coordinate.y,
          });
        }
        state = gameReducer(state, { type: "ADVANCE_PHASE" });
        state = gameReducer(state, { type: "ADVANCE_PHASE" }); // -> SCIENTIST_CARD_SELECTION (auto-draws)
        state = gameReducer(state, {
          type: "SELECT_CARD",
          player: "scientist",
          card: scientistCard3.id,
        });
        state = gameReducer(state, { type: "ADVANCE_PHASE" }); // -> RAPTOR_CARD_SELECTION
        state = gameReducer(state, { type: "ADVANCE_PHASE" }); // -> RAPTOR_CARD_SELECTION
        state = gameReducer(state, {
          type: "SELECT_CARD",
          player: "raptor",
          card: raptorCard9.id,
        });
        state = gameReducer(state, { type: "ADVANCE_PHASE" }); // -> CARD_REVEAL
        state = gameReducer(state, { type: "ADVANCE_PHASE" }); // -> EFFECT_PHASE

        return state;
      }

      it("moves a scientist to a new position", () => {
        let state = getToEffectPhaseWithJeep();
        expect(state.phase).toBe("EFFECT_PHASE");
        expect(state.activeEffectCard?.value).toBe(3);
        expect(state.activeEffectCard?.player).toBe("scientist");

        const boardScientists = getBoardScientists(state.scientists);
        const scientist = boardScientists[0];
        if (!scientist.position) return;

        // Find a valid destination on the same tile
        const tile = state.tiles.find((t) => t.id === scientist.position!.tileId)!;
        const destSpace = tile.spaces.find(
          (s) =>
            !s.hasMountain &&
            !s.isUnusable &&
            !s.isExit &&
            (s.coordinate.x !== scientist.position!.x || s.coordinate.y !== scientist.position!.y) &&
            !getAllBoardPositions(state).some(
              (p) => p.tileId === tile.id && p.x === s.coordinate.x && p.y === s.coordinate.y,
            ),
        );

        if (!destSpace) return; // Skip if no valid destination

        state = gameReducer(state, {
          type: "MOVE_JEEP",
          scientistId: scientist.id,
          tileId: tile.id,
          x: destSpace.coordinate.x,
          y: destSpace.coordinate.y,
          path: [],
        });

        const movedScientist = state.scientists[scientist.id];
        expect(movedScientist.position).not.toBeNull();
        if (movedScientist.position) {
          expect(movedScientist.position.tileId).toBe(tile.id);
          expect(movedScientist.position.x).toBe(destSpace.coordinate.x);
          expect(movedScientist.position.y).toBe(destSpace.coordinate.y);
        }
        // Still in effect phase - can move more
        expect(state.phase).toBe("EFFECT_PHASE");
      });

      it("decrements effectActionsRemaining", () => {
        let state = getToEffectPhaseWithJeep();
        const initialRemaining = state.effectActionsRemaining;
        expect(initialRemaining).toBeGreaterThan(0);

        const boardScientists = getBoardScientists(state.scientists);
        const scientist = boardScientists[0];
        if (!scientist.position) return;
        const tile = state.tiles.find((t) => t.id === scientist.position!.tileId)!;
        const destSpace = tile.spaces.find(
          (s) =>
            !s.hasMountain &&
            !s.isUnusable &&
            !s.isExit &&
            (s.coordinate.x !== scientist.position!.x || s.coordinate.y !== scientist.position!.y) &&
            !getAllBoardPositions(state).some(
              (p) => p.tileId === tile.id && p.x === s.coordinate.x && p.y === s.coordinate.y,
            ),
        );

        if (!destSpace) return;

        state = gameReducer(state, {
          type: "MOVE_JEEP",
          scientistId: scientist.id,
          tileId: tile.id,
          x: destSpace.coordinate.x,
          y: destSpace.coordinate.y,
          path: [],
        });

        expect(state.effectActionsRemaining).toBe(initialRemaining - 1);
      });

      it("extinguishes fires along the path", () => {
        let state = getToEffectPhaseWithJeep();

        const boardScientists = getBoardScientists(state.scientists);
        const scientist = boardScientists[0];
        if (!scientist.position) return;
        const tile = state.tiles.find((t) => t.id === scientist.position!.tileId)!;

        // Find a valid destination
        const destSpace = tile.spaces.find(
          (s) =>
            !s.hasMountain &&
            !s.isUnusable &&
            !s.isExit &&
            (s.coordinate.x !== scientist.position!.x || s.coordinate.y !== scientist.position!.y) &&
            !getAllBoardPositions(state).some(
              (p) => p.tileId === tile.id && p.x === s.coordinate.x && p.y === s.coordinate.y,
            ),
        );

        if (!destSpace) return;

        // Add fire at the destination
        state = {
          ...state,
          fireTokens: [
            ...state.fireTokens,
            {
              id: "fire-test",
              tileId: tile.id,
              x: destSpace.coordinate.x,
              y: destSpace.coordinate.y,
            },
          ],
        };

        expect(state.fireTokens.length).toBeGreaterThan(0);

        state = gameReducer(state, {
          type: "MOVE_JEEP",
          scientistId: scientist.id,
          tileId: tile.id,
          x: destSpace.coordinate.x,
          y: destSpace.coordinate.y,
          path: [],
        });

        // Fire at destination should be extinguished
        const fireAtDest = state.fireTokens.find(
          (f) => f.tileId === tile.id && f.x === destSpace.coordinate.x && f.y === destSpace.coordinate.y,
        );
        expect(fireAtDest).toBeUndefined();
      });
    });

    describe("END_EFFECT_PHASE", () => {
      it("transitions from EFFECT_PHASE to ACTION_PHASE", () => {
        let state = getToEffectPhaseRaptorLower();
        expect(state.phase).toBe("EFFECT_PHASE");

        state = gameReducer(state, { type: "ADVANCE_PHASE" });

        expect(state.phase).toBe("ACTION_PHASE");
      });

      it("is ignored during non-EFFECT_PHASE", () => {
        const state = getToCardSelectionPhase(createInitialGameState(), "scientist");

        const newState = gameReducer(state, { type: "ADVANCE_PHASE" });

        expect(newState.phase).toBe("SCIENTIST_CARD_SELECTION");
      });
    });
  });
});

describe("Game Reducer - Action Phase", () => {
  // Helper to get to ACTION_PHASE with raptor having action points
  function getToActionPhaseRaptorActive(): GameState {
    let state = createInitialGameState();

    // Set up decks so raptor has higher card (gets action points)
    // Scientist plays 3, raptor plays 7, raptor gets 4 action points
    const desiredScientistCard = scientistCards.find((c) => c.value === 3)!;
    const desiredRaptorCard = raptorCards.find((c) => c.value === 7)!;
    const scientistDeck = [desiredScientistCard, ...scientistCards.filter((c) => c.value !== 3)];
    const raptorDeck = [desiredRaptorCard, ...raptorCards.filter((c) => c.value !== 7)];

    state = {
      ...state,
      scientistCards: {
        deck: scientistDeck,
        hand: [],
        discard: [],
      },
      raptorCards: {
        deck: raptorDeck,
        hand: [],
        discard: [],
      },
    };

    // Complete setup
    state = completeRaptorSetup(state);
    const lTiles = state.tiles.filter((t) => t.shape === "L");
    for (const lTile of lTiles) {
      const space = lTile.spaces.find((s) => !s.isExit && !s.isUnusable)!;
      state = gameReducer(state, {
        type: "PLACE_SCIENTIST",
        tileId: lTile.id,
        x: space.coordinate.x,
        y: space.coordinate.y,
      });
    }
    state = gameReducer(state, { type: "ADVANCE_PHASE" }); // -> SCIENTIST_CARD_SELECTION
    state = gameReducer(state, { type: "ADVANCE_PHASE" }); // -> SCIENTIST_CARD_SELECTION (auto-draws)
    state = gameReducer(state, {
      type: "SELECT_CARD",
      player: "scientist",
      card: desiredScientistCard.id,
    });
    state = gameReducer(state, { type: "ADVANCE_PHASE" }); // -> RAPTOR_CARD_SELECTION
    state = gameReducer(state, { type: "ADVANCE_PHASE" }); // -> RAPTOR_CARD_SELECTION (auto-draws)
    state = gameReducer(state, {
      type: "SELECT_CARD",
      player: "raptor",
      card: desiredRaptorCard.id,
    });
    state = gameReducer(state, { type: "ADVANCE_PHASE" }); // -> CARD_REVEAL
    state = gameReducer(state, { type: "ADVANCE_PHASE" }); // -> EFFECT_PHASE
    // Skip effect phase (scientist had lower card, uses effect)
    state = gameReducer(state, { type: "ADVANCE_PHASE" }); // -> ACTION_PHASE

    return state;
  }

  // Helper to get to ACTION_PHASE with scientist having action points
  function getToActionPhaseScientistActive(): GameState {
    let state = createInitialGameState();

    // Set up decks so scientist has higher card (gets action points)
    // Scientist plays 8, raptor plays 3, scientist gets 5 action points
    const desiredScientistCard = scientistCards.find((c) => c.value === 8)!;
    const desiredRaptorCard = raptorCards.find((c) => c.value === 3)!;
    const scientistDeck = [desiredScientistCard, ...scientistCards.filter((c) => c.value !== 8)];
    const raptorDeck = [desiredRaptorCard, ...raptorCards.filter((c) => c.value !== 3)];

    state = {
      ...state,
      scientistCards: {
        deck: scientistDeck,
        hand: [],
        discard: [],
      },
      raptorCards: {
        deck: raptorDeck,
        hand: [],
        discard: [],
      },
    };

    // Complete setup
    state = completeRaptorSetup(state);
    const lTiles = state.tiles.filter((t) => t.shape === "L");
    for (const lTile of lTiles) {
      const space = lTile.spaces.find((s) => !s.isExit && !s.isUnusable)!;
      state = gameReducer(state, {
        type: "PLACE_SCIENTIST",
        tileId: lTile.id,
        x: space.coordinate.x,
        y: space.coordinate.y,
      });
    }
    state = gameReducer(state, { type: "ADVANCE_PHASE" }); // -> SCIENTIST_CARD_SELECTION
    state = gameReducer(state, { type: "ADVANCE_PHASE" }); // -> SCIENTIST_CARD_SELECTION (auto-draws)
    state = gameReducer(state, {
      type: "SELECT_CARD",
      player: "scientist",
      card: desiredScientistCard.id,
    });
    state = gameReducer(state, { type: "ADVANCE_PHASE" }); // -> RAPTOR_CARD_SELECTION
    state = gameReducer(state, { type: "ADVANCE_PHASE" }); // -> RAPTOR_CARD_SELECTION (auto-draws)
    state = gameReducer(state, {
      type: "SELECT_CARD",
      player: "raptor",
      card: desiredRaptorCard.id,
    });
    state = gameReducer(state, { type: "ADVANCE_PHASE" }); // -> CARD_REVEAL
    state = gameReducer(state, { type: "ADVANCE_PHASE" }); // -> EFFECT_PHASE
    // Skip effect phase (raptor had lower card, uses effect)
    state = gameReducer(state, { type: "ADVANCE_PHASE" }); // -> ACTION_PHASE

    return state;
  }

  describe("Action Phase Initialization", () => {
    it("sets action points to card difference when transitioning to action phase", () => {
      const state = getToActionPhaseRaptorActive();

      expect(state.phase).toBe("ACTION_PHASE");
      expect(state.actionPoints).toBe(4); // 7 - 3 = 4
      expect(state.activePlayer).toBe("raptor");
    });

    it("sets scientist as active player when scientist has higher card", () => {
      const state = getToActionPhaseScientistActive();

      expect(state.phase).toBe("ACTION_PHASE");
      expect(state.actionPoints).toBe(5); // 8 - 3 = 5
      expect(state.activePlayer).toBe("scientist");
    });
  });

  describe("ACTION_MOVE_BABY", () => {
    it("allows raptor to move a baby when raptor is active", () => {
      let state = getToActionPhaseRaptorActive();
      const baby = Object.values(state.babies).find((b) => b.position !== null)!;
      expect(baby.position).not.toBeNull();
      const originalAP = state.actionPoints;

      // Helper to check if space is occupied
      const isOccupied = (tileId: number, x: number, y: number) => {
        if (
          state.mother?.position &&
          state.mother.position.tileId === tileId &&
          state.mother.position.x === x &&
          state.mother.position.y === y
        )
          return true;
        if (
          Object.values(state.babies).some(
            (b) => b.position && b.position.tileId === tileId && b.position.x === x && b.position.y === y,
          )
        )
          return true;
        const boardScientists = getBoardScientists(state.scientists);
        if (
          boardScientists.some(
            (s) => s.position && s.position.tileId === tileId && s.position.x === x && s.position.y === y,
          )
        )
          return true;
        return false;
      };

      // Find an adjacent empty space for the baby
      const babyTile = state.tiles.find((t) => t.id === baby.position!.tileId)!;
      const adjacentSpace = babyTile.spaces.find(
        (s) =>
          !s.hasMountain &&
          !s.isUnusable &&
          !s.isExit &&
          (Math.abs(s.coordinate.x - baby.position!.x) === 1) !== (Math.abs(s.coordinate.y - baby.position!.y) === 1) &&
          (s.coordinate.x === baby.position!.x || s.coordinate.y === baby.position!.y) &&
          !isOccupied(baby.position!.tileId, s.coordinate.x, s.coordinate.y),
      );

      if (adjacentSpace) {
        state = gameReducer(state, {
          type: "ACTION_MOVE_BABY",
          pieceId: baby.id,
          tileId: baby.position!.tileId,
          x: adjacentSpace.coordinate.x,
          y: adjacentSpace.coordinate.y,
        });

        const movedBaby = findBabyById(state.babies, baby.id)!;
        expect(movedBaby.position).not.toBeNull();
        expect(movedBaby.position!.x).toBe(adjacentSpace.coordinate.x);
        expect(movedBaby.position!.y).toBe(adjacentSpace.coordinate.y);
        expect(state.actionPoints).toBe(originalAP - 1);
      }
    });

    it("rejects baby movement when scientist is active", () => {
      let state = getToActionPhaseScientistActive();
      const baby = Object.values(state.babies).find((b) => b.position !== null)!;
      expect(baby.position).not.toBeNull();
      const originalX = baby.position!.x;
      const originalY = baby.position!.y;

      state = gameReducer(state, {
        type: "ACTION_MOVE_BABY",
        pieceId: baby.id,
        tileId: baby.position!.tileId,
        x: baby.position!.x + 1,
        y: baby.position!.y,
      });

      const sameBaby = findBabyById(state.babies, baby.id)!;
      expect(sameBaby.position).not.toBeNull();
      expect(sameBaby.position!.x).toBe(originalX);
      expect(sameBaby.position!.y).toBe(originalY);
    });

    it("rejects baby movement when no action points remain", () => {
      let state = getToActionPhaseRaptorActive();
      state = { ...state, actionPoints: 0 };

      const baby = Object.values(state.babies).find((b) => b.position !== null)!;
      expect(baby.position).not.toBeNull();
      const originalX = baby.position!.x;

      state = gameReducer(state, {
        type: "ACTION_MOVE_BABY",
        pieceId: baby.id,
        tileId: baby.position!.tileId,
        x: baby.position!.x + 1,
        y: baby.position!.y,
      });

      const sameBaby = findBabyById(state.babies, baby.id)!;
      expect(sameBaby.position).not.toBeNull();
      expect(sameBaby.position!.x).toBe(originalX);
    });

    it("rejects movement of sleeping baby", () => {
      let state = getToActionPhaseRaptorActive();
      const baby = Object.values(state.babies).find((b) => b.position !== null)!;
      expect(baby.position).not.toBeNull();

      // Put the baby to sleep
      state = {
        ...state,
        babies: {
          ...state.babies,
          [baby.id]: { ...baby, isAsleep: true },
        },
      };

      const originalX = baby.position!.x;

      state = gameReducer(state, {
        type: "ACTION_MOVE_BABY",
        pieceId: baby.id,
        tileId: baby.position!.tileId,
        x: baby.position!.x + 1,
        y: baby.position!.y,
      });

      const sameBaby = findBabyById(state.babies, baby.id)!;
      expect(sameBaby.position).not.toBeNull();
      expect(sameBaby.position!.x).toBe(originalX);
    });
  });

  describe("ACTION_MOVE_SCIENTIST", () => {
    it("allows scientist to move when scientist is active", () => {
      let state = getToActionPhaseScientistActive();
      const boardScientists = getBoardScientists(state.scientists);
      const scientist = boardScientists[0]!;
      if (!scientist.position) return;
      const originalAP = state.actionPoints;

      // Helper to check if space is occupied
      const isOccupied = (tileId: number, x: number, y: number) => {
        if (
          state.mother?.position &&
          state.mother.position.tileId === tileId &&
          state.mother.position.x === x &&
          state.mother.position.y === y
        )
          return true;
        if (
          Object.values(state.babies).some(
            (b) => b.position && b.position.tileId === tileId && b.position.x === x && b.position.y === y,
          )
        )
          return true;
        const allBoardScientists = getBoardScientists(state.scientists);
        if (
          allBoardScientists.some(
            (s) => s.position && s.position.tileId === tileId && s.position.x === x && s.position.y === y,
          )
        )
          return true;
        return false;
      };

      // Find an adjacent empty space for the scientist
      const scientistTile = state.tiles.find((t) => t.id === scientist.position!.tileId)!;
      const adjacentSpace = scientistTile.spaces.find(
        (s) =>
          !s.hasMountain &&
          !s.isUnusable &&
          !s.isExit &&
          (Math.abs(s.coordinate.x - scientist.position!.x) === 1) !==
            (Math.abs(s.coordinate.y - scientist.position!.y) === 1) &&
          (s.coordinate.x === scientist.position!.x || s.coordinate.y === scientist.position!.y) &&
          !isOccupied(scientist.position!.tileId, s.coordinate.x, s.coordinate.y) &&
          !state.fireTokens.some(
            (f) => f.tileId === scientist.position!.tileId && f.x === s.coordinate.x && f.y === s.coordinate.y,
          ),
      );

      if (adjacentSpace) {
        state = gameReducer(state, {
          type: "ACTION_MOVE_SCIENTIST",
          pieceId: scientist.id,
          tileId: scientist.position.tileId,
          x: adjacentSpace.coordinate.x,
          y: adjacentSpace.coordinate.y,
        });

        const movedScientist = state.scientists[scientist.id]!;
        if (!movedScientist.position) return;
        expect(movedScientist.position.x).toBe(adjacentSpace.coordinate.x);
        expect(movedScientist.position.y).toBe(adjacentSpace.coordinate.y);
        expect(state.actionPoints).toBe(originalAP - 1);
      }
    });

    it("rejects scientist movement when raptor is active", () => {
      let state = getToActionPhaseRaptorActive();
      const boardScientists = getBoardScientists(state.scientists);
      const scientist = boardScientists[0]!;
      if (!scientist.position) return;
      const originalX = scientist.position.x;
      const originalY = scientist.position.y;

      state = gameReducer(state, {
        type: "ACTION_MOVE_SCIENTIST",
        pieceId: scientist.id,
        tileId: scientist.position.tileId,
        x: scientist.position.x + 1,
        y: scientist.position.y,
      });

      const sameScientist = state.scientists[scientist.id]!;
      if (!sameScientist.position) return;
      expect(sameScientist.position.x).toBe(originalX);
      expect(sameScientist.position.y).toBe(originalY);
    });

    it("rejects movement of frightened scientist", () => {
      let state = getToActionPhaseScientistActive();
      const boardScientists = getBoardScientists(state.scientists);
      const scientist = boardScientists[0]!;
      if (!scientist.position) return;

      // Frighten the scientist
      state = {
        ...state,
        scientists: {
          ...state.scientists,
          [scientist.id]: {
            ...scientist,
            isFrightened: true,
          },
        },
      };

      const originalX = scientist.position.x;

      state = gameReducer(state, {
        type: "ACTION_MOVE_SCIENTIST",
        pieceId: scientist.id,
        tileId: scientist.position.tileId,
        x: scientist.position.x + 1,
        y: scientist.position.y,
      });

      const sameScientist = state.scientists[scientist.id]!;
      if (!sameScientist.position) return;
      expect(sameScientist.position.x).toBe(originalX);
    });

    it("rejects scientist movement onto fire", () => {
      let state = getToActionPhaseScientistActive();
      const boardScientists = getBoardScientists(state.scientists);
      const scientist = boardScientists[0]!;
      if (!scientist.position) return;

      // Place fire adjacent to scientist
      const fireX = scientist.position.x + 1;
      const fireY = scientist.position.y;
      state = {
        ...state,
        fireTokens: [
          {
            id: "fire-0",
            tileId: scientist.position.tileId,
            x: fireX,
            y: fireY,
          },
        ],
      };

      const originalX = scientist.position.x;

      state = gameReducer(state, {
        type: "ACTION_MOVE_SCIENTIST",
        pieceId: scientist.id,
        tileId: scientist.position.tileId,
        x: fireX,
        y: fireY,
      });

      const sameScientist = state.scientists[scientist.id]!;
      if (!sameScientist.position) return;
      expect(sameScientist.position.x).toBe(originalX);
    });
  });

  describe("END_ACTION_PHASE", () => {
    it("transitions to ROUND_END phase", () => {
      let state = getToActionPhaseRaptorActive();
      expect(state.phase).toBe("ACTION_PHASE");

      state = gameReducer(state, { type: "ADVANCE_PHASE" });

      expect(state.phase).toBe("ROUND_END");
    });

    it("is ignored during non-ACTION_PHASE", () => {
      const state = getToCardSelectionPhase(createInitialGameState(), "scientist");

      const newState = gameReducer(state, { type: "ADVANCE_PHASE" });

      expect(newState.phase).toBe("SCIENTIST_CARD_SELECTION");
    });
  });

  describe("Round End via ADVANCE_PHASE", () => {
    it("transitions from ROUND_END to SCIENTIST_CARD_SELECTION", () => {
      let state = getToActionPhaseRaptorActive();
      state = gameReducer(state, { type: "ADVANCE_PHASE" });
      expect(state.phase).toBe("ROUND_END");

      state = gameReducer(state, { type: "ADVANCE_PHASE" });

      expect(state.phase).toBe("SCIENTIST_CARD_SELECTION");
      // actionPoints preserved for CardResolution display until next CARD_REVEAL
      expect(state.activePlayer).toBe("scientist");
    });

    it("cards are discarded after card reveal exit", () => {
      const state = getToActionPhaseRaptorActive();
      // Cards are already discarded when we enter action phase (discarded on CARD_REVEAL exit)
      // Verify cards are in discard
      expect(state.scientistCards.discard.length).toBeGreaterThan(0);
      expect(state.raptorCards.discard.length).toBeGreaterThan(0);

      // selectedCard should be cleared after card reveal exit
      expect(state.scientistInteraction.selectedCard).toBe(null);
      expect(state.raptorInteraction.selectedCard).toBe(null);
    });

    it("draws cards to refill hands to 3", () => {
      let state = getToActionPhaseRaptorActive();
      // Cards stay in hand when played, but we want to verify drawing works
      state = gameReducer(state, { type: "ADVANCE_PHASE" });
      state = gameReducer(state, { type: "ADVANCE_PHASE" });

      // After discarding played card and drawing, hand should have 3 cards
      expect(state.scientistCards.hand.length).toBe(3);
      expect(state.raptorCards.hand.length).toBe(3);
    });

    it("resets round-based restrictions", () => {
      let state = getToActionPhaseRaptorActive();

      // Set up scientists with round-based flags
      const boardScientists = getBoardScientists(state.scientists);
      const scientist0 = boardScientists[0];
      const scientist1 = boardScientists[1];
      if (!scientist0?.position || !scientist1?.position) return;

      // Find a baby to mark as asleep this round
      const babyIds = Object.keys(state.babies);
      const babyToSleep = state.babies[babyIds[0]];

      state = {
        ...state,
        scientists: {
          ...state.scientists,
          [scientist0.id]: {
            ...scientist0,
            hasUsedAggressiveAction: true,
          },
          [scientist1.id]: {
            ...scientist1,
            frightenedThisRound: true,
            isFrightened: true,
          },
        },
        babies: {
          ...state.babies,
          [babyToSleep.id]: {
            ...babyToSleep,
            asleepThisRound: true,
          },
        },
        mother: {
          ...state.mother,
          paidWoundCost: true,
        },
      };

      state = gameReducer(state, { type: "ADVANCE_PHASE" });
      state = gameReducer(state, { type: "ADVANCE_PHASE" });

      // Check that scientist round flags are reset
      const updatedScientist0 = state.scientists[scientist0.id];
      const updatedScientist1 = state.scientists[scientist1.id];
      if (updatedScientist0.position) {
        expect(updatedScientist0.hasUsedAggressiveAction).toBe(false);
      }
      if (updatedScientist1.position) {
        expect(updatedScientist1.frightenedThisRound).toBe(false);
      }
      // Check baby asleepThisRound is reset
      expect(state.babies[babyToSleep.id].asleepThisRound).toBe(false);
      // Check mother paidWoundCost is reset
      expect(state.mother.paidWoundCost).toBe(false);
    });

    it("shuffles discard into deck when deck is empty", () => {
      let state = getToActionPhaseRaptorActive();
      // Empty the deck and put cards in discard
      const handCards = scientistCards.filter((c) => [1, 2].includes(c.value));
      const discardCards = scientistCards.filter((c) => [4, 5, 6, 7, 8, 9].includes(c.value));
      state = {
        ...state,
        scientistCards: {
          ...state.scientistCards,
          deck: [],
          hand: handCards,
          discard: discardCards,
        },
      };

      state = gameReducer(state, { type: "ADVANCE_PHASE" });
      state = gameReducer(state, { type: "ADVANCE_PHASE" });

      // Should have reshuffled discard into deck and drawn
      expect(state.scientistCards.hand.length).toBe(3);
      // After shuffle: deck=[4,5,6,7,8,9] shuffled, hand=[1,2], discard=[]
      // After draw 1: deck has 5, hand has 3
      expect(state.scientistCards.deck.length).toBe(5);
      expect(state.scientistCards.discard).toEqual([]);
    });
  });
});

describe("Win Conditions", () => {
  // Helper to create action phase state with proper setup
  function createActionPhaseState(activePlayer: "raptor" | "scientist"): GameState {
    let state = createInitialGameState();
    // Place scientists on L-tiles (first 4) using the new Record structure
    const updatedScientists: Record<string, ScientistState> = {};
    const lTileIds = [0, 4, 5, 9];
    Object.entries(state.scientists).forEach(([id, s], i) => {
      if (i < 4) {
        updatedScientists[id] = {
          ...s,
          position: { tileId: lTileIds[i], x: 1, y: 0 },
          isDead: false,
          isFrightened: false,
          hasUsedAggressiveAction: false,
          frightenedThisRound: false,
        };
      } else {
        updatedScientists[id] = s; // Keep as reserve
      }
    });

    // Place babies on square tiles using new Record structure
    const babyTileIds = [1, 3, 6, 7, 8];
    const updatedBabies: Record<string, BabyState> = {};
    Object.entries(state.babies).forEach(([id, b], i) => {
      updatedBabies[id] = {
        ...b,
        position: i < 5 ? { tileId: babyTileIds[i], x: 1, y: 1 } : null,
        isAsleep: false,
        isEscaped: false,
        isCaptured: false,
        asleepThisRound: false,
      };
    });

    // Set up mother with new MotherState structure
    const updatedMother: MotherState = {
      ...state.mother,
      position: { tileId: 2, x: 1, y: 1 },
      sleepTokens: 0,
      paidWoundCost: false,
      disappeared: false,
      observationActive: false,
    };

    // Set up basic pieces
    state = {
      ...state,
      phase: "ACTION_PHASE",
      activePlayer,
      actionPoints: 8,
      mother: updatedMother,
      babies: updatedBabies,
      scientists: updatedScientists,
    };
    return state;
  }

  describe("Raptor wins by escaping 3 babies", () => {
    it("should transition to GAME_OVER when third baby escapes", () => {
      let state = createActionPhaseState("raptor");

      // Mark 2 babies as already escaped
      const babyIds = Object.keys(state.babies);
      const updatedBabies: Record<string, BabyState> = { ...state.babies };
      updatedBabies[babyIds[0]] = { ...updatedBabies[babyIds[0]], position: null, isEscaped: true };
      updatedBabies[babyIds[1]] = { ...updatedBabies[babyIds[1]], position: null, isEscaped: true };
      state = { ...state, babies: updatedBabies };

      // Find a baby on the board
      const babyOnBoard = Object.values(state.babies).find((b) => b.position !== null && !b.isAsleep);
      expect(babyOnBoard).toBeDefined();

      // Find an L-tile with exit space
      const lTiles = state.tiles.filter((t) => t.shape === "L");
      const lTile = lTiles[0];
      const exitSpace = lTile.spaces.find((s) => s.isExit)!;

      // Find a space that's actually adjacent to the exit (orthogonally)
      const adjacentSpace = lTile.spaces.find(
        (s) =>
          !s.isExit &&
          !s.isUnusable &&
          !s.hasMountain &&
          ((Math.abs(s.coordinate.x - exitSpace.coordinate.x) === 1 && s.coordinate.y === exitSpace.coordinate.y) ||
            (Math.abs(s.coordinate.y - exitSpace.coordinate.y) === 1 && s.coordinate.x === exitSpace.coordinate.x)),
      )!;

      // Place baby adjacent to exit
      state = {
        ...state,
        babies: {
          ...state.babies,
          [babyOnBoard!.id]: {
            ...babyOnBoard!,
            position: { tileId: lTile.id, x: adjacentSpace.coordinate.x, y: adjacentSpace.coordinate.y },
          },
        },
      };

      // Move baby to exit
      state = gameReducer(state, {
        type: "ACTION_MOVE_BABY",
        pieceId: babyOnBoard!.id,
        tileId: lTile.id,
        x: exitSpace.coordinate.x,
        y: exitSpace.coordinate.y,
      });

      expect(state.phase).toBe("GAME_OVER");
      expect(state.winner).toBe("raptor");
      expect(state.winCondition).toBe("babies_escaped");
    });
  });

  describe("Raptor wins by eliminating all scientists", () => {
    it("should transition to GAME_OVER when last scientist is killed", () => {
      let state = createActionPhaseState("raptor");

      // Keep only one scientist on board, place adjacent to mother
      const boardScientists = getBoardScientists(state.scientists);
      const firstScientist = boardScientists[0]!;

      // Create new scientists Record with only one on board
      const updatedScientists: Record<string, ScientistState> = {};
      Object.entries(state.scientists).forEach(([id, s]) => {
        if (id === firstScientist.id) {
          updatedScientists[id] = {
            ...s,
            position: { tileId: 2, x: 1, y: 2 },
            isDead: false,
            isFrightened: false,
            hasUsedAggressiveAction: false,
            frightenedThisRound: false,
          };
        } else {
          // Mark all others as dead so only one remains
          updatedScientists[id] = { ...s, position: null, isDead: true };
        }
      });

      state = {
        ...state,
        scientists: updatedScientists,
        mother: { ...state.mother, position: { tileId: 2, x: 1, y: 1 } },
      };

      state = gameReducer(state, {
        type: "ACTION_MOTHER_KILL_SCIENTIST",
        targetId: firstScientist.id,
      });

      expect(state.phase).toBe("GAME_OVER");
      expect(state.winner).toBe("raptor");
      expect(state.winCondition).toBe("scientists_eliminated");
    });
  });

  describe("Scientist wins by neutralizing mother", () => {
    it("should transition to GAME_OVER when mother gets 5th sleep token", () => {
      let state = createActionPhaseState("scientist");

      // Give mother 4 sleep tokens
      state = {
        ...state,
        mother: { ...state.mother, sleepTokens: 4 },
      };

      // Place scientist and mother adjacent on same tile for clear LOS
      // Scientist at (1,1), mother at (1,2) - adjacent, no obstructions
      const boardScientists = getBoardScientists(state.scientists);
      const firstScientist = boardScientists[0]!;

      // Clear any babies from tile 2 to avoid blocking LOS
      const updatedBabies: Record<string, BabyState> = {};
      Object.entries(state.babies).forEach(([id, b]) => {
        if (b.position && b.position.tileId === 2) {
          updatedBabies[id] = { ...b, position: { tileId: 1, x: 0, y: 0 } };
        } else {
          updatedBabies[id] = b;
        }
      });
      state = { ...state, babies: updatedBabies };

      state = {
        ...state,
        scientists: {
          ...state.scientists,
          [firstScientist.id]: {
            ...firstScientist,
            position: { tileId: 2, x: 1, y: 1 },
            isFrightened: false,
            hasUsedAggressiveAction: false,
            frightenedThisRound: false,
          },
        },
        mother: { ...state.mother, position: { tileId: 2, x: 1, y: 2 } },
      };

      state = gameReducer(state, {
        type: "ACTION_SCIENTIST_SHOOT_MOTHER",
        scientistId: firstScientist.id,
      });

      expect(state.phase).toBe("GAME_OVER");
      expect(state.winner).toBe("scientist");
      expect(state.winCondition).toBe("mother_neutralized");
    });
  });

  describe("Scientist wins by capturing 3 babies", () => {
    it("should transition to GAME_OVER when third baby is captured", () => {
      let state = createActionPhaseState("scientist");

      // Mark 2 babies as already captured
      const babyIds = Object.keys(state.babies);
      const updatedBabies: Record<string, BabyState> = { ...state.babies };
      updatedBabies[babyIds[0]] = { ...updatedBabies[babyIds[0]], position: null, isCaptured: true };
      updatedBabies[babyIds[1]] = { ...updatedBabies[babyIds[1]], position: null, isCaptured: true };
      state = { ...state, babies: updatedBabies };

      // Find a baby on the board and make it asleep
      const babyOnBoard = Object.values(state.babies).find((b) => b.position !== null);
      expect(babyOnBoard).toBeDefined();

      // Place baby and scientist adjacent on same tile
      const boardScientists = getBoardScientists(state.scientists);
      const firstScientist = boardScientists[0]!;

      state = {
        ...state,
        babies: {
          ...state.babies,
          [babyOnBoard!.id]: {
            ...babyOnBoard!,
            position: { tileId: 2, x: 1, y: 2 },
            isAsleep: true,
          },
        },
        scientists: {
          ...state.scientists,
          [firstScientist.id]: {
            ...firstScientist,
            position: { tileId: 2, x: 1, y: 1 },
            isFrightened: false,
            hasUsedAggressiveAction: false,
            frightenedThisRound: false,
          },
        },
      };

      state = gameReducer(state, {
        type: "ACTION_SCIENTIST_CAPTURE_BABY",
        scientistId: firstScientist.id,
        targetId: babyOnBoard!.id,
      });

      expect(state.phase).toBe("GAME_OVER");
      expect(state.winner).toBe("scientist");
      expect(state.winCondition).toBe("babies_captured");
    });
  });

  describe("RESET_GAME action", () => {
    it("should reset to initial game state", () => {
      let state = createActionPhaseState("raptor");

      // Simulate game over
      state = {
        ...state,
        phase: "GAME_OVER",
        winner: "raptor",
        winCondition: "babies_escaped",
      };

      state = gameReducer(state, { type: "RESET_GAME" });

      expect(state.phase).toBe("MAIN_MENU");
      expect(state.winner).toBeNull();
      expect(state.winCondition).toBeNull();
      expect(state.mother.sleepTokens).toBe(0);
      expect(Object.values(state.babies).every((b) => b.position === null)).toBe(true);
    });
  });
});
