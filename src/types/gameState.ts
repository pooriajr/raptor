import type { Tile } from "./board.ts";
import { createBoard } from "./board.ts";

// Game phases - raptor sets up first, then scientist, then card selection begins
export type GamePhase =
  | "RAPTOR_SETUP"
  | "SCIENTIST_SETUP"
  | "SCIENTIST_READY"
  | "SCIENTIST_CARD_SELECTION"
  | "RAPTOR_READY"
  | "RAPTOR_CARD_SELECTION";

// Piece types as plain data (not class instances)
export type PieceType = "mother" | "baby" | "scientist";

export interface PieceState {
  id: string;
  type: PieceType;
  tileId: number;
  x: number;
  y: number;
}

// Holding pen tracks how many of each piece type are available to place
export interface HoldingPen {
  scientists: number;
  babies: number;
  mother: number;
}

// Card state for each player
export interface CardState {
  deck: number[]; // Card values 1-9 remaining in deck
  hand: number[]; // Card values currently in hand (up to 3)
  played: number | null; // Card played this round
}

export interface GameState {
  phase: GamePhase;
  tiles: Tile[];
  pieces: PieceState[];
  holdingPen: HoldingPen;
  raptorCards: CardState;
  scientistCards: CardState;
}

// Initial holding pen state for setup
export function createInitialHoldingPen(): HoldingPen {
  return {
    scientists: 10,
    babies: 5,
    mother: 1,
  };
}

// Create a shuffled deck of cards 1-9
export function createShuffledDeck(): number[] {
  const deck = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// Create initial card state with full shuffled deck
export function createInitialCardState(): CardState {
  return {
    deck: createShuffledDeck(),
    hand: [],
    played: null,
  };
}

// Create initial game state - raptor sets up first
export function createInitialGameState(): GameState {
  return {
    phase: "RAPTOR_SETUP",
    tiles: createBoard(),
    pieces: [],
    holdingPen: createInitialHoldingPen(),
    raptorCards: createInitialCardState(),
    scientistCards: createInitialCardState(),
  };
}
