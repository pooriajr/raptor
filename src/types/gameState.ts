import type { Tile } from "./board.ts";
import { createBoard } from "./board.ts";
import type { CardId, CardInfo } from "@/data/cards.ts";
import { raptorCards, scientistCards, shuffleCards } from "@/utils/cardUtils.ts";

// Game phases - raptor sets up first, then scientist, then card selection begins
export type GamePhase =
  | "MAIN_MENU"
  | "RAPTOR_SETUP"
  | "SCIENTIST_SETUP"
  | "SCIENTIST_CARD_SELECTION"
  | "RAPTOR_CARD_SELECTION"
  | "CARD_REVEAL"
  | "EFFECT_PHASE" // Lower card player uses special effect
  | "ACTION_PHASE" // Higher card player spends action points
  | "MOTHER_RETURN" // After disappearance, raptor places mother back on board
  | "ROUND_END"
  | "GAME_OVER";

// Win conditions - describes how a player won
export type WinCondition =
  | "babies_escaped" // Raptor: 3 babies escaped
  | "scientists_eliminated" // Raptor: No scientists on board
  | "mother_neutralized" // Scientist: Mother has 5 sleep tokens
  | "babies_captured"; // Scientist: 3 babies captured

// Player type for action phase
export type Player = "raptor" | "scientist";

// Position on the board - used for collision detection in piece classes
export interface BoardPosition {
  id: string;
  tileId: number;
  x: number;
  y: number;
}

// Scientist state - consolidated in one place
// position: null = in reserve or dead, otherwise board coordinates
export interface ScientistState {
  id: string;
  position: { tileId: number; x: number; y: number } | null;
  isDead: boolean;
  isFrightened: boolean;
  hasUsedAggressiveAction: boolean; // Resets each round
  frightenedThisRound: boolean; // Can't stand up same round
}

// Baby raptor state - consolidated in one place
// position: null = not on board (unplaced, escaped, or captured)
export interface BabyState {
  id: string;
  position: { tileId: number; x: number; y: number } | null;
  isAsleep: boolean;
  isEscaped: boolean;
  isCaptured: boolean;
  asleepThisRound: boolean; // Can't wake up same round put to sleep
}

// Mother raptor state - consolidated in one place
// position: null = unplaced or disappeared
export interface MotherState {
  id: string;
  position: { tileId: number; x: number; y: number } | null;
  lastPosition: { tileId: number; x: number; y: number } | null;
  sleepTokens: number;
  paidWoundCost: boolean; // Resets each round
  disappeared: boolean; // Resets each round
  observationActive: boolean;
}

// Card state for each player
export interface CardState {
  deck: CardInfo[]; // Cards remaining in deck
  hand: CardInfo[]; // Cards currently in hand (up to 3)
  discard: CardInfo[]; // Cards that have been played (visible to opponent)
}

// Fire token - blocks raptor movement; scientists can move onto fire but must leave before ending their turn
export interface FireToken {
  id: string;
  tileId: number;
  x: number;
  y: number;
}

// UI/Interaction state - transient UI selections (not game logic)
export interface InteractionState {
  // Card selection
  selectedCard: CardId | null;
  isNewDraw: boolean;
  // Privacy screen (pass-and-play)
  privacyDismissed: boolean;
  // Actor selection (used for both action phase and effect phase)
  selectedActorId: string | null;
}

// Create initial interaction state
export function createInitialInteractionState(): InteractionState {
  return {
    selectedCard: null,
    isNewDraw: false,
    privacyDismissed: false,
    selectedActorId: null,
  };
}

export interface GameState {
  phase: GamePhase;
  tiles: Tile[];
  // All pieces use consolidated state types
  mother: MotherState;
  babies: Record<string, BabyState>;
  scientists: Record<string, ScientistState>;
  fireTokens: FireToken[];
  raptorCards: CardState;
  scientistCards: CardState;
  // Round resolution state
  activeEffectCard: CardInfo | null; // The lower card (determines effect), null if tied
  actionPoints: number; // Card difference (for higher card player)
  activePlayer: Player | null; // Current active player (effect player, then action player)
  // Win condition tracking
  winner: Player | null; // Winner of the game (null if game ongoing)
  winCondition: WinCondition | null; // How the winner won
  // UI/Interaction state - per player
  raptorInteraction: InteractionState;
  scientistInteraction: InteractionState;
  // Effect phase
  effectActionsRemaining: number;
  // Undo snapshot - saved at start of effect/action phase for reset functionality
  undoSnapshot: GameState | null;
}

// Create initial card state with full shuffled deck
export function createInitialCardState(cards: CardInfo[]): CardState {
  return {
    deck: shuffleCards(cards),
    hand: [],
    discard: [],
  };
}

// Create mother raptor (unplaced initially)
export function createInitialMother(): MotherState {
  return {
    id: "mother",
    position: null,
    lastPosition: null,
    sleepTokens: 0,
    paidWoundCost: false,
    disappeared: false,
    observationActive: false,
  };
}

// Create all 5 baby raptors with stable IDs (unplaced initially)
export function createInitialBabies(): Record<string, BabyState> {
  const babies: Record<string, BabyState> = {};
  for (let i = 0; i < 5; i++) {
    const id = `baby-${i}`;
    babies[id] = {
      id,
      position: null,
      isAsleep: false,
      isEscaped: false,
      isCaptured: false,
      asleepThisRound: false,
    };
  }
  return babies;
}

// Create all 10 scientists with stable IDs (in reserve initially)
export function createInitialScientists(): Record<string, ScientistState> {
  const scientists: Record<string, ScientistState> = {};
  for (let i = 0; i < 10; i++) {
    const id = `scientist-${i}`;
    scientists[id] = {
      id,
      position: null,
      isDead: false,
      isFrightened: false,
      hasUsedAggressiveAction: false,
      frightenedThisRound: false,
    };
  }
  return scientists;
}

// Create initial game state - starts at main menu
export function createInitialGameState(): GameState {
  return {
    phase: "MAIN_MENU",
    tiles: createBoard(),
    mother: createInitialMother(),
    babies: createInitialBabies(),
    scientists: createInitialScientists(),
    fireTokens: [],
    raptorCards: createInitialCardState(raptorCards),
    scientistCards: createInitialCardState(scientistCards),
    activeEffectCard: null,
    actionPoints: 0,
    activePlayer: "raptor",
    winner: null,
    winCondition: null,
    raptorInteraction: createInitialInteractionState(),
    scientistInteraction: createInitialInteractionState(),
    effectActionsRemaining: 0,
    undoSnapshot: null,
  };
}
