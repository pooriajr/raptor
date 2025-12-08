import type {
  CardState,
  GameState,
  PieceState,
  Player,
} from "../types/gameState.ts";
import { getReachableDestinationsOnMotherTile } from "../utils/pathfinding.ts";
import {
  localToGlobal,
  getAdjacentGlobalCoordinates,
} from "../types/coordinates.ts";
import { BabyRaptor } from "../pieces/BabyRaptor.ts";
import { MotherRaptor } from "../pieces/MotherRaptor.ts";
import { Scientist } from "../pieces/Scientist.ts";

// Action types
export type GameAction =
  | { type: "PLACE_SCIENTIST"; tileId: number; x: number; y: number }
  | { type: "PLACE_MOTHER"; tileId: number; x: number; y: number }
  | { type: "PLACE_BABY"; tileId: number; x: number; y: number }
  | {
      type: "MOVE_PIECE";
      pieceId: string;
      tileId: number;
      x: number;
      y: number;
    }
  | { type: "START_GAME" }
  | { type: "PLAYER_READY"; player: "raptor" | "scientist" }
  | { type: "DRAW_CARDS"; player: "raptor" | "scientist" }
  | { type: "PLAY_CARD"; player: "raptor" | "scientist"; card: number }
  | { type: "CONFIRM_REVEAL" }
  | { type: "FRIGHTEN_SCIENTISTS"; pieceIds: string[] }
  | { type: "PUT_BABIES_TO_SLEEP"; pieceIds: string[] }
  | {
      type: "MOTHERS_CALL";
      moves: Array<{
        babyId: string;
        destinationTileId: number;
        destinationX: number;
        destinationY: number;
      }>;
    }
  | {
      type: "REINFORCEMENTS";
      placements: Array<{
        tileId: number;
        x: number;
        y: number;
      }>;
    }
  | {
      type: "PLACE_FIRE";
      placements: Array<{
        tileId: number;
        x: number;
        y: number;
      }>;
    }
  | {
      type: "JEEP_MOVES";
      moves: Array<{
        scientistId: string;
        fromTileId: number;
        fromX: number;
        fromY: number;
        toTileId: number;
        toX: number;
        toY: number;
        path: Array<{ tileId: number; x: number; y: number }>;
      }>;
    }
  | { type: "DISAPPEARANCE" }
  | { type: "WAKE_BABIES"; pieceIds: string[] }
  | { type: "END_EFFECT_PHASE" }
  | {
      type: "DEV_SKIP_TO_EFFECT";
      raptorCard: number;
      scientistCard: number;
    }
  | {
      type: "DEV_SKIP_TO_ACTION";
      player: "scientist" | "raptor";
    }
  // Action phase actions
  | {
      type: "ACTION_MOVE_BABY";
      pieceId: string;
      tileId: number;
      x: number;
      y: number;
    }
  | {
      type: "ACTION_MOVE_SCIENTIST";
      pieceId: string;
      tileId: number;
      x: number;
      y: number;
    }
  | {
      type: "ACTION_MOVE_MOTHER";
      pieceId: string;
      tileId: number;
      x: number;
      y: number;
    }
  // Adjacent piece interactions (all cost 1 action point)
  | { type: "ACTION_MOTHER_KILL_SCIENTIST"; targetId: string }
  | { type: "ACTION_MOTHER_WAKE_BABY"; targetId: string }
  | {
      type: "ACTION_MOTHER_EXTINGUISH_FIRE";
      tileId: number;
      x: number;
      y: number;
    }
  | {
      type: "ACTION_SCIENTIST_SLEEP_BABY";
      scientistId: string;
      targetId: string;
    }
  | {
      type: "ACTION_SCIENTIST_CAPTURE_BABY";
      scientistId: string;
      targetId: string;
    }
  | { type: "ACTION_SCIENTIST_SHOOT_MOTHER"; scientistId: string }
  | { type: "ACTION_SCIENTIST_STAND_UP"; scientistId: string }
  | { type: "END_ACTION_PHASE" }
  | { type: "RESET_ACTION_PHASE"; savedState: ActionPhaseSavedState };

// Saved state for action phase reset
export interface ActionPhaseSavedState {
  mother: PieceState | null;
  babies: PieceState[];
  scientists: PieceState[];
  fireTokens: import("../types/gameState.ts").FireToken[];
  actionPoints: number;
}

// Helper to find an item by id in an array
export function findById<T extends { id: string }>(
  items: T[],
  id: string,
): T | undefined {
  return items.find((item) => item.id === id);
}

// Helper to get all pieces as PieceState array (for backwards compatibility)
export function getAllPieces(state: GameState): PieceState[] {
  const pieces: PieceState[] = [];
  if (state.mother) {
    pieces.push({ ...state.mother, type: "mother" });
  }
  for (const baby of state.babies) {
    pieces.push({ ...baby, type: "baby" });
  }
  for (const scientist of state.scientists) {
    pieces.push({ ...scientist, type: "scientist" });
  }
  return pieces;
}

// Helper to check if a space is occupied by any piece
function isSpaceOccupiedNew(
  state: GameState,
  tileId: number,
  x: number,
  y: number,
  excludePieceId?: string,
): boolean {
  if (
    state.mother &&
    state.mother.tileId === tileId &&
    state.mother.x === x &&
    state.mother.y === y &&
    state.mother.id !== excludePieceId
  ) {
    return true;
  }
  if (
    state.babies.some(
      (b) =>
        b.tileId === tileId &&
        b.x === x &&
        b.y === y &&
        b.id !== excludePieceId,
    )
  ) {
    return true;
  }
  if (
    state.scientists.some(
      (s) =>
        s.tileId === tileId &&
        s.x === x &&
        s.y === y &&
        s.id !== excludePieceId,
    )
  ) {
    return true;
  }
  return false;
}

// Helper to check if tile has a raptor (mother or baby)
function tileHasRaptorNew(state: GameState, tileId: number): boolean {
  if (state.mother && state.mother.tileId === tileId) return true;
  return state.babies.some((b) => b.tileId === tileId);
}

// Helper to check if tile has a scientist
function tileHasScientistNew(state: GameState, tileId: number): boolean {
  return state.scientists.some((s) => s.tileId === tileId);
}

// Helper to draw cards from deck to hand (up to 3 cards in hand)
function drawCards(cardState: CardState): CardState {
  const cardsNeeded = 3 - cardState.hand.length;
  if (cardsNeeded <= 0 || cardState.deck.length === 0) {
    return cardState;
  }

  const cardsToDraw = Math.min(cardsNeeded, cardState.deck.length);
  const newHand = [...cardState.hand, ...cardState.deck.slice(0, cardsToDraw)];
  const newDeck = cardState.deck.slice(cardsToDraw);

  return {
    ...cardState,
    deck: newDeck,
    hand: newHand,
  };
}

// Helper to check if a scientist has line of sight to the mother
// LOS is blocked by: Rocks, Active (standing) scientists
// Can shoot through: Frightened scientists, fire tokens, baby raptors
function hasLineOfSight(
  state: GameState,
  scientist: PieceState,
  mother: PieceState,
): boolean {
  const sciGlobal = localToGlobal(scientist.tileId, scientist.x, scientist.y);
  const motherGlobal = localToGlobal(mother.tileId, mother.x, mother.y);

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
      // Check for mountain at this global position
      // We need to convert back to local coords to check
      for (const tile of state.tiles) {
        for (const space of tile.spaces) {
          const spaceGlobal = localToGlobal(
            tile.id,
            space.coordinate.x,
            space.coordinate.y,
          );
          if (
            spaceGlobal.globalX === x &&
            spaceGlobal.globalY === sciGlobal.globalY
          ) {
            // Check for mountain
            if (space.hasMountain) return false;

            // Check for standing (non-frightened) scientist
            const pieceHere = state.scientists.find(
              (s) =>
                s.tileId === tile.id &&
                s.x === space.coordinate.x &&
                s.y === space.coordinate.y,
            );
            if (pieceHere && !pieceHere.isFrightened) {
              return false;
            }
          }
        }
      }
    }
  } else {
    // sameCol
    const minY = Math.min(sciGlobal.globalY, motherGlobal.globalY);
    const maxY = Math.max(sciGlobal.globalY, motherGlobal.globalY);
    for (let y = minY + 1; y < maxY; y++) {
      for (const tile of state.tiles) {
        for (const space of tile.spaces) {
          const spaceGlobal = localToGlobal(
            tile.id,
            space.coordinate.x,
            space.coordinate.y,
          );
          if (
            spaceGlobal.globalX === sciGlobal.globalX &&
            spaceGlobal.globalY === y
          ) {
            // Check for mountain
            if (space.hasMountain) return false;

            // Check for standing (non-frightened) scientist
            const pieceHere = state.scientists.find(
              (s) =>
                s.tileId === tile.id &&
                s.x === space.coordinate.x &&
                s.y === space.coordinate.y,
            );
            if (pieceHere && !pieceHere.isFrightened) {
              return false;
            }
          }
        }
      }
    }
  }

  return true;
}

// Helper to find all fires connected to a starting fire (orthogonally)
function getConnectedFires(
  fireTokens: GameState["fireTokens"],
  startTileId: number,
  startX: number,
  startY: number,
): Array<{ id: string; tileId: number; x: number; y: number }> {
  const connected: Array<{ id: string; tileId: number; x: number; y: number }> =
    [];
  const visited = new Set<string>();
  const queue: Array<{ tileId: number; x: number; y: number }> = [
    { tileId: startTileId, x: startX, y: startY },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentGlobal = localToGlobal(current.tileId, current.x, current.y);
    const key = `${currentGlobal.globalX},${currentGlobal.globalY}`;

    if (visited.has(key)) continue;
    visited.add(key);

    // Find the fire at this position
    const fire = fireTokens.find(
      (f) =>
        f.tileId === current.tileId && f.x === current.x && f.y === current.y,
    );
    if (!fire) continue;

    connected.push(fire);

    // Check all adjacent positions for more fires
    const adjacentCoords = getAdjacentGlobalCoordinates(
      currentGlobal.globalX,
      currentGlobal.globalY,
    );
    for (const adj of adjacentCoords) {
      const adjKey = `${adj.globalX},${adj.globalY}`;
      if (visited.has(adjKey)) continue;

      // Find any fire at this adjacent global position
      const adjFire = fireTokens.find((f) => {
        const fGlobal = localToGlobal(f.tileId, f.x, f.y);
        return (
          fGlobal.globalX === adj.globalX && fGlobal.globalY === adj.globalY
        );
      });

      if (adjFire) {
        queue.push({ tileId: adjFire.tileId, x: adjFire.x, y: adjFire.y });
      }
    }
  }

  return connected;
}

// Helper to check if two pieces are adjacent (orthogonally)
function arePiecesAdjacent(
  _tiles: GameState["tiles"],
  piece1: PieceState,
  piece2: PieceState,
): boolean {
  const global1 = localToGlobal(piece1.tileId, piece1.x, piece1.y);
  const global2 = localToGlobal(piece2.tileId, piece2.x, piece2.y);
  const adjacent = getAdjacentGlobalCoordinates(
    global1.globalX,
    global1.globalY,
  );
  return adjacent.some(
    (adj) => adj.globalX === global2.globalX && adj.globalY === global2.globalY,
  );
}

// Helper to check if a space has a mountain
function spaceHasMountain(
  state: GameState,
  tileId: number,
  x: number,
  y: number,
): boolean {
  const tile = state.tiles.find((t) => t.id === tileId);
  if (!tile) return true; // Invalid tile, treat as blocked
  const space = tile.spaces.find(
    (s) => s.coordinate.x === x && s.coordinate.y === y,
  );
  if (!space) return true; // Invalid space, treat as blocked
  return space.hasMountain;
}

// Check if raptor setup is complete (mother + 5 babies placed)
function isRaptorSetupComplete(state: GameState): boolean {
  return state.mother !== null && state.babies.length === 5;
}

// Calculate action points and active player from played cards
// Higher card gets action points = difference between cards
function calculateActionPhaseState(state: GameState): {
  actionPoints: number;
  activePlayer: Player | null;
} {
  const scientistCard = state.scientistCards.played;
  const raptorCard = state.raptorCards.played;

  if (scientistCard === null || raptorCard === null) {
    return { actionPoints: 0, activePlayer: null };
  }

  if (scientistCard === raptorCard) {
    return { actionPoints: 0, activePlayer: null };
  }

  if (scientistCard > raptorCard) {
    return {
      actionPoints: scientistCard - raptorCard,
      activePlayer: "scientist",
    };
  } else {
    return {
      actionPoints: raptorCard - scientistCard,
      activePlayer: "raptor",
    };
  }
}

// Helper to transition to action phase with calculated AP
function transitionToActionPhase(state: GameState): Partial<GameState> {
  const { actionPoints, activePlayer } = calculateActionPhaseState(state);
  return {
    phase: "ACTION_PHASE" as const,
    actionPoints,
    activePlayer,
  };
}

// Dev helper: auto-setup pieces if none placed
function devAutoSetup(state: GameState): GameState {
  if (state.mother || state.babies.length > 0) return state;

  let newState = { ...state };
  const squareTiles = newState.tiles.filter((t) => t.shape === "square");
  const lTiles = newState.tiles.filter((t) => t.shape === "L");

  // Place mother on tile 2
  const tile2 = squareTiles.find((t) => t.id === 2)!;
  const motherSpace = tile2.spaces.find((s) => !s.hasMountain)!;
  newState = {
    ...newState,
    mother: {
      id: "mother",
      type: "mother",
      tileId: 2,
      x: motherSpace.coordinate.x,
      y: motherSpace.coordinate.y,
    },
    holdingPen: { ...newState.holdingPen, mother: 0 },
  };

  // Place babies on other square tiles
  const tilesForBabies = squareTiles.filter((t) => t.id !== 2);
  const newBabies: PieceState[] = [];
  let babyIndex = 0;
  for (const tile of tilesForBabies) {
    if (babyIndex >= 5) break;
    const space = tile.spaces.find((s) => !s.hasMountain)!;
    newBabies.push({
      id: `baby-${babyIndex}`,
      type: "baby",
      tileId: tile.id,
      x: space.coordinate.x,
      y: space.coordinate.y,
    });
    babyIndex++;
  }
  newState = {
    ...newState,
    babies: newBabies,
    holdingPen: { ...newState.holdingPen, babies: 0 },
  };

  // Place scientists on L-tiles
  const newScientists: PieceState[] = [];
  let scientistIndex = 0;
  for (const tile of lTiles) {
    if (scientistIndex >= 4) break;
    const space = tile.spaces.find((s) => !s.isExit && !s.isUnusable)!;
    newScientists.push({
      id: `scientist-${scientistIndex}`,
      type: "scientist",
      tileId: tile.id,
      x: space.coordinate.x,
      y: space.coordinate.y,
    });
    scientistIndex++;
  }
  newState = {
    ...newState,
    scientists: newScientists,
    holdingPen: { ...newState.holdingPen, scientists: 0 },
  };

  return newState;
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "PLACE_SCIENTIST": {
      // Validate: must be in scientist setup phase
      if (state.phase !== "SCIENTIST_SETUP") return state;

      // Validate: must have scientists in holding pen
      if (state.holdingPen.scientists <= 0) return state;

      // Validate: must be an L-tile
      const tile = state.tiles.find((t) => t.id === action.tileId);
      if (!tile || tile.shape !== "L") return state;

      // Validate: not on exit or unusable space
      const space = tile.spaces.find(
        (s) => s.coordinate.x === action.x && s.coordinate.y === action.y,
      );
      if (!space || space.isExit || space.isUnusable) return state;

      // Validate: no mountain
      if (space.hasMountain) return state;

      // Validate: no scientist already on this L-tile
      if (tileHasScientistNew(state, action.tileId)) return state;

      // Validate: space not occupied
      if (isSpaceOccupiedNew(state, action.tileId, action.x, action.y))
        return state;

      const newScientist: PieceState = {
        id: `scientist-${state.scientists.length}`,
        type: "scientist",
        tileId: action.tileId,
        x: action.x,
        y: action.y,
      };

      return {
        ...state,
        scientists: [...state.scientists, newScientist],
        holdingPen: {
          ...state.holdingPen,
          scientists: state.holdingPen.scientists - 1,
        },
      };
    }

    case "PLACE_MOTHER": {
      // Validate: must be in raptor setup phase
      if (state.phase !== "RAPTOR_SETUP") return state;

      // Validate: must have mother in holding pen
      if (state.holdingPen.mother <= 0) return state;

      // Validate: must be a central square tile (2 or 7)
      const centralTiles = [2, 7];
      const tile = state.tiles.find((t) => t.id === action.tileId);
      if (
        !tile ||
        tile.shape !== "square" ||
        !centralTiles.includes(action.tileId)
      )
        return state;

      // Validate: no mountain
      if (spaceHasMountain(state, action.tileId, action.x, action.y))
        return state;

      // Validate: no raptor already on this tile
      if (tileHasRaptorNew(state, action.tileId)) return state;

      // Validate: space not occupied
      if (isSpaceOccupiedNew(state, action.tileId, action.x, action.y))
        return state;

      const newMother: PieceState = {
        id: "mother",
        type: "mother",
        tileId: action.tileId,
        x: action.x,
        y: action.y,
      };

      const newState = {
        ...state,
        mother: newMother,
        holdingPen: {
          ...state.holdingPen,
          mother: 0,
        },
      };

      // Transition to scientist setup if raptor setup is complete
      if (isRaptorSetupComplete(newState)) {
        return { ...newState, phase: "SCIENTIST_SETUP" as const };
      }

      return newState;
    }

    case "PLACE_BABY": {
      // Validate: must be in raptor setup phase
      if (state.phase !== "RAPTOR_SETUP") return state;

      // Validate: must have babies in holding pen
      if (state.holdingPen.babies <= 0) return state;

      // Validate: must be a square tile
      const tile = state.tiles.find((t) => t.id === action.tileId);
      if (!tile || tile.shape !== "square") return state;

      // Validate: no mountain
      if (spaceHasMountain(state, action.tileId, action.x, action.y))
        return state;

      // Validate: no raptor already on this tile
      if (tileHasRaptorNew(state, action.tileId)) return state;

      // Validate: must leave at least one central tile free for mother (if mother not yet placed)
      const centralTiles = [2, 7];
      if (centralTiles.includes(action.tileId) && !state.mother) {
        const babiesOnCentralTiles = state.babies.filter((b) =>
          centralTiles.includes(b.tileId),
        );
        // If one central tile already has a baby, can't place on the other (must leave one for mother)
        if (babiesOnCentralTiles.length >= 1) return state;
      }

      // Validate: space not occupied
      if (isSpaceOccupiedNew(state, action.tileId, action.x, action.y))
        return state;

      const newBaby: PieceState = {
        id: `baby-${state.babies.length}`,
        type: "baby",
        tileId: action.tileId,
        x: action.x,
        y: action.y,
      };

      const newState = {
        ...state,
        babies: [...state.babies, newBaby],
        holdingPen: {
          ...state.holdingPen,
          babies: state.holdingPen.babies - 1,
        },
      };

      // Transition to scientist setup if raptor setup is complete
      if (isRaptorSetupComplete(newState)) {
        return { ...newState, phase: "SCIENTIST_SETUP" as const };
      }

      return newState;
    }

    case "MOVE_PIECE": {
      // Find the piece in any array
      const allPieces = getAllPieces(state);
      const piece = allPieces.find((p) => p.id === action.pieceId);
      if (!piece) return state;

      // Validate: target tile exists
      const targetTile = state.tiles.find((t) => t.id === action.tileId);
      if (!targetTile) return state;

      // Validate: target space exists and has no mountain
      const targetSpace = targetTile.spaces.find(
        (s) => s.coordinate.x === action.x && s.coordinate.y === action.y,
      );
      if (!targetSpace || targetSpace.hasMountain || targetSpace.isUnusable)
        return state;

      // Validate: space not occupied
      if (
        isSpaceOccupiedNew(
          state,
          action.tileId,
          action.x,
          action.y,
          action.pieceId,
        )
      )
        return state;

      // Note: Movement validation (is this a valid move for this piece type?)
      // should be done by piece classes before dispatching. The reducer trusts
      // that the caller has validated the move is legal for the piece.

      // Update the appropriate array based on piece type
      if (piece.type === "mother" && state.mother) {
        return {
          ...state,
          mother: {
            ...state.mother,
            tileId: action.tileId,
            x: action.x,
            y: action.y,
          },
        };
      } else if (piece.type === "baby") {
        return {
          ...state,
          babies: state.babies.map((b) =>
            b.id === action.pieceId
              ? { ...b, tileId: action.tileId, x: action.x, y: action.y }
              : b,
          ),
        };
      } else if (piece.type === "scientist") {
        return {
          ...state,
          scientists: state.scientists.map((s) =>
            s.id === action.pieceId
              ? { ...s, tileId: action.tileId, x: action.x, y: action.y }
              : s,
          ),
        };
      }
      return state;
    }

    case "START_GAME": {
      // Validate: must be in scientist setup phase with 4 scientists placed
      if (state.phase !== "SCIENTIST_SETUP") return state;
      if (state.scientists.length !== 4) return state;

      // Go to scientist ready screen first (scientist picks first)
      return {
        ...state,
        phase: "SCIENTIST_READY",
      };
    }

    case "PLAYER_READY": {
      if (action.player === "scientist" && state.phase === "SCIENTIST_READY") {
        return {
          ...state,
          phase: "SCIENTIST_CARD_SELECTION",
        };
      }
      if (action.player === "raptor" && state.phase === "RAPTOR_READY") {
        return {
          ...state,
          phase: "RAPTOR_CARD_SELECTION",
        };
      }
      return state;
    }

    case "DRAW_CARDS": {
      if (action.player === "raptor") {
        return {
          ...state,
          raptorCards: drawCards(state.raptorCards),
        };
      } else {
        return {
          ...state,
          scientistCards: drawCards(state.scientistCards),
        };
      }
    }

    case "PLAY_CARD": {
      if (
        action.player === "scientist" &&
        state.phase === "SCIENTIST_CARD_SELECTION"
      ) {
        // Remove card from hand and set as played
        const newHand = state.scientistCards.hand.filter(
          (c) => c !== action.card,
        );
        return {
          ...state,
          scientistCards: {
            ...state.scientistCards,
            hand: newHand,
            played: action.card,
          },
          phase: "RAPTOR_READY",
        };
      }
      if (
        action.player === "raptor" &&
        state.phase === "RAPTOR_CARD_SELECTION"
      ) {
        // Remove card from hand and set as played
        const newHand = state.raptorCards.hand.filter((c) => c !== action.card);
        return {
          ...state,
          raptorCards: {
            ...state.raptorCards,
            hand: newHand,
            played: action.card,
          },
          phase: "CARD_REVEAL",
        };
      }
      return state;
    }

    case "CONFIRM_REVEAL": {
      if (state.phase !== "CARD_REVEAL") return state;

      const scientistCard = state.scientistCards.played;
      const raptorCard = state.raptorCards.played;

      // If same cards, go to round end (nothing happens)
      if (scientistCard === raptorCard) {
        return { ...state, phase: "ROUND_END" };
      }

      // Lower card player uses their special effect first
      if (scientistCard !== null && raptorCard !== null) {
        return { ...state, phase: "EFFECT_PHASE" };
      }

      return state;
    }

    case "FRIGHTEN_SCIENTISTS": {
      if (state.phase !== "EFFECT_PHASE") return state;

      // Must be raptor's effect (raptor had lower card)
      const { scientistCards, raptorCards } = state;
      if (scientistCards.played === null || raptorCards.played === null)
        return state;
      if (raptorCards.played >= scientistCards.played) return state;

      // Validate all targets are valid scientists
      const validTargets = action.pieceIds.filter((id) => {
        const scientist = findById(state.scientists, id);
        return scientist && !scientist.isFrightened;
      });

      // Frighten the scientists
      const newStateAfterFrighten = {
        ...state,
        scientists: state.scientists.map((s) =>
          validTargets.includes(s.id) ? { ...s, isFrightened: true } : s,
        ),
        frightenedThisRound: [...state.frightenedThisRound, ...validTargets],
      };
      return {
        ...newStateAfterFrighten,
        ...transitionToActionPhase(newStateAfterFrighten),
      };
    }

    case "PUT_BABIES_TO_SLEEP": {
      if (state.phase !== "EFFECT_PHASE") return state;

      // Must be scientist's effect (scientist had lower card)
      const { scientistCards, raptorCards } = state;
      if (scientistCards.played === null || raptorCards.played === null)
        return state;
      if (scientistCards.played >= raptorCards.played) return state;

      // Validate all targets are valid babies
      const validTargets = action.pieceIds.filter((id) => {
        const baby = findById(state.babies, id);
        return baby && !baby.isAsleep;
      });

      // Put the babies to sleep
      const newStateAfterSleep = {
        ...state,
        babies: state.babies.map((b) =>
          validTargets.includes(b.id) ? { ...b, isAsleep: true } : b,
        ),
        asleepThisRound: [...state.asleepThisRound, ...validTargets],
      };
      return {
        ...newStateAfterSleep,
        ...transitionToActionPhase(newStateAfterSleep),
      };
    }

    case "MOTHERS_CALL": {
      if (state.phase !== "EFFECT_PHASE") return state;

      // Must be raptor's effect (raptor had lower card)
      const { scientistCards, raptorCards } = state;
      if (scientistCards.played === null || raptorCards.played === null)
        return state;
      if (raptorCards.played >= scientistCards.played) return state;

      // Find mother
      if (!state.mother) return state;

      // Process each move, updating babies as we go
      let updatedBabies = [...state.babies];

      for (const move of action.moves) {
        // Validate the baby exists
        const baby = findById(updatedBabies, move.babyId);
        if (!baby) continue;

        // Validate destination is on mother's tile
        if (move.destinationTileId !== state.mother.tileId) continue;

        // Validate the destination is reachable via pathfinding
        const allPieces = getAllPieces({ ...state, babies: updatedBabies });
        const reachable = getReachableDestinationsOnMotherTile(
          state.tiles,
          allPieces,
          baby,
          state.mother,
        );

        const isValidDestination = reachable.some(
          (pos) =>
            pos.tileId === move.destinationTileId &&
            pos.x === move.destinationX &&
            pos.y === move.destinationY,
        );

        if (!isValidDestination) continue;

        // Move the baby
        updatedBabies = updatedBabies.map((b) =>
          b.id === move.babyId
            ? {
                ...b,
                tileId: move.destinationTileId,
                x: move.destinationX,
                y: move.destinationY,
              }
            : b,
        );
      }

      const newStateAfterMothersCall = {
        ...state,
        babies: updatedBabies,
      };
      return {
        ...newStateAfterMothersCall,
        ...transitionToActionPhase(newStateAfterMothersCall),
      };
    }

    case "DISAPPEARANCE": {
      if (state.phase !== "EFFECT_PHASE") return state;

      // Must be raptor's effect (raptor had lower card)
      const { scientistCards, raptorCards } = state;
      if (scientistCards.played === null || raptorCards.played === null)
        return state;
      if (raptorCards.played >= scientistCards.played) return state;

      // Mother must exist
      if (!state.mother) return state;

      // Remove mother from the board (she'll be replaced after opponent acts)
      const newStateAfterDisappearance = {
        ...state,
        mother: null,
      };
      return {
        ...newStateAfterDisappearance,
        ...transitionToActionPhase(newStateAfterDisappearance),
      };
    }

    case "WAKE_BABIES": {
      if (state.phase !== "EFFECT_PHASE") return state;

      // Must be raptor's effect (raptor had lower card)
      const { scientistCards, raptorCards } = state;
      if (scientistCards.played === null || raptorCards.played === null)
        return state;
      if (raptorCards.played >= scientistCards.played) return state;

      // Validate all targets are sleeping babies
      const validTargets = action.pieceIds.filter((id) => {
        const baby = findById(state.babies, id);
        return baby && baby.isAsleep;
      });

      // Wake up the babies
      const newStateAfterWake = {
        ...state,
        babies: state.babies.map((b) =>
          validTargets.includes(b.id) ? { ...b, isAsleep: false } : b,
        ),
      };
      return {
        ...newStateAfterWake,
        ...transitionToActionPhase(newStateAfterWake),
      };
    }

    case "REINFORCEMENTS": {
      if (state.phase !== "EFFECT_PHASE") return state;

      // Must be scientist's effect (scientist had lower card)
      const { scientistCards, raptorCards } = state;
      if (scientistCards.played === null || raptorCards.played === null)
        return state;
      if (scientistCards.played >= raptorCards.played) return state;

      // Check if we have scientists in reserve
      if (state.scientistReserve <= 0) return state;

      // Top row squares (1, 2, 3) have long edge at y=0
      // Bottom row squares (6, 7, 8) have long edge at y=2
      const topRowTiles = [1, 2, 3];
      const bottomRowTiles = [6, 7, 8];

      // Validate and place each scientist
      let updatedScientists = [...state.scientists];
      let remainingReserve = state.scientistReserve;

      for (const placement of action.placements) {
        if (remainingReserve <= 0) break;

        const tile = state.tiles.find((t) => t.id === placement.tileId);
        if (!tile || tile.shape !== "square") continue;

        // Check if on long edge
        const isTopRow = topRowTiles.includes(placement.tileId);
        const isBottomRow = bottomRowTiles.includes(placement.tileId);
        if (!isTopRow && !isBottomRow) continue;

        const requiredY = isTopRow ? 0 : 2;
        if (placement.y !== requiredY) continue;

        // Check space is valid
        const space = tile.spaces.find(
          (s) =>
            s.coordinate.x === placement.x && s.coordinate.y === placement.y,
        );
        if (!space || space.hasMountain) continue;

        // Check space is not occupied
        const tempState = { ...state, scientists: updatedScientists };
        if (
          isSpaceOccupiedNew(
            tempState,
            placement.tileId,
            placement.x,
            placement.y,
          )
        )
          continue;

        // Place the scientist
        const newScientist: PieceState = {
          id: `scientist-${updatedScientists.length}`,
          type: "scientist",
          tileId: placement.tileId,
          x: placement.x,
          y: placement.y,
        };
        updatedScientists = [...updatedScientists, newScientist];
        remainingReserve--;
      }

      const newStateAfterReinforcements = {
        ...state,
        scientists: updatedScientists,
        scientistReserve: remainingReserve,
      };
      return {
        ...newStateAfterReinforcements,
        ...transitionToActionPhase(newStateAfterReinforcements),
      };
    }

    case "PLACE_FIRE": {
      if (state.phase !== "EFFECT_PHASE") return state;

      // Must be scientist's effect (scientist had lower card)
      const { scientistCards, raptorCards } = state;
      if (scientistCards.played === null || raptorCards.played === null)
        return state;
      if (scientistCards.played >= raptorCards.played) return state;

      // Validate and place each fire token
      let updatedFireTokens = [...state.fireTokens];

      for (const placement of action.placements) {
        const tile = state.tiles.find((t) => t.id === placement.tileId);
        if (!tile) continue;

        // Check space is valid (not mountain, not unusable, not exit)
        const space = tile.spaces.find(
          (s) =>
            s.coordinate.x === placement.x && s.coordinate.y === placement.y,
        );
        if (!space || space.hasMountain || space.isUnusable || space.isExit)
          continue;

        // Check no fire already at this location
        const hasFireAlready = updatedFireTokens.some(
          (f) =>
            f.tileId === placement.tileId &&
            f.x === placement.x &&
            f.y === placement.y,
        );
        if (hasFireAlready) continue;

        // Check placement is adjacent to a scientist or existing fire (using global coords for cross-tile adjacency)
        const placementGlobal = localToGlobal(
          placement.tileId,
          placement.x,
          placement.y,
        );
        const adjacentGlobals = getAdjacentGlobalCoordinates(
          placementGlobal.globalX,
          placementGlobal.globalY,
        );

        const isAdjacentToScientist = state.scientists.some((s) => {
          const sGlobal = localToGlobal(s.tileId, s.x, s.y);
          return adjacentGlobals.some(
            (adj) =>
              adj.globalX === sGlobal.globalX &&
              adj.globalY === sGlobal.globalY,
          );
        });

        const isAdjacentToFire = updatedFireTokens.some((f) => {
          const fGlobal = localToGlobal(f.tileId, f.x, f.y);
          return adjacentGlobals.some(
            (adj) =>
              adj.globalX === fGlobal.globalX &&
              adj.globalY === fGlobal.globalY,
          );
        });

        if (!isAdjacentToScientist && !isAdjacentToFire) continue;

        // Place the fire token
        const newFire = {
          id: `fire-${updatedFireTokens.length}`,
          tileId: placement.tileId,
          x: placement.x,
          y: placement.y,
        };
        updatedFireTokens = [...updatedFireTokens, newFire];
      }

      const newStateAfterFire = {
        ...state,
        fireTokens: updatedFireTokens,
      };
      return {
        ...newStateAfterFire,
        ...transitionToActionPhase(newStateAfterFire),
      };
    }

    case "JEEP_MOVES": {
      if (state.phase !== "EFFECT_PHASE") return state;

      // Must be scientist's effect (scientist had lower card)
      const { scientistCards: sc, raptorCards: rc } = state;
      if (sc.played === null || rc.played === null) return state;
      if (sc.played >= rc.played) return state;

      let updatedScientists = [...state.scientists];
      let updatedFireTokens = [...state.fireTokens];

      for (const move of action.moves) {
        // Move the scientist to the destination
        updatedScientists = updatedScientists.map((s) =>
          s.id === move.scientistId
            ? { ...s, tileId: move.toTileId, x: move.toX, y: move.toY }
            : s,
        );

        // Extinguish fires along the path (including destination)
        const allPositions = [
          ...move.path,
          { tileId: move.toTileId, x: move.toX, y: move.toY },
        ];
        for (const pos of allPositions) {
          updatedFireTokens = updatedFireTokens.filter(
            (f) => !(f.tileId === pos.tileId && f.x === pos.x && f.y === pos.y),
          );
        }
      }

      const newStateAfterJeep = {
        ...state,
        scientists: updatedScientists,
        fireTokens: updatedFireTokens,
      };
      return {
        ...newStateAfterJeep,
        ...transitionToActionPhase(newStateAfterJeep),
      };
    }

    case "END_EFFECT_PHASE": {
      if (state.phase !== "EFFECT_PHASE") return state;
      return { ...state, ...transitionToActionPhase(state) };
    }

    case "DEV_SKIP_TO_EFFECT": {
      // Dev-only: Skip directly to effect phase with specified cards
      // Auto-setup pieces if needed
      const newState = devAutoSetup(state);

      // Set cards and phase
      return {
        ...newState,
        phase: "EFFECT_PHASE",
        scientistCards: {
          ...newState.scientistCards,
          played: action.scientistCard,
          hand: newState.scientistCards.hand.filter(
            (c) => c !== action.scientistCard,
          ),
        },
        raptorCards: {
          ...newState.raptorCards,
          played: action.raptorCard,
          hand: newState.raptorCards.hand.filter(
            (c) => c !== action.raptorCard,
          ),
        },
      };
    }

    case "DEV_SKIP_TO_ACTION": {
      // Dev-only: Skip directly to action phase with 8 action points for specified player
      const newState = devAutoSetup(state);

      // Set up action phase with 8 action points (9 - 1 = 8)
      // Simulates: one player played 1, other played 9, effect skipped
      const raptorCard = action.player === "raptor" ? 9 : 1;
      const scientistCard = action.player === "scientist" ? 9 : 1;

      return {
        ...newState,
        phase: "ACTION_PHASE",
        scientistCards: {
          ...newState.scientistCards,
          played: scientistCard,
          hand: newState.scientistCards.hand.filter((c) => c !== scientistCard),
        },
        raptorCards: {
          ...newState.raptorCards,
          played: raptorCard,
          hand: newState.raptorCards.hand.filter((c) => c !== raptorCard),
        },
        actionPoints: 8,
        activePlayer: action.player,
      };
    }

    // ========== ACTION PHASE ACTIONS ==========

    case "ACTION_MOVE_BABY": {
      // Validate: must be in action phase
      if (state.phase !== "ACTION_PHASE") return state;

      // Validate: raptor must be the active player
      if (state.activePlayer !== "raptor") return state;

      // Validate: must have action points
      if (state.actionPoints <= 0) return state;

      // Find the baby
      const baby = state.babies.find((b) => b.id === action.pieceId);
      if (!baby) return state;

      // Baby can't move if asleep
      if (baby.isAsleep) return state;

      // Validate the move using BabyRaptor class
      const allPieces = getAllPieces(state);
      const babyPiece = new BabyRaptor(baby.id, baby.tileId, baby.x, baby.y);
      const validMoves = babyPiece.getValidMoves(state.tiles, allPieces);

      const isValidMove = validMoves.some(
        (m) =>
          m.tileId === action.tileId && m.x === action.x && m.y === action.y,
      );
      if (!isValidMove) return state;

      // Check target space is not occupied
      if (isSpaceOccupiedNew(state, action.tileId, action.x, action.y))
        return state;

      // Check if this is an exit space (baby escapes)
      const targetTile = state.tiles.find((t) => t.id === action.tileId);
      const targetSpace = targetTile?.spaces.find(
        (s) => s.coordinate.x === action.x && s.coordinate.y === action.y,
      );
      const isExit = targetSpace?.isExit ?? false;

      if (isExit) {
        // Baby escapes - remove from board and increment escaped count
        return {
          ...state,
          babies: state.babies.filter((b) => b.id !== action.pieceId),
          escapedBabies: state.escapedBabies + 1,
          actionPoints: state.actionPoints - 1,
        };
      }

      // Normal move
      return {
        ...state,
        babies: state.babies.map((b) =>
          b.id === action.pieceId
            ? { ...b, tileId: action.tileId, x: action.x, y: action.y }
            : b,
        ),
        actionPoints: state.actionPoints - 1,
      };
    }

    case "ACTION_MOVE_SCIENTIST": {
      // Validate: must be in action phase
      if (state.phase !== "ACTION_PHASE") return state;

      // Validate: scientist must be the active player
      if (state.activePlayer !== "scientist") return state;

      // Validate: must have action points
      if (state.actionPoints <= 0) return state;

      // Find the scientist
      const scientist = state.scientists.find((s) => s.id === action.pieceId);
      if (!scientist) return state;

      // Scientist can't move if frightened
      if (scientist.isFrightened) return state;

      // Validate the move using Scientist class (normal mode, not jeep)
      const allPieces = getAllPieces(state);
      const scientistPiece = new Scientist(
        scientist.id,
        scientist.tileId,
        scientist.x,
        scientist.y,
      );
      const validMoves = scientistPiece.getValidMoves(state.tiles, allPieces);

      const isValidMove = validMoves.some(
        (m) =>
          m.tileId === action.tileId && m.x === action.x && m.y === action.y,
      );
      if (!isValidMove) return state;

      // Check target space is not occupied
      if (isSpaceOccupiedNew(state, action.tileId, action.x, action.y))
        return state;

      // Check scientist can't end on fire
      const hasFireAtTarget = state.fireTokens.some(
        (f) =>
          f.tileId === action.tileId && f.x === action.x && f.y === action.y,
      );
      if (hasFireAtTarget) return state;

      return {
        ...state,
        scientists: state.scientists.map((s) =>
          s.id === action.pieceId
            ? { ...s, tileId: action.tileId, x: action.x, y: action.y }
            : s,
        ),
        actionPoints: state.actionPoints - 1,
      };
    }

    case "ACTION_MOVE_MOTHER": {
      // Validate: must be in action phase
      if (state.phase !== "ACTION_PHASE") return state;

      // Validate: raptor must be the active player
      if (state.activePlayer !== "raptor") return state;

      // Find the mother
      if (!state.mother) return state;

      // Calculate wound cost: mother must pay AP = sleep tokens before first movement
      const woundCost = state.motherPaidWoundCost ? 0 : state.motherSleepTokens;
      const totalCost = woundCost + 1; // wound cost + 1 for the move itself

      // Validate: must have enough action points
      if (state.actionPoints < totalCost) return state;

      // Validate the move using MotherRaptor class
      const allPieces = getAllPieces(state);
      const motherPiece = new MotherRaptor(
        state.mother.id,
        state.mother.tileId,
        state.mother.x,
        state.mother.y,
      );
      const validMoves = motherPiece.getValidMoves(
        state.tiles,
        allPieces,
        state.fireTokens,
      );

      const isValidMove = validMoves.some(
        (m) =>
          m.tileId === action.tileId && m.x === action.x && m.y === action.y,
      );
      if (!isValidMove) return state;

      // Check target space is not occupied
      if (isSpaceOccupiedNew(state, action.tileId, action.x, action.y))
        return state;

      // Check mother can't end on fire
      const hasFireAtTarget = state.fireTokens.some(
        (f) =>
          f.tileId === action.tileId && f.x === action.x && f.y === action.y,
      );
      if (hasFireAtTarget) return state;

      return {
        ...state,
        mother: {
          ...state.mother,
          tileId: action.tileId,
          x: action.x,
          y: action.y,
        },
        actionPoints: state.actionPoints - totalCost,
        motherPaidWoundCost: true, // Mark that wound cost has been paid
      };
    }

    case "ACTION_MOTHER_KILL_SCIENTIST": {
      if (state.phase !== "ACTION_PHASE") return state;
      if (state.activePlayer !== "raptor") return state;
      if (state.actionPoints <= 0) return state;

      const mother = state.mother;
      const scientist = state.scientists.find((s) => s.id === action.targetId);
      if (!mother || !scientist) return state;

      // Must be adjacent
      if (!arePiecesAdjacent(state.tiles, mother, scientist)) return state;

      // Remove the scientist from the game (killed, not returned to reserve)
      return {
        ...state,
        scientists: state.scientists.filter((s) => s.id !== action.targetId),
        actionPoints: state.actionPoints - 1,
      };
    }

    case "ACTION_MOTHER_WAKE_BABY": {
      if (state.phase !== "ACTION_PHASE") return state;
      if (state.activePlayer !== "raptor") return state;
      if (state.actionPoints <= 0) return state;

      const mother = state.mother;
      const baby = state.babies.find((b) => b.id === action.targetId);
      if (!mother || !baby) return state;

      // Baby must be asleep
      if (!baby.isAsleep) return state;

      // Can't wake up if put to sleep this round
      if (state.asleepThisRound.includes(action.targetId)) return state;

      // Must be adjacent
      if (!arePiecesAdjacent(state.tiles, mother, baby)) return state;

      return {
        ...state,
        babies: state.babies.map((b) =>
          b.id === action.targetId ? { ...b, isAsleep: false } : b,
        ),
        actionPoints: state.actionPoints - 1,
      };
    }

    case "ACTION_MOTHER_EXTINGUISH_FIRE": {
      if (state.phase !== "ACTION_PHASE") return state;
      if (state.activePlayer !== "raptor") return state;
      if (state.actionPoints <= 0) return state;

      const mother = state.mother;
      if (!mother) return state;

      // Check if there's a fire at the target position
      const targetFire = state.fireTokens.find(
        (f) =>
          f.tileId === action.tileId && f.x === action.x && f.y === action.y,
      );
      if (!targetFire) return state;

      // Mother must be adjacent to the fire
      const motherGlobal = localToGlobal(mother.tileId, mother.x, mother.y);
      const fireGlobal = localToGlobal(action.tileId, action.x, action.y);
      const adjacentCoords = getAdjacentGlobalCoordinates(
        motherGlobal.globalX,
        motherGlobal.globalY,
      );
      const isAdjacent = adjacentCoords.some(
        (adj) =>
          adj.globalX === fireGlobal.globalX &&
          adj.globalY === fireGlobal.globalY,
      );
      if (!isAdjacent) return state;

      // Get all connected fires and remove them
      const connectedFires = getConnectedFires(
        state.fireTokens,
        action.tileId,
        action.x,
        action.y,
      );
      const connectedFireIds = new Set(connectedFires.map((f) => f.id));

      return {
        ...state,
        fireTokens: state.fireTokens.filter((f) => !connectedFireIds.has(f.id)),
        actionPoints: state.actionPoints - 1,
      };
    }

    case "ACTION_SCIENTIST_SLEEP_BABY": {
      if (state.phase !== "ACTION_PHASE") return state;
      if (state.activePlayer !== "scientist") return state;
      if (state.actionPoints <= 0) return state;

      const scientist = state.scientists.find(
        (s) => s.id === action.scientistId,
      );
      const baby = state.babies.find((b) => b.id === action.targetId);
      if (!scientist || !baby) return state;

      // Scientist can't act if frightened
      if (scientist.isFrightened) return state;

      // Scientist can only use one aggressive action per round
      if (state.aggressiveActionsUsed.includes(action.scientistId))
        return state;

      // Baby must not already be asleep
      if (baby.isAsleep) return state;

      // Must be adjacent
      if (!arePiecesAdjacent(state.tiles, scientist, baby)) return state;

      return {
        ...state,
        babies: state.babies.map((b) =>
          b.id === action.targetId ? { ...b, isAsleep: true } : b,
        ),
        actionPoints: state.actionPoints - 1,
        aggressiveActionsUsed: [
          ...state.aggressiveActionsUsed,
          action.scientistId,
        ],
      };
    }

    case "ACTION_SCIENTIST_CAPTURE_BABY": {
      if (state.phase !== "ACTION_PHASE") return state;
      if (state.activePlayer !== "scientist") return state;
      if (state.actionPoints <= 0) return state;

      const scientist = state.scientists.find(
        (s) => s.id === action.scientistId,
      );
      const baby = state.babies.find((b) => b.id === action.targetId);
      if (!scientist || !baby) return state;

      // Scientist can't act if frightened
      if (scientist.isFrightened) return state;

      // Scientist can only use one aggressive action per round
      if (state.aggressiveActionsUsed.includes(action.scientistId))
        return state;

      // Baby must be asleep to capture
      if (!baby.isAsleep) return state;

      // Must be adjacent
      if (!arePiecesAdjacent(state.tiles, scientist, baby)) return state;

      // Remove baby and increment captured count
      return {
        ...state,
        babies: state.babies.filter((b) => b.id !== action.targetId),
        capturedBabies: state.capturedBabies + 1,
        actionPoints: state.actionPoints - 1,
        aggressiveActionsUsed: [
          ...state.aggressiveActionsUsed,
          action.scientistId,
        ],
      };
    }

    case "ACTION_SCIENTIST_SHOOT_MOTHER": {
      if (state.phase !== "ACTION_PHASE") return state;
      if (state.activePlayer !== "scientist") return state;
      if (state.actionPoints <= 0) return state;

      const scientist = state.scientists.find(
        (s) => s.id === action.scientistId,
      );
      const mother = state.mother;
      if (!scientist || !mother) return state;

      // Scientist can't act if frightened
      if (scientist.isFrightened) return state;

      // Scientist can only use one aggressive action per round
      if (state.aggressiveActionsUsed.includes(action.scientistId))
        return state;

      // Must have line of sight
      if (!hasLineOfSight(state, scientist, mother)) return state;

      return {
        ...state,
        motherSleepTokens: state.motherSleepTokens + 1,
        actionPoints: state.actionPoints - 1,
        aggressiveActionsUsed: [
          ...state.aggressiveActionsUsed,
          action.scientistId,
        ],
      };
    }

    case "ACTION_SCIENTIST_STAND_UP": {
      if (state.phase !== "ACTION_PHASE") return state;
      if (state.activePlayer !== "scientist") return state;
      if (state.actionPoints <= 0) return state;

      const scientist = state.scientists.find(
        (s) => s.id === action.scientistId,
      );
      if (!scientist) return state;

      // Scientist must be frightened to stand up
      if (!scientist.isFrightened) return state;

      // Can't stand up if frightened this round
      if (state.frightenedThisRound.includes(action.scientistId)) return state;

      return {
        ...state,
        scientists: state.scientists.map((s) =>
          s.id === action.scientistId ? { ...s, isFrightened: false } : s,
        ),
        actionPoints: state.actionPoints - 1,
      };
    }

    case "END_ACTION_PHASE": {
      if (state.phase !== "ACTION_PHASE") return state;

      // Transition to next round - reset for new card selection
      return {
        ...state,
        phase: "SCIENTIST_READY",
        actionPoints: 0,
        activePlayer: null,
        aggressiveActionsUsed: [], // Reset for next round
        frightenedThisRound: [], // Reset for next round
        asleepThisRound: [], // Reset for next round
        motherPaidWoundCost: false, // Reset for next round
        // Clear played cards for new round
        scientistCards: {
          ...state.scientistCards,
          played: null,
        },
        raptorCards: {
          ...state.raptorCards,
          played: null,
        },
      };
    }

    case "RESET_ACTION_PHASE": {
      if (state.phase !== "ACTION_PHASE") return state;

      // Restore the saved state from the start of the action phase
      return {
        ...state,
        mother: action.savedState.mother,
        babies: action.savedState.babies,
        scientists: action.savedState.scientists,
        fireTokens: action.savedState.fireTokens,
        actionPoints: action.savedState.actionPoints,
      };
    }

    default:
      return state;
  }
}
