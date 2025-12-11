import type { Tile } from "./board.ts";
import { createBoard } from "./board.ts";

// Game phases - raptor sets up first, then scientist, then card selection begins
export type GamePhase =
  | "MAIN_MENU"
  | "RAPTOR_SETUP"
  | "SCIENTIST_SETUP"
  | "SCIENTIST_READY"
  | "SCIENTIST_CARD_SELECTION"
  | "RAPTOR_READY"
  | "RAPTOR_CARD_SELECTION"
  | "CARD_REVEAL"
  | "EFFECT_PHASE" // Lower card player uses special effect
  | "ACTION_PHASE" // Higher card player spends action points
  | "MOTHER_RETURN" // After disappearance, raptor places mother back on board
  | "ROUND_END";

// Piece types as plain data (not class instances)
export type PieceType = "mother" | "baby" | "scientist";

export interface PieceState {
  id: string;
  type: PieceType;
  tileId: number; // -1 means unplaced (in holding pen)
  x: number;
  y: number;
  isAsleep?: boolean; // Baby raptors can be put to sleep
  isFrightened?: boolean; // Scientists can be frightened
}

// Card state for each player
export interface CardState {
  deck: number[]; // Card values 1-9 remaining in deck
  hand: number[]; // Card values currently in hand (up to 3)
  played: number | null; // Card played this round
  discard: number[]; // Cards that have been played (visible to opponent)
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

// Position on the board
export interface Position {
  tileId: number;
  x: number;
  y: number;
}

// UI/Interaction state - transient UI selections (not game logic)
export interface InteractionState {
  // Card selection
  selectedCard: number | null;
  isNewDraw: boolean;
  // Actor selection (used for both action phase and effect phase)
  selectedActorId: string | null;
}

// Create initial interaction state
export function createInitialInteractionState(): InteractionState {
  return {
    selectedCard: null,
    isNewDraw: false,
    selectedActorId: null,
  };
}

export interface GameState {
  phase: GamePhase;
  tiles: Tile[];
  // All pieces exist from start with tileId: -1 meaning unplaced
  mother: PieceState;
  babies: PieceState[];
  scientists: PieceState[];
  scientistReserve: number; // Scientists available for reinforcements (starts at 6 after setup)
  fireTokens: FireToken[];
  raptorCards: CardState;
  scientistCards: CardState;
  // Action phase state
  actionPoints: number; // Remaining action points for current player
  activePlayer: Player | null; // Who has action points this round (higher card player)
  aggressiveActionsUsed: string[]; // Scientist IDs that used aggressive action this round (shoot/capture)
  frightenedThisRound: string[]; // Scientist IDs frightened this round (can't stand up same round)
  asleepThisRound: string[]; // Baby IDs put to sleep this round (can't wake same round)
  motherPaidWoundCost: boolean; // Whether mother has paid her wound cost this round (sleep tokens)
  // Disappearance tracking
  motherDisappeared: boolean; // Whether mother disappeared this round (needs to return after action phase)
  observationActive: boolean; // Whether raptor can see scientist's card next selection (from disappearance)
  // Win condition tracking
  motherSleepTokens: number; // Sleep tokens on mother (scientist wins at 5)
  capturedBabies: number; // Babies captured by scientists (scientist wins at 3)
  escapedBabies: number; // Babies that escaped the board (raptor wins at 3)
  // UI/Interaction state - per player
  raptorInteraction: InteractionState;
  scientistInteraction: InteractionState;
  // Effect phase - snapshot/revert pattern
  effectActionsRemaining: number;
  effectPhaseSavedState: GameState | null;
  // Action phase saved state for reset
  actionPhaseSavedState: GameState | null;
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
    discard: [],
  };
}

// Create mother raptor (unplaced initially)
export function createInitialMother(): PieceState {
  return {
    id: "mother",
    type: "mother",
    tileId: -1, // -1 means unplaced
    x: -1,
    y: -1,
  };
}

// Create all 5 baby raptors with stable IDs (unplaced initially)
export function createInitialBabies(): PieceState[] {
  return [0, 1, 2, 3, 4].map((i) => ({
    id: `baby-${i}`,
    type: "baby" as const,
    tileId: -1, // -1 means unplaced
    x: -1,
    y: -1,
  }));
}

// Create all 10 scientists with stable IDs (unplaced initially)
export function createInitialScientists(): PieceState[] {
  return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => ({
    id: `scientist-${i}`,
    type: "scientist" as const,
    tileId: -1, // -1 means unplaced
    x: -1,
    y: -1,
  }));
}

// Create initial game state - starts at main menu
export function createInitialGameState(): GameState {
  return {
    phase: "MAIN_MENU",
    tiles: createBoard(),
    mother: createInitialMother(),
    babies: createInitialBabies(),
    scientists: createInitialScientists(),
    scientistReserve: 6, // 10 total - 4 placed during setup = 6 in reserve
    fireTokens: [],
    raptorCards: createInitialCardState(),
    scientistCards: createInitialCardState(),
    actionPoints: 0,
    activePlayer: "raptor",
    aggressiveActionsUsed: [],
    frightenedThisRound: [],
    asleepThisRound: [],
    motherPaidWoundCost: false,
    motherDisappeared: false,
    observationActive: false,
    motherSleepTokens: 0,
    capturedBabies: 0,
    escapedBabies: 0,
    raptorInteraction: createInitialInteractionState(),
    scientistInteraction: createInitialInteractionState(),
    effectActionsRemaining: 0,
    effectPhaseSavedState: null,
    actionPhaseSavedState: null,
  };
}
