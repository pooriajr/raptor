import type { Tile } from "./board.ts";

// Game phases - only SETUP for now, more will be added later
export type GamePhase = "SETUP";

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
