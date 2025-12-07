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
import { Scientist } from "../pieces/Scientist.ts";

// Action types
export type GameAction =
  | { type: "PLACE_SCIENTIST"; tileId: number; x: number; y: number }
  | { type: "PLACE_MOTHER"; tileId: number; x: number; y: number }
  | { type: "PLACE_BABY"; tileId: number; x: number; y: number }
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
  | { type: "END_ACTION_PHASE" };

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

// Helper to check if a space is occupied
function isSpaceOccupied(
  pieces: PieceState[],
  tileId: number,
  x: number,
  y: number,
  excludePieceId?: string,
): boolean {
  return pieces.some(
    (p) =>
      p.tileId === tileId && p.x === x && p.y === y && p.id !== excludePieceId,
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

// Helper to check if tile already has a raptor
function tileHasRaptor(pieces: PieceState[], tileId: number): boolean {
  return pieces.some(
    (p) => (p.type === "mother" || p.type === "baby") && p.tileId === tileId,
  );
}

// Helper to check if tile already has a scientist
function tileHasScientist(pieces: PieceState[], tileId: number): boolean {
  return pieces.some((p) => p.type === "scientist" && p.tileId === tileId);
}

// Generate unique piece ID
function generatePieceId(type: string, pieces: PieceState[]): string {
  const existingOfType = pieces.filter((p) => p.id.startsWith(type));
  return `${type}-${existingOfType.length}`;
}

// Check if raptor setup is complete (mother + 5 babies placed)
function isRaptorSetupComplete(state: GameState): boolean {
  const mother = state.pieces.find((p) => p.type === "mother");
  const babies = state.pieces.filter((p) => p.type === "baby");
  return mother !== undefined && babies.length === 5;
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
      if (tileHasScientist(state.pieces, action.tileId)) return state;

      // Validate: space not occupied
      if (isSpaceOccupied(state.pieces, action.tileId, action.x, action.y))
        return state;

      const newPiece: PieceState = {
        id: generatePieceId("scientist", state.pieces),
        type: "scientist",
        tileId: action.tileId,
        x: action.x,
        y: action.y,
      };

      return {
        ...state,
        pieces: [...state.pieces, newPiece],
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
      if (tileHasRaptor(state.pieces, action.tileId)) return state;

      // Validate: space not occupied
      if (isSpaceOccupied(state.pieces, action.tileId, action.x, action.y))
        return state;

      const newPiece: PieceState = {
        id: "mother",
        type: "mother",
        tileId: action.tileId,
        x: action.x,
        y: action.y,
      };

      const newState = {
        ...state,
        pieces: [...state.pieces, newPiece],
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
      if (tileHasRaptor(state.pieces, action.tileId)) return state;

      // Validate: must leave at least one central tile free for mother (if mother not yet placed)
      const centralTiles = [2, 7];
      const motherPlaced = state.pieces.some((p) => p.type === "mother");
      if (centralTiles.includes(action.tileId) && !motherPlaced) {
        const babiesOnCentralTiles = state.pieces.filter(
          (p) => p.type === "baby" && centralTiles.includes(p.tileId),
        );
        // If one central tile already has a baby, can't place on the other (must leave one for mother)
        if (babiesOnCentralTiles.length >= 1) return state;
      }

      // Validate: space not occupied
      if (isSpaceOccupied(state.pieces, action.tileId, action.x, action.y))
        return state;

      const newPiece: PieceState = {
        id: generatePieceId("baby", state.pieces),
        type: "baby",
        tileId: action.tileId,
        x: action.x,
        y: action.y,
      };

      const newState = {
        ...state,
        pieces: [...state.pieces, newPiece],
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

    case "START_GAME": {
      // Validate: must be in scientist setup phase with 4 scientists placed
      if (state.phase !== "SCIENTIST_SETUP") return state;
      const scientistsPlaced = state.pieces.filter(
        (p) => p.type === "scientist",
      ).length;
      if (scientistsPlaced !== 4) return state;

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
        const scientist = state.pieces.find(
          (p) => p.id === id && p.type === "scientist",
        );
        return scientist && !scientist.isFrightened;
      });

      // Frighten the scientists
      const newStateAfterFrighten = {
        ...state,
        pieces: state.pieces.map((p) =>
          validTargets.includes(p.id) ? { ...p, isFrightened: true } : p,
        ),
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
        const baby = state.pieces.find((p) => p.id === id && p.type === "baby");
        return baby && !baby.isAsleep;
      });

      // Put the babies to sleep
      const newStateAfterSleep = {
        ...state,
        pieces: state.pieces.map((p) =>
          validTargets.includes(p.id) ? { ...p, isAsleep: true } : p,
        ),
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
      const mother = state.pieces.find((p) => p.type === "mother");
      if (!mother) return state;

      // Process each move, updating pieces as we go
      let updatedPieces = [...state.pieces];

      for (const move of action.moves) {
        // Validate the baby exists
        const baby = updatedPieces.find(
          (p) => p.id === move.babyId && p.type === "baby",
        );
        if (!baby) continue;

        // Validate destination is on mother's tile
        if (move.destinationTileId !== mother.tileId) continue;

        // Validate the destination is reachable via pathfinding
        const reachable = getReachableDestinationsOnMotherTile(
          state.tiles,
          updatedPieces,
          baby,
          mother,
        );

        const isValidDestination = reachable.some(
          (pos) =>
            pos.tileId === move.destinationTileId &&
            pos.x === move.destinationX &&
            pos.y === move.destinationY,
        );

        if (!isValidDestination) continue;

        // Move the baby
        updatedPieces = updatedPieces.map((p) =>
          p.id === move.babyId
            ? {
                ...p,
                tileId: move.destinationTileId,
                x: move.destinationX,
                y: move.destinationY,
              }
            : p,
        );
      }

      const newStateAfterMothersCall = {
        ...state,
        pieces: updatedPieces,
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

      // Find mother and remove her from the board
      const mother = state.pieces.find((p) => p.type === "mother");
      if (!mother) return state;

      // Remove mother from pieces (she'll be replaced after opponent acts)
      const updatedPieces = state.pieces.filter((p) => p.type !== "mother");

      const newStateAfterDisappearance = {
        ...state,
        pieces: updatedPieces,
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
        const baby = state.pieces.find((p) => p.id === id && p.type === "baby");
        return baby && baby.isAsleep;
      });

      // Wake up the babies
      const newStateAfterWake = {
        ...state,
        pieces: state.pieces.map((p) =>
          validTargets.includes(p.id) ? { ...p, isAsleep: false } : p,
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
      let updatedPieces = [...state.pieces];
      let remainingReserve = state.scientistReserve;
      let placedCount = 0;

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
        if (
          isSpaceOccupied(
            updatedPieces,
            placement.tileId,
            placement.x,
            placement.y,
          )
        )
          continue;

        // Place the scientist
        const newScientist: PieceState = {
          id: generatePieceId("scientist", updatedPieces),
          type: "scientist",
          tileId: placement.tileId,
          x: placement.x,
          y: placement.y,
        };
        updatedPieces = [...updatedPieces, newScientist];
        remainingReserve--;
        placedCount++;
      }

      const newStateAfterReinforcements = {
        ...state,
        pieces: updatedPieces,
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

        const isAdjacentToScientist = state.pieces.some((p) => {
          if (p.type !== "scientist") return false;
          const pGlobal = localToGlobal(p.tileId, p.x, p.y);
          return adjacentGlobals.some(
            (adj) =>
              adj.globalX === pGlobal.globalX &&
              adj.globalY === pGlobal.globalY,
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

      let updatedPieces = [...state.pieces];
      let updatedFireTokens = [...state.fireTokens];

      for (const move of action.moves) {
        // Find the scientist
        const scientistIndex = updatedPieces.findIndex(
          (p) => p.id === move.scientistId,
        );
        if (scientistIndex === -1) continue;

        // Move the scientist to the destination
        updatedPieces = updatedPieces.map((p, i) =>
          i === scientistIndex
            ? { ...p, tileId: move.toTileId, x: move.toX, y: move.toY }
            : p,
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
        pieces: updatedPieces,
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
      let newState = { ...state };

      // If no pieces placed, do auto-setup
      if (newState.pieces.length === 0) {
        const squareTiles = newState.tiles.filter((t) => t.shape === "square");
        const lTiles = newState.tiles.filter((t) => t.shape === "L");

        // Place mother on tile 2
        const tile2 = squareTiles.find((t) => t.id === 2)!;
        const motherSpace = tile2.spaces.find((s) => !s.hasMountain)!;
        newState.pieces.push({
          id: "mother",
          type: "mother",
          tileId: 2,
          x: motherSpace.coordinate.x,
          y: motherSpace.coordinate.y,
        });
        newState.holdingPen.mother = 0;

        // Place babies on other square tiles
        const tilesForBabies = squareTiles.filter((t) => t.id !== 2);
        let babyIndex = 0;
        for (const tile of tilesForBabies) {
          if (babyIndex >= 5) break;
          const space = tile.spaces.find((s) => !s.hasMountain)!;
          newState.pieces.push({
            id: `baby-${babyIndex}`,
            type: "baby",
            tileId: tile.id,
            x: space.coordinate.x,
            y: space.coordinate.y,
          });
          babyIndex++;
        }
        newState.holdingPen.babies = 0;

        // Place scientists on L-tiles
        let scientistIndex = 0;
        for (const tile of lTiles) {
          if (scientistIndex >= 4) break;
          const space = tile.spaces.find((s) => !s.isExit && !s.isUnusable)!;
          newState.pieces.push({
            id: `scientist-${scientistIndex}`,
            type: "scientist",
            tileId: tile.id,
            x: space.coordinate.x,
            y: space.coordinate.y,
          });
          scientistIndex++;
        }
        newState.holdingPen.scientists = 0;
      }

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

    // ========== ACTION PHASE ACTIONS ==========

    case "ACTION_MOVE_BABY": {
      // Validate: must be in action phase
      if (state.phase !== "ACTION_PHASE") return state;

      // Validate: raptor must be the active player
      if (state.activePlayer !== "raptor") return state;

      // Validate: must have action points
      if (state.actionPoints <= 0) return state;

      // Find the baby
      const baby = state.pieces.find(
        (p) => p.id === action.pieceId && p.type === "baby",
      );
      if (!baby) return state;

      // Baby can't move if asleep
      if (baby.isAsleep) return state;

      // Validate the move using BabyRaptor class
      const babyPiece = new BabyRaptor(baby.id, baby.tileId, baby.x, baby.y);
      const validMoves = babyPiece.getValidMoves(state.tiles, state.pieces);

      const isValidMove = validMoves.some(
        (m) =>
          m.tileId === action.tileId && m.x === action.x && m.y === action.y,
      );
      if (!isValidMove) return state;

      // Check target space is not occupied
      if (isSpaceOccupied(state.pieces, action.tileId, action.x, action.y))
        return state;

      // Check if this is an exit space (baby escapes)
      const targetTile = state.tiles.find((t) => t.id === action.tileId);
      const targetSpace = targetTile?.spaces.find(
        (s) => s.coordinate.x === action.x && s.coordinate.y === action.y,
      );
      const isExit = targetSpace?.isExit ?? false;

      if (isExit) {
        // Baby escapes - remove from board
        return {
          ...state,
          pieces: state.pieces.filter((p) => p.id !== action.pieceId),
          actionPoints: state.actionPoints - 1,
        };
      }

      // Normal move
      return {
        ...state,
        pieces: state.pieces.map((p) =>
          p.id === action.pieceId
            ? { ...p, tileId: action.tileId, x: action.x, y: action.y }
            : p,
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
      const scientist = state.pieces.find(
        (p) => p.id === action.pieceId && p.type === "scientist",
      );
      if (!scientist) return state;

      // Scientist can't move if frightened
      if (scientist.isFrightened) return state;

      // Validate the move using Scientist class (normal mode, not jeep)
      const scientistPiece = new Scientist(
        scientist.id,
        scientist.tileId,
        scientist.x,
        scientist.y,
      );
      const validMoves = scientistPiece.getValidMoves(
        state.tiles,
        state.pieces,
      );

      const isValidMove = validMoves.some(
        (m) =>
          m.tileId === action.tileId && m.x === action.x && m.y === action.y,
      );
      if (!isValidMove) return state;

      // Check target space is not occupied
      if (isSpaceOccupied(state.pieces, action.tileId, action.x, action.y))
        return state;

      // Check scientist can't end on fire
      const hasFireAtTarget = state.fireTokens.some(
        (f) =>
          f.tileId === action.tileId && f.x === action.x && f.y === action.y,
      );
      if (hasFireAtTarget) return state;

      return {
        ...state,
        pieces: state.pieces.map((p) =>
          p.id === action.pieceId
            ? { ...p, tileId: action.tileId, x: action.x, y: action.y }
            : p,
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

    default:
      return state;
  }
}
