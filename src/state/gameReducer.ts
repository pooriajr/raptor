import type { CardState, GameState, PieceState } from "../types/gameState.ts";
import { getReachableDestinationsOnMotherTile } from "../utils/pathfinding.ts";

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
      babyId: string;
      destinationTileId: number;
      destinationX: number;
      destinationY: number;
    }
  | { type: "END_EFFECT_PHASE" };

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

    case "MOVE_PIECE": {
      // Find the piece
      const piece = state.pieces.find((p) => p.id === action.pieceId);
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
        isSpaceOccupied(
          state.pieces,
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

      return {
        ...state,
        pieces: state.pieces.map((p) =>
          p.id === action.pieceId
            ? { ...p, tileId: action.tileId, x: action.x, y: action.y }
            : p,
        ),
      };
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
      return {
        ...state,
        pieces: state.pieces.map((p) =>
          validTargets.includes(p.id) ? { ...p, isFrightened: true } : p,
        ),
        phase: "ACTION_PHASE",
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
      return {
        ...state,
        pieces: state.pieces.map((p) =>
          validTargets.includes(p.id) ? { ...p, isAsleep: true } : p,
        ),
        phase: "ACTION_PHASE",
      };
    }

    case "MOTHERS_CALL": {
      if (state.phase !== "EFFECT_PHASE") return state;

      // Must be raptor's effect (raptor had lower card)
      const { scientistCards, raptorCards } = state;
      if (scientistCards.played === null || raptorCards.played === null)
        return state;
      if (raptorCards.played >= scientistCards.played) return state;

      // Validate the baby exists
      const baby = state.pieces.find(
        (p) => p.id === action.babyId && p.type === "baby",
      );
      if (!baby) return state;

      // Find mother
      const mother = state.pieces.find((p) => p.type === "mother");
      if (!mother) return state;

      // Validate destination is on mother's tile
      if (action.destinationTileId !== mother.tileId) return state;

      // Validate the destination is reachable via pathfinding
      const reachable = getReachableDestinationsOnMotherTile(
        state.tiles,
        state.pieces,
        baby,
        mother,
      );

      const isValidDestination = reachable.some(
        (pos) =>
          pos.tileId === action.destinationTileId &&
          pos.x === action.destinationX &&
          pos.y === action.destinationY,
      );

      if (!isValidDestination) return state;

      // Move the baby
      return {
        ...state,
        pieces: state.pieces.map((p) =>
          p.id === action.babyId
            ? {
                ...p,
                tileId: action.destinationTileId,
                x: action.destinationX,
                y: action.destinationY,
              }
            : p,
        ),
        phase: "ACTION_PHASE",
      };
    }

    case "END_EFFECT_PHASE": {
      if (state.phase !== "EFFECT_PHASE") return state;
      return { ...state, phase: "ACTION_PHASE" };
    }

    default:
      return state;
  }
}
