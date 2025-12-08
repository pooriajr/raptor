import type { Tile } from "./board.ts";
import { createBoard } from "./board.ts";

// Game phases - raptor sets up first, then scientist, then card selection begins
export type GamePhase =
  | "RAPTOR_SETUP"
  | "SCIENTIST_SETUP"
  | "SCIENTIST_READY"
  | "SCIENTIST_CARD_SELECTION"
  | "RAPTOR_READY"
  | "RAPTOR_CARD_SELECTION"
  | "CARD_REVEAL"
  | "EFFECT_PHASE" // Lower card player uses special effect
  | "ACTION_PHASE" // Higher card player spends action points
  | "ROUND_END";

// Piece types as plain data (not class instances)
export type PieceType = "mother" | "baby" | "scientist";

export interface PieceState {
  id: string;
  type: PieceType;
  tileId: number;
  x: number;
  y: number;
  isAsleep?: boolean; // Baby raptors can be put to sleep
  isFrightened?: boolean; // Scientists can be frightened
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

// Fire token - blocks raptor movement, scientists can pass through but not end on
export interface FireToken {
  id: string;
  tileId: number;
  x: number;
  y: number;
}

// Player type for action phase
export type Player = "raptor" | "scientist";

export interface GameState {
  phase: GamePhase;
  tiles: Tile[];
  // Split piece arrays - each piece type has its own array
  mother: PieceState | null;
  babies: PieceState[];
  scientists: PieceState[];
  scientistReserve: number; // Scientists available for reinforcements (starts at 6 after setup)
  fireTokens: FireToken[];
  holdingPen: HoldingPen;
  raptorCards: CardState;
  scientistCards: CardState;
  // Action phase state
  actionPoints: number; // Remaining action points for current player
  activePlayer: Player | null; // Who has action points this round (higher card player)
  aggressiveActionsUsed: string[]; // Scientist IDs that used aggressive action this round (shoot/capture)
  frightenedThisRound: string[]; // Scientist IDs frightened this round (can't stand up same round)
  asleepThisRound: string[]; // Baby IDs put to sleep this round (can't wake same round)
  motherPaidWoundCost: boolean; // Whether mother has paid her wound cost this round (sleep tokens)
  // Win condition tracking
  motherSleepTokens: number; // Sleep tokens on mother (scientist wins at 5)
  capturedBabies: number; // Babies captured by scientists (scientist wins at 3)
  escapedBabies: number; // Babies that escaped the board (raptor wins at 3)
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
    mother: null,
    babies: [],
    scientists: [],
    scientistReserve: 6, // 10 total - 4 placed during setup = 6 in reserve
    fireTokens: [],
    holdingPen: createInitialHoldingPen(),
    raptorCards: createInitialCardState(),
    scientistCards: createInitialCardState(),
    actionPoints: 0,
    activePlayer: null,
    aggressiveActionsUsed: [],
    frightenedThisRound: [],
    asleepThisRound: [],
    motherPaidWoundCost: false,
    motherSleepTokens: 0,
    capturedBabies: 0,
    escapedBabies: 0,
  };
}
