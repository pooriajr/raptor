import type { GameState, Player } from "@/types/gameState.ts";

export function isPhase(state: GameState, phase: GameState["phase"]): boolean {
  return state.phase === phase;
}

export function isActionPhaseForPlayer(state: GameState, player: Player): boolean {
  return isPhase(state, "ACTION_PHASE") && state.activePlayer === player;
}

export function hasActionPoints(state: GameState, cost = 1): boolean {
  return state.actionPoints >= cost;
}

export function isSetupPhase(state: GameState): boolean {
  return isPhase(state, "RAPTOR_SETUP") || isPhase(state, "SCIENTIST_SETUP");
}
