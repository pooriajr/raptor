import type { ScientistState, BoardPosition } from "@/types/gameState.ts";

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

// Convert ScientistState to BoardPosition for piece class collision detection
// Returns null if scientist is not on the board
export function scientistToBoardPosition(scientist: ScientistState): BoardPosition | null {
  if (!scientist.position) return null;

  return {
    id: scientist.id,
    tileId: scientist.position.tileId,
    x: scientist.position.x,
    y: scientist.position.y,
  };
}

// Convert all board scientists to BoardPosition array
export function boardScientistsToBoardPositions(scientists: Record<string, ScientistState>): BoardPosition[] {
  return getBoardScientists(scientists)
    .map(scientistToBoardPosition)
    .filter((p): p is BoardPosition => p !== null);
}
