import type { ScientistState, PieceState } from "@/types/gameState.ts";

// Get all scientists currently on the board
export function getBoardScientists(scientists: Record<string, ScientistState>): ScientistState[] {
  return Object.values(scientists).filter((s) => s.position !== null && !s.isDead);
}

// Get count of scientists in reserve
export function getReserveCount(scientists: Record<string, ScientistState>): number {
  return Object.values(scientists).filter((s) => s.position === null && !s.isDead).length;
}

// Get the first available scientist from reserve (for reinforcements)
export function getNextReserveScientist(scientists: Record<string, ScientistState>): ScientistState | undefined {
  return Object.values(scientists).find((s) => s.position === null && !s.isDead);
}

// Convert ScientistState to PieceState for piece class instantiation
// Returns null if scientist is not on the board
export function scientistToPieceState(scientist: ScientistState): PieceState | null {
  if (!scientist.position) return null;

  return {
    id: scientist.id,
    type: "scientist",
    tileId: scientist.position.tileId,
    x: scientist.position.x,
    y: scientist.position.y,
  };
}

// Convert all board scientists to PieceState array
export function boardScientistsToPieceStates(scientists: Record<string, ScientistState>): PieceState[] {
  return getBoardScientists(scientists)
    .map(scientistToPieceState)
    .filter((p): p is PieceState => p !== null);
}
