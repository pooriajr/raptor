import type { GameState, GamePhase, Player } from "@/types/gameState";
import { saveGame } from "@/utils/saveLoad";
import { drawToHand } from "./actions/cardActions";

function getActivePlayerForPhase(state: GameState, phase: GamePhase): Player | null {
  if (phase.startsWith("RAPTOR")) return "raptor";
  if (phase.startsWith("SCIENTIST")) return "scientist";
  if (phase === "EFFECT_PHASE") {
    // Lower card gets the effect - read from activeEffectCard
    return state.activeEffectCard?.player ?? null;
  }
  if (phase === "ACTION_PHASE") {
    // Higher card gets action points - opposite of effect player
    const effectPlayer = state.activeEffectCard?.player;
    return effectPlayer === "raptor" ? "scientist" : effectPlayer === "scientist" ? "raptor" : null;
  }
  return state.activePlayer;
}

/**
 * Helper for transitioning between game phases.
 * - Sets the new phase
 * - Calculates and sets the active player based on the phase
 * - Saves snapshot for effect phase
 * - Auto-saves the game (except during setup)
 */
export function transitionToPhase(state: GameState, phase: GamePhase): GameState {
  const activePlayer = getActivePlayerForPhase(state, phase);

  let newState = {
    ...state,
    phase,
    activePlayer,
  };

  // Draw cards for both players when entering scientist card selection
  if (phase === "SCIENTIST_CARD_SELECTION") {
    newState = {
      ...newState,
      scientistCards: drawToHand(newState.scientistCards),
      raptorCards: drawToHand(newState.raptorCards),
    };
  }

  // Clear observation when card reveal starts (both cards will be shown anyway)
  if (phase === "CARD_REVEAL" && newState.mother.observationActive) {
    newState = {
      ...newState,
      mother: { ...newState.mother, observationActive: false },
    };
  }

  // Save snapshot when entering effect phase
  if (phase === "EFFECT_PHASE") {
    newState = {
      ...newState,
      undoSnapshot: newState,
    };
  }

  // Clear effect phase state when leaving
  if (state.phase === "EFFECT_PHASE" && phase !== "EFFECT_PHASE") {
    newState = {
      ...newState,
      undoSnapshot: null,
    };
  }

  // Auto-save on phase changes (skip setup phase)
  if (phase !== "RAPTOR_SETUP") {
    saveGame(newState);
  }

  return newState;
}
