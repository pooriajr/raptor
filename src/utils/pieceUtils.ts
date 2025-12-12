import type { PieceState, PieceType, GameState } from "../types/gameState.ts";
import { boardScientistsToPieceStates } from "./scientistUtils.ts";

// Get emoji for a piece type
export function getPieceEmoji(type: PieceType): string {
  switch (type) {
    case "mother":
      return "🦖";
    case "baby":
      return "🦎";
    case "scientist":
      return "🧑‍🔬";
  }
}

// Check if a piece is placed on the board (tileId !== -1)
export function isPlaced(piece: PieceState): boolean {
  return piece.tileId !== -1;
}

// Check if mother is placed on the board
export function isMotherPlaced(state: GameState): boolean {
  return isPlaced(state.mother);
}

// Get all placed babies (on the board)
export function getPlacedBabies(state: GameState): PieceState[] {
  return state.babies.filter(isPlaced);
}

// Get all unplaced babies (in holding pen)
export function getUnplacedBabies(state: GameState): PieceState[] {
  return state.babies.filter((b) => !isPlaced(b));
}

// Count placed babies
export function countPlacedBabies(state: GameState): number {
  return getPlacedBabies(state).length;
}

// Get all placed scientists (on the board) as PieceState
export function getPlacedScientists(state: GameState): PieceState[] {
  return boardScientistsToPieceStates(state.scientists);
}

// Count placed scientists
export function countPlacedScientists(state: GameState): number {
  return getPlacedScientists(state).length;
}
