import type { GameState, GamePhase, Player } from "@/types/gameState";
import { saveGame } from "@/utils/saveLoad";

function getActivePlayerForPhase(state: GameState, phase: GamePhase): Player | null {
  if (phase.startsWith("RAPTOR")) return "raptor";
  if (phase.startsWith("SCIENTIST")) return "scientist";
  if (phase === "EFFECT_PHASE") {
    // Lower card gets the effect
    return state.raptorCards.played! < state.scientistCards.played! ? "raptor" : "scientist";
  }
  if (phase === "ACTION_PHASE") {
    // Higher card gets action points
    return state.raptorCards.played! > state.scientistCards.played! ? "raptor" : "scientist";
  }
  return state.activePlayer;
}

/**
 * Helper for transitioning between game phases.
 * - Sets the new phase
 * - Calculates and sets the active player based on the phase
 * - Auto-saves the game (except during setup)
 */
export function transitionToPhase(state: GameState, phase: GamePhase): GameState {
  const activePlayer = getActivePlayerForPhase(state, phase);

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
