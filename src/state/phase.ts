import type { GamePhase, GameState, Player } from "@/types/gameState.ts";

export function getActivePlayerForPhase(state: GameState, phase: GamePhase): Player | null {
  if (phase.startsWith("RAPTOR")) return "raptor";
  if (phase.startsWith("SCIENTIST")) return "scientist";
  if (phase === "EFFECT_PHASE") {
    return state.activeEffectCard?.player ?? null;
  }
  if (phase === "ACTION_PHASE") {
    const effectPlayer = state.activeEffectCard?.player;
    return effectPlayer === "raptor" ? "scientist" : effectPlayer === "scientist" ? "raptor" : null;
  }
  if (phase === "MOTHER_RETURN") return "raptor";
  return state.activePlayer;
}

export function withPhase(state: GameState, phase: GamePhase): GameState {
  return {
    ...state,
    phase,
    activePlayer: getActivePlayerForPhase(state, phase),
  };
}
