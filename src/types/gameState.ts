import type { Tile } from "./board.ts";
import { createBoard } from "./board.ts";

// Game phases - raptor sets up first, then scientist, then card selection begins
export type GamePhase =
  | "RAPTOR_SETUP"
  | "SCIENTIST_SETUP"
  | "SCIENTIST_CARD_SELECTION";

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

export interface GameState {
  phase: GamePhase;
  tiles: Tile[];
  pieces: PieceState[];
  holdingPen: HoldingPen;
}

// Initial holding pen state for setup
export function createInitialHoldingPen(): HoldingPen {
  return {
    scientists: 10,
    babies: 5,
    mother: 1,
  };
}

// Create initial game state - raptor sets up first
export function createInitialGameState(): GameState {
  return {
    phase: "RAPTOR_SETUP",
    tiles: createBoard(),
    pieces: [],
    holdingPen: createInitialHoldingPen(),
  };
}
