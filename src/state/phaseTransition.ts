import type { GameState, GamePhase, Player } from "@/types/gameState";
import { saveGame } from "@/utils/saveLoad";

/**
 * Helper for transitioning between game phases.
 * - Sets the new phase
 * - Calculates and sets the active player based on the phase
 * - Auto-saves the game (except during setup)
 */
export function transitionToPhase(state: GameState, phase: GamePhase): GameState {
  // Calculate active player based on phase
  const activePlayer: Player | null = phase.startsWith("RAPTOR")
    ? "raptor"
    : phase.startsWith("SCIENTIST")
      ? "scientist"
      : state.activePlayer;

  const newState = {
    ...state,
    phase,
    activePlayer,
  };

  // Auto-save on phase changes (skip setup phase)
  if (phase !== "RAPTOR_SETUP") {
    saveGame(newState);
  }

  return newState;
}
