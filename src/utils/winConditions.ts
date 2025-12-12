import type { GameState, Player, WinCondition } from "@/types/gameState.ts";

export interface WinResult {
  winner: Player | null;
  condition: WinCondition | null;
}

/**
 * Check if any win condition has been met.
 *
 * Win conditions:
 * - Raptor wins: 3 babies escaped OR no scientists on board
 * - Scientist wins: Mother has 5 sleep tokens OR 3 babies captured
 */
export function checkWinConditions(state: GameState): WinResult {
  // Raptor win: 3 babies escaped
  const escapedCount = state.babies.filter((b) => b.isEscaped).length;
  if (escapedCount >= 3) {
    return { winner: "raptor", condition: "babies_escaped" };
  }

  // Raptor win: No scientists on board
  const scientistsOnBoard = Object.values(state.scientists).filter((s) => s.position !== null);
  if (scientistsOnBoard.length === 0) {
    return { winner: "raptor", condition: "scientists_eliminated" };
  }

  // Scientist win: Mother has 5 sleep tokens
  if (state.motherSleepTokens >= 5) {
    return { winner: "scientist", condition: "mother_neutralized" };
  }

  // Scientist win: 3 babies captured
  const capturedCount = state.babies.filter((b) => b.isCaptured).length;
  if (capturedCount >= 3) {
    return { winner: "scientist", condition: "babies_captured" };
  }

  return { winner: null, condition: null };
}
