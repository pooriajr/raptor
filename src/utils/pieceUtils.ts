import type { GameState, BabyState, BoardPosition } from "../types/gameState.ts";
import { boardScientistsToBoardPositions } from "./scientistUtils.ts";

// Piece types for display purposes
export type PieceType = "mother" | "baby" | "scientist";

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

// Check if mother is placed on the board
export function isMotherPlaced(state: GameState): boolean {
  return state.mother.position !== null;
}

// Get all babies on the board (not escaped/captured)
export function getBoardBabies(state: GameState): BabyState[] {
  return Object.values(state.babies).filter((b) => b.position !== null && !b.isEscaped && !b.isCaptured);
}

// Get all unplaced babies (no position, not escaped/captured)
export function getUnplacedBabies(state: GameState): BabyState[] {
  return Object.values(state.babies).filter((b) => b.position === null && !b.isEscaped && !b.isCaptured);
}

// Count babies on board
export function countPlacedBabies(state: GameState): number {
  return getBoardBabies(state).length;
}

// Count scientists on board
export function countPlacedScientists(state: GameState): number {
  return boardScientistsToBoardPositions(state.scientists).length;
}

// Convert BabyState to BoardPosition for piece class collision detection
export function babyToBoardPosition(baby: BabyState): BoardPosition | null {
  if (!baby.position) return null;
  return {
    id: baby.id,
    tileId: baby.position.tileId,
    x: baby.position.x,
    y: baby.position.y,
  };
}

// Convert MotherState to BoardPosition for piece class collision detection
export function motherToBoardPosition(state: GameState): BoardPosition | null {
  if (!state.mother.position) return null;
  return {
    id: state.mother.id,
    tileId: state.mother.position.tileId,
    x: state.mother.position.x,
    y: state.mother.position.y,
  };
}

// Get all board babies as BoardPosition array
export function boardBabiesToBoardPositions(state: GameState): BoardPosition[] {
  return getBoardBabies(state)
    .map(babyToBoardPosition)
    .filter((p): p is BoardPosition => p !== null);
}
